import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, extname, join, resolve } from 'node:path';

import type { Job } from 'bullmq';
import { QueueEvents, Worker } from 'bullmq';
import { Pool } from 'pg';

const QUEUE_NAME = 'paper-import';
const JOB_NAME = 'extract-paper';
const DEFAULT_STORAGE_DIR = '/app/apps/api/uploads';
const DEFAULT_TOOLS_DIR = '/app/apps/extractor/question-extractor';
const DEFAULT_PYTHON_BIN = '/opt/question-extractor-venv/bin/python';
const SCRIPT_TIMEOUT_MS = 120_000;

type PaperImportJobData = {
  jobId: string;
};

type InputOptions = {
  layout?: string;
  variant?: string;
  dpi?: number;
  imageFormat?: string;
  quality?: number;
};

type PaperImportJobRow = {
  id: string;
  questionPdfPath: string;
  questionPdfName: string;
  answerPdfPath: string;
  inputOptions: InputOptions;
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

const database = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function storageRoot() {
  return process.env.PAPER_IMPORT_STORAGE_DIR ?? DEFAULT_STORAGE_DIR;
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

async function loadImportJob(id: string) {
  const result = await database.query<PaperImportJobRow>(
    `
    SELECT
      "id",
      "questionPdfPath",
      "questionPdfName",
      "answerPdfPath",
      "inputOptions"
    FROM "PaperImportJob"
    WHERE "id" = $1
    `,
    [id],
  );

  const job = result.rows[0];
  if (!job) {
    throw new Error(`PDF 추출 작업을 찾을 수 없습니다: ${id}`);
  }

  return job;
}

async function markProcessing(id: string) {
  await database.query(
    `
    UPDATE "PaperImportJob"
    SET
      "status" = 'PROCESSING',
      "startedAt" = COALESCE("startedAt", NOW()),
      "updatedAt" = NOW(),
      "errorMessage" = NULL
    WHERE "id" = $1
    `,
    [id],
  );
}

async function markCompleted(id: string, resultJsonPath: string) {
  await database.query(
    `
    UPDATE "PaperImportJob"
    SET
      "status" = 'COMPLETED',
      "resultJsonPath" = $2,
      "completedAt" = NOW(),
      "updatedAt" = NOW()
    WHERE "id" = $1
    `,
    [id, resultJsonPath],
  );
}

async function markFailed(id: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  await database.query(
    `
    UPDATE "PaperImportJob"
    SET
      "status" = 'FAILED',
      "errorMessage" = $2,
      "failedAt" = NOW(),
      "updatedAt" = NOW()
    WHERE "id" = $1
    `,
    [id, message.slice(0, 4000)],
  );
}

async function markPendingRetry(id: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  await database.query(
    `
    UPDATE "PaperImportJob"
    SET
      "status" = 'PENDING',
      "errorMessage" = $2,
      "updatedAt" = NOW()
    WHERE "id" = $1
    `,
    [id, message.slice(0, 4000)],
  );
}

function runPython(scriptPath: string, args: string[]) {
  return new Promise<void>((resolvePromise, reject) => {
    const child = spawn(pythonBin(), [scriptPath, ...args], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('PDF 추출 시간이 초과되었습니다.'));
    }, SCRIPT_TIMEOUT_MS);

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
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

function resolveMimeType(path: string) {
  const extension = extname(path).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  return 'image/webp';
}

async function toResponse(
  manifest: QuestionManifest,
  answerManifest: AnswerManifest,
  questionDir: string,
  sourceName: string,
) {
  const answers = new Map(
    (answerManifest.answers ?? []).map((answer) => [answer.number, answer]),
  );
  const warnings = [...(answerManifest.warnings ?? [])];
  const questions = await Promise.all(
    [...(manifest.questions ?? [])]
      .sort((a, b) => a.number - b.number)
      .map(async (question) => {
        const answer = answers.get(question.number);
        if (!answer) {
          warnings.push(`${question.number}번 문항의 답안을 찾지 못했습니다.`);
        }
        const imagePath = join(questionDir, question.image);
        const image = await readFile(imagePath);

        return {
          number: question.number,
          type: 'MULTIPLE_CHOICE',
          choiceCount: 5,
          answerChoice: answer?.answer_index ?? null,
          answerText: null,
          explanation: null,
          rawText: question.textLayer?.text?.trim() || null,
          promptText: question.textLayer?.promptText?.trim() || null,
          passageText: question.textLayer?.passageText?.trim() || null,
          choiceTexts: question.textLayer?.choiceTexts ?? [],
          points: answer?.points ?? 5,
          recommendedTimeSeconds: null,
          recommendedTagIds: [],
          tagIds: [],
          image: {
            filename: basename(question.image),
            mimeType: resolveMimeType(question.image),
            base64: image.toString('base64'),
          },
          textLayer: question.textLayer ?? null,
        };
      }),
  );

  return {
    paperSuggestion: {
      title: sourceName.replace(/\.pdf$/i, ''),
      questionCount: questions.length,
    },
    warnings,
    questions,
  };
}

async function processImportJob(importJob: PaperImportJobRow) {
  const workDir = await mkdtemp(join(tmpdir(), 'kichulbot-paper-import-'));

  try {
    const questionOutRoot = join(workDir, 'question-output');
    const answerOutRoot = join(workDir, 'answer-output');
    const questionScript = join(toolsDir(), 'extract_questions.py');
    const answerScript = join(toolsDir(), 'extract_answers.py');
    const options = importJob.inputOptions;

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
    await runPython(answerScript, [
      storagePath(importJob.answerPdfPath),
      '--out',
      answerOutRoot,
    ]);

    const questionDir = join(
      questionOutRoot,
      basename(storagePath(importJob.questionPdfPath), '.pdf'),
    );
    const answerDir = join(
      answerOutRoot,
      basename(storagePath(importJob.answerPdfPath), '.pdf'),
    );
    const manifest = await readJson<QuestionManifest>(
      join(questionDir, 'manifest.json'),
    );
    const answers = await readJson<AnswerManifest>(
      join(answerDir, 'answers.json'),
    );
    const response = await toResponse(
      manifest,
      answers,
      questionDir,
      importJob.questionPdfName,
    );
    const resultJsonPath = join(
      'paper-import-jobs',
      importJob.id,
      'result.json',
    );

    await writeFile(
      storagePath(resultJsonPath),
      JSON.stringify(response, null, 2),
      'utf8',
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
  await database.end();
}

process.on('SIGTERM', () => {
  void shutdown().then(() => process.exit(0));
});
process.on('SIGINT', () => {
  void shutdown().then(() => process.exit(0));
});
