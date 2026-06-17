import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, extname, join, resolve } from 'node:path';

import type {
  PaperImportDraftResponse,
  PaperImportJobPayloadResponse,
} from '@kichulbot/api-contract/papers';
import type { Job } from 'bullmq';
import { QueueEvents, Worker } from 'bullmq';

const QUEUE_NAME = 'paper-import';
const JOB_NAME = 'extract-paper';
const DEFAULT_STORAGE_DIR = '/app/apps/api/uploads';
const DEFAULT_TOOLS_DIR = '/app/apps/extractor/question-extractor';
const DEFAULT_PYTHON_BIN = '/opt/question-extractor-venv/bin/python';
const DEFAULT_API_BASE_URL = 'http://api:4000/api';
const SCRIPT_TIMEOUT_MS = 300_000;

type PaperImportJobData = {
  jobId: string;
};

type PaperImportJobPayload = PaperImportJobPayloadResponse['job'];

type ApiEnvelope<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error?: {
        message?: string | string[];
      };
    };

type QuestionManifest = {
  questions?: Array<{
    number: number;
    image: string;
    textLayer?: {
      text: string;
      promptText?: string;
      passageText?: string;
      choiceTexts?: string[];
      lines: Array<{
        text: string;
        box: [number, number, number, number];
      }>;
    };
  }>;
};

type AnswerManifest = {
  answers?: Array<{
    number: number;
    answer_index?: number;
    points?: number;
  }>;
  warnings?: string[];
};

const connection = {
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
};

function storageRoot() {
  return process.env.PAPER_IMPORT_STORAGE_DIR ?? DEFAULT_STORAGE_DIR;
}

function apiBaseUrl() {
  return (
    process.env.PAPER_IMPORT_API_BASE_URL ?? DEFAULT_API_BASE_URL
  ).replace(/\/+$/, '');
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 환경 변수가 필요합니다.`);
  }
  return value;
}

async function apiRequest<T>(
  path: string,
  init: RequestInit & { body?: string } = {},
) {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${requiredEnv('PAPER_IMPORT_SERVICE_TOKEN')}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  const body = await response.text();
  const envelope = body
    ? (JSON.parse(body) as ApiEnvelope<T>)
    : ({ success: true, data: undefined as T } satisfies ApiEnvelope<T>);

  if (!response.ok || !envelope.success) {
    const message =
      !envelope.success && envelope.error?.message
        ? Array.isArray(envelope.error.message)
          ? envelope.error.message.join('\n')
          : envelope.error.message
        : body;
    throw new Error(`API 요청에 실패했습니다: ${response.status} ${message}`);
  }

  return envelope.data;
}

function toolsDir() {
  const configured =
    process.env.QUESTION_EXTRACTOR_TOOLS_DIR ?? DEFAULT_TOOLS_DIR;
  if (existsSync(configured)) return configured;

  return resolve(process.cwd(), 'apps/extractor/question-extractor');
}

function pythonBin() {
  const configured = process.env.PAPER_IMPORT_PYTHON_BIN ?? DEFAULT_PYTHON_BIN;
  return existsSync(configured) ? configured : 'python3';
}

function storagePath(relativePath: string) {
  return join(storageRoot(), relativePath);
}

function safeStem(path: string) {
  const stem = basename(path, '.pdf').normalize('NFC');
  return (
    stem
      .replace(/[^0-9A-Za-z가-힣._-]+/g, '_')
      .replace(/^[._-]+|[._-]+$/g, '') || 'pdf'
  );
}

async function loadImportJob(id: string) {
  const result = await apiRequest<{ job: PaperImportJobPayload }>(
    `/admin/paper-import-jobs/${id}`,
  );

  return result.job;
}

async function markProcessing(id: string) {
  await apiRequest(`/admin/paper-import-jobs/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'PROCESSING' }),
  });
}

async function markCompleted(id: string, resultJsonPath: string) {
  await apiRequest(`/admin/paper-import-jobs/${id}/result`, {
    method: 'PUT',
    body: JSON.stringify({ resultJsonPath }),
  });
}

async function publishImportJob(id: string) {
  await apiRequest(`/admin/paper-import-jobs/${id}/paper`, {
    method: 'POST',
  });
}

async function markFailed(id: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  await apiRequest(`/admin/paper-import-jobs/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'FAILED',
      errorMessage: message.slice(0, 4000),
    }),
  });
}

async function markPendingRetry(id: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  await apiRequest(`/admin/paper-import-jobs/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'PENDING',
      errorMessage: message.slice(0, 4000),
    }),
  });
}

function runPython(scriptPath: string, args: string[]) {
  return new Promise<void>((resolvePromise, reject) => {
    const child = spawn(pythonBin(), [scriptPath, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('PDF 추출 시간이 초과되었습니다.'));
    }, SCRIPT_TIMEOUT_MS);

    child.stdout.on('data', (chunk: Buffer) => {
      process.stdout.write(chunk);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(
        new Error(`PDF 추출 스크립트를 실행하지 못했습니다: ${error.message}`),
      );
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(new Error(stderr.trim() || 'PDF 추출 스크립트가 실패했습니다.'));
    });
  });
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

function resolveContentType(imageName: string) {
  const extension = extname(imageName).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  return 'image/webp';
}

async function createDraftResult(
  importJob: PaperImportJobPayload,
  manifest: QuestionManifest,
  answerManifest: AnswerManifest,
  questionDir: string,
): Promise<PaperImportDraftResponse> {
  const questions = [...(manifest.questions ?? [])].sort(
    (a, b) => a.number - b.number,
  );
  if (questions.length === 0) {
    throw new Error('추출된 문항이 없습니다.');
  }
  if (
    importJob.paperInput.questionCount &&
    questions.length > importJob.paperInput.questionCount
  ) {
    throw new Error('추출된 문항 수는 문제지 문항 수를 넘을 수 없습니다.');
  }

  const answers = new Map(
    (answerManifest.answers ?? []).map((answer) => [answer.number, answer]),
  );
  const missingAnswerNumbers = questions
    .filter((question) => !answers.has(question.number))
    .map((question) => question.number);
  if (missingAnswerNumbers.length > 0) {
    throw new Error(
      `답안을 찾지 못한 문항이 있습니다: ${missingAnswerNumbers.join(', ')}`,
    );
  }

  const draftQuestions = await Promise.all(
    questions.map(async (question) => {
      const answer = answers.get(question.number);
      if (!answer) {
        throw new Error(`${question.number}번 문항의 답안을 찾지 못했습니다.`);
      }

      const sourcePath = join(questionDir, question.image);
      const image = await readFile(sourcePath);
      const filename = question.image.replace(/[\\/]+/g, '_');
      const textLayer = question.textLayer
        ? {
            ...question.textLayer,
            choiceTexts: question.textLayer.choiceTexts ?? [],
          }
        : null;

      return {
        number: question.number,
        type: 'MULTIPLE_CHOICE' as const,
        choiceCount: 5,
        gradingPolicy: 'EXACT' as const,
        answerChoice: answer.answer_index ?? null,
        answerText: null,
        explanation: null,
        points: answer.points ?? 5,
        recommendedTimeSeconds: null,
        rawText: textLayer?.text?.trim() || null,
        promptText: textLayer?.promptText?.trim() || null,
        passageText: textLayer?.passageText?.trim() || null,
        choiceTexts: textLayer?.choiceTexts ?? [],
        recommendedTagIds: [],
        recommendedTagMatches: [],
        tagIds: [],
        image: {
          filename,
          mimeType: resolveContentType(question.image),
          base64: image.toString('base64'),
        },
        textLayer,
      };
    }),
  );

  return {
    paperSuggestion: {
      title: importJob.paperInput.title,
      questionCount:
        importJob.paperInput.questionCount ?? draftQuestions.length,
    },
    warnings: answerManifest.warnings ?? [],
    questions: draftQuestions,
  } satisfies PaperImportDraftResponse;
}

async function processImportJob(importJob: PaperImportJobPayload) {
  const workDir = await mkdtemp(join(tmpdir(), 'kichulbot-paper-import-'));

  try {
    console.log(`PDF 가져오기 작업을 시작합니다: ${importJob.id}`);
    const questionOutRoot = join(workDir, 'question-output');
    const answerOutRoot = join(workDir, 'answer-output');
    const questionScript = join(toolsDir(), 'extract_questions.py');
    const answerScript = join(toolsDir(), 'extract_answers.py');
    const options = importJob.inputOptions;

    console.log(`문제 PDF 추출을 시작합니다: ${importJob.questionPdfName}`);
    await runPython(questionScript, [
      storagePath(importJob.questionPdfPath),
      '--layout',
      options.layout ?? 'korean-history',
      '--variant',
      options.variant ?? 'odd',
      '--dpi',
      String(options.dpi ?? 216),
      '--image-format',
      options.imageFormat ?? 'webp',
      '--quality',
      String(options.quality ?? 82),
      '--out',
      questionOutRoot,
    ]);
    console.log(`문제 PDF 추출을 완료했습니다: ${importJob.questionPdfName}`);

    console.log(`답안 PDF 추출을 시작합니다: ${importJob.id}`);
    await runPython(answerScript, [
      storagePath(importJob.answerPdfPath),
      '--out',
      answerOutRoot,
    ]);
    console.log(`답안 PDF 추출을 완료했습니다: ${importJob.id}`);

    const questionDir = join(
      questionOutRoot,
      safeStem(storagePath(importJob.questionPdfPath)),
    );
    const answerDir = join(
      answerOutRoot,
      safeStem(storagePath(importJob.answerPdfPath)),
    );
    const manifest = await readJson<QuestionManifest>(
      join(questionDir, 'manifest.json'),
    );
    const answers = await readJson<AnswerManifest>(
      join(answerDir, 'answers.json'),
    );
    console.log(
      `PDF 추출 결과 JSON 생성을 시작합니다: job=${importJob.id}, questions=${manifest.questions?.length ?? 0}, answers=${answers.answers?.length ?? 0}`,
    );
    const draftResult = await createDraftResult(
      importJob,
      manifest,
      answers,
      questionDir,
    );
    const resultJsonPath = join(
      'paper-import-jobs',
      importJob.id,
      'result.json',
    );
    await mkdir(join(storageRoot(), 'paper-import-jobs', importJob.id), {
      recursive: true,
    });
    await writeFile(
      storagePath(resultJsonPath),
      JSON.stringify(draftResult, null, 2),
      'utf8',
    );
    console.log(
      `PDF 추출 결과 JSON 생성을 완료했습니다: job=${importJob.id}, result=${resultJsonPath}`,
    );

    return resultJsonPath;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function handleJob(job: Job<PaperImportJobData>) {
  if (job.name !== JOB_NAME) return;

  const { jobId } = job.data;
  await markProcessing(jobId);

  try {
    const importJob = await loadImportJob(jobId);
    const resultJsonPath = await processImportJob(importJob);
    await markCompleted(jobId, resultJsonPath);
    await publishImportJob(jobId);
  } catch (error) {
    const maxAttempts = job.opts.attempts ?? 1;
    const currentAttempt = job.attemptsMade + 1;
    if (currentAttempt >= maxAttempts) {
      await markFailed(jobId, error);
    } else {
      await markPendingRetry(jobId, error);
    }
    throw error;
  }
}

const worker = new Worker<PaperImportJobData>(QUEUE_NAME, handleJob, {
  connection,
  concurrency: 1,
});

const queueEvents = new QueueEvents(QUEUE_NAME, { connection });

worker.on('ready', () => {
  console.log('PDF 추출 워커를 시작했습니다.');
});
worker.on('failed', (job, error) => {
  console.error(`PDF 추출 작업이 실패했습니다: ${job?.data.jobId}`, error);
});

async function shutdown() {
  await worker.close();
  await queueEvents.close();
}

process.on('SIGTERM', () => {
  void shutdown().then(() => process.exit(0));
});
process.on('SIGINT', () => {
  void shutdown().then(() => process.exit(0));
});
