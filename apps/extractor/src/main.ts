import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  unlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, resolve } from 'node:path';

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { Job } from 'bullmq';
import { QueueEvents, Worker } from 'bullmq';
import { Pool } from 'pg';

const QUEUE_NAME = 'paper-import';
const JOB_NAME = 'extract-paper';
const DEFAULT_STORAGE_DIR = '/app/apps/api/uploads';
const DEFAULT_TOOLS_DIR = '/app/apps/extractor/question-extractor';
const DEFAULT_PYTHON_BIN = '/opt/question-extractor-venv/bin/python';
const SCRIPT_TIMEOUT_MS = 300_000;

type PaperImportJobData = {
  jobId: string;
};

type InputOptions = {
  layout?: string;
  variant?: string;
  dpi?: number;
  imageFormat?: string;
  quality?: number;
  examId?: string;
};

type PaperInput = {
  title: string;
  examId: string;
  year: number;
  month?: number | null;
  grade?: number | null;
  round?: number | null;
  questionCount?: number;
  isPublished?: boolean;
};

type PaperImportJobRow = {
  id: string;
  questionPdfPath: string;
  questionPdfName: string;
  answerPdfPath: string;
  inputOptions: InputOptions;
  paperInput: PaperInput;
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

type QuestionManifestQuestion = NonNullable<
  QuestionManifest['questions']
>[number];

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

function publicBaseUrl() {
  if (storageDriver() === 'r2') {
    return requiredEnv('R2_PUBLIC_BASE_URL').replace(/\/+$/, '');
  }

  return (
    process.env.STORAGE_PUBLIC_BASE_URL ?? 'http://localhost:4000/uploads'
  ).replace(/\/+$/, '');
}

function storageDriver() {
  return process.env.STORAGE_DRIVER ?? 'local';
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 환경 변수가 필요합니다.`);
  }
  return value;
}

let s3Client: S3Client | null = null;

function getS3Client() {
  if (s3Client) return s3Client;

  s3Client = new S3Client({
    region: 'auto',
    endpoint: requiredEnv('R2_ENDPOINT'),
    credentials: {
      accessKeyId: requiredEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requiredEnv('R2_SECRET_ACCESS_KEY'),
    },
  });
  return s3Client;
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
  const result = await database.query<PaperImportJobRow>(
    `
    SELECT
      "id",
      "questionPdfPath",
      "questionPdfName",
      "answerPdfPath",
      "inputOptions",
      "paperInput"
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

async function markCompleted(id: string, paperId: string) {
  await database.query(
    `
    UPDATE "PaperImportJob"
    SET
      "status" = 'COMPLETED',
      "paperId" = $2,
      "completedAt" = NOW(),
      "updatedAt" = NOW()
    WHERE "id" = $1
    `,
    [id, paperId],
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

function normalizeForKeywordMatch(value: string) {
  return value.toLowerCase().replace(/\s+/g, '');
}

async function loadRecommendedTags(examId: string) {
  const result = await database.query<{ id: string; keywords: string[] }>(
    `
    SELECT "id", "keywords"
    FROM "Tag"
    WHERE "examId" = $1
      AND cardinality("keywords") > 0
    `,
    [examId],
  );
  return result.rows;
}

function matchRecommendedTags(
  question: QuestionManifestQuestion,
  tags: Array<{ id: string; keywords: string[] }>,
) {
  const textLayer = question.textLayer;
  const haystack = normalizeForKeywordMatch(
    [
      textLayer?.text,
      textLayer?.promptText,
      textLayer?.passageText,
      ...(textLayer?.choiceTexts ?? []),
    ].join('\n'),
  );
  if (!haystack) return [];

  return tags
    .map((tag) => ({
      tagId: tag.id,
      keywords: tag.keywords.filter((keyword) => {
        const normalizedKeyword = normalizeForKeywordMatch(keyword);
        return (
          Boolean(normalizedKeyword) && haystack.includes(normalizedKeyword)
        );
      }),
    }))
    .filter((match) => match.keywords.length > 0);
}

function createPaperSlug(paperInput: PaperInput) {
  if (paperInput.round != null) {
    return String(paperInput.round);
  }

  const parts = [String(paperInput.year)];
  if (paperInput.month != null) {
    parts.push(paperInput.month.toString().padStart(2, '0'));
  }
  if (paperInput.grade != null) {
    parts.push(`grade-${paperInput.grade}`);
  }

  return parts.join('-');
}

function createQuestionObjectKey(
  examSlug: string,
  paperSlug: string,
  questionNumber: number,
  questionId: string,
  imageName: string,
) {
  const extension = extname(imageName).replace(/^\./, '') || 'webp';
  return [
    'questions',
    examSlug,
    paperSlug,
    `${questionNumber.toString().padStart(3, '0')}-${questionId}.${extension}`,
  ].join('/');
}

function resolveContentType(imageName: string) {
  const extension = extname(imageName).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  return 'image/webp';
}

async function uploadQuestionImage(
  sourcePath: string,
  objectKey: string,
  imageName: string,
  copiedObjectKeys: string[],
) {
  if (storageDriver() === 'r2') {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: requiredEnv('R2_BUCKET'),
        Key: objectKey,
        Body: await readFile(sourcePath),
        ContentType: resolveContentType(imageName),
      }),
    );
  } else {
    const destinationPath = storagePath(objectKey);
    await mkdir(dirname(destinationPath), { recursive: true });
    await copyFile(sourcePath, destinationPath);
  }
  copiedObjectKeys.push(objectKey);
}

async function cleanupCopiedImages(objectKeys: string[]) {
  if (storageDriver() === 'r2') {
    await Promise.all(
      objectKeys.map((objectKey) =>
        getS3Client()
          .send(
            new DeleteObjectCommand({
              Bucket: requiredEnv('R2_BUCKET'),
              Key: objectKey,
            }),
          )
          .catch(() => undefined),
      ),
    );
    return;
  }

  await Promise.all(
    objectKeys.map((objectKey) =>
      unlink(storagePath(objectKey)).catch(() => undefined),
    ),
  );
}

async function createPaperFromExtraction(
  importJob: PaperImportJobRow,
  manifest: QuestionManifest,
  answerManifest: AnswerManifest,
  questionDir: string,
) {
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

  const paperInput = importJob.paperInput;
  const examResult = await database.query<{ id: string; slug: string }>(
    `
    SELECT "id", "slug"
    FROM "Exam"
    WHERE "id" = $1
    `,
    [paperInput.examId],
  );
  const exam = examResult.rows[0];
  if (!exam) {
    throw new Error(`시험을 찾을 수 없습니다: ${paperInput.examId}`);
  }

  const copiedObjectKeys: string[] = [];
  const paperSlug = createPaperSlug(paperInput);
  const tags = await loadRecommendedTags(paperInput.examId);
  const preparedQuestions = await Promise.all(
    questions.map(async (question) => {
      const answer = answers.get(question.number);
      if (!answer) {
        throw new Error(`${question.number}번 문항의 답안을 찾지 못했습니다.`);
      }

      const questionId = randomUUID();
      const sourcePath = join(questionDir, question.image);
      const image = await readFile(sourcePath);
      const objectKey = createQuestionObjectKey(
        exam.slug,
        paperSlug,
        question.number,
        questionId,
        question.image,
      );
      await uploadQuestionImage(
        sourcePath,
        objectKey,
        question.image,
        copiedObjectKeys,
      );

      const recommendedTagMatches = matchRecommendedTags(question, tags);

      return {
        id: questionId,
        number: question.number,
        imageUrl: `${publicBaseUrl()}/${objectKey}`,
        imageHash: createHash('sha256').update(image).digest('hex'),
        answerChoice: answer.answer_index ?? null,
        points: answer.points ?? 5,
        rawText: question.textLayer?.text?.trim() || null,
        promptText: question.textLayer?.promptText?.trim() || null,
        passageText: question.textLayer?.passageText?.trim() || null,
        choiceTexts: question.textLayer?.choiceTexts ?? [],
        recommendedTagIds: recommendedTagMatches.map((match) => match.tagId),
        recommendedTagMatches,
      };
    }),
  );

  try {
    const paperId = await database.connect().then(async (client) => {
      try {
        await client.query('BEGIN');
        const sessionKey = [
          paperInput.examId,
          paperInput.year,
          paperInput.month ?? '-',
          paperInput.grade ?? '-',
          paperInput.round ?? '-',
        ].join(':');
        const sessionResult = await client.query<{ id: string }>(
          `
            INSERT INTO "ExamSession"
              ("id", "key", "examId", "displayYear", "month", "grade", "round", "createdAt", "updatedAt")
            VALUES
              ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            ON CONFLICT ("key") DO UPDATE SET "key" = EXCLUDED."key"
            RETURNING "id"
            `,
          [
            randomUUID(),
            sessionKey,
            paperInput.examId,
            paperInput.year,
            paperInput.month ?? null,
            paperInput.grade ?? null,
            paperInput.round ?? null,
          ],
        );
        const examSessionId = sessionResult.rows[0]?.id;
        if (!examSessionId) {
          throw new Error('시험 세션을 생성하지 못했습니다.');
        }

        const questionSetId = randomUUID();
        await client.query(
          `
            INSERT INTO "QuestionSet"
              ("id", "kind", "title", "createdAt", "updatedAt")
            VALUES
              ($1, 'OFFICIAL_PAPER', $2, NOW(), NOW())
            `,
          [questionSetId, paperInput.title],
        );

        const nextPaperId = randomUUID();
        await client.query(
          `
            INSERT INTO "Paper"
              ("id", "title", "questionCount", "isPublished", "examSessionId", "questionSetId", "createdAt", "updatedAt")
            VALUES
              ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            `,
          [
            nextPaperId,
            paperInput.title,
            paperInput.questionCount ?? preparedQuestions.length,
            paperInput.isPublished ?? false,
            examSessionId,
            questionSetId,
          ],
        );

        for (const question of preparedQuestions) {
          await client.query(
            `
              INSERT INTO "Question"
                (
                  "id", "paperId", "number", "type", "imageUrl", "imageHash",
                  "choiceCount", "rawText", "promptText", "passageText", "choiceTexts",
                  "gradingPolicy", "answerChoice", "answerText", "explanation", "points",
                  "recommendedTimeSeconds", "recommendedTagIds", "recommendedTagMatches", "createdAt", "updatedAt"
                )
              VALUES
                (
                  $1, $2, $3, 'MULTIPLE_CHOICE', $4, $5,
                  5, $6, $7, $8, $9::text[],
                  'EXACT', $10, NULL, NULL, $11,
                  NULL, $12::text[], $13::jsonb, NOW(), NOW()
                )
              `,
            [
              question.id,
              nextPaperId,
              question.number,
              question.imageUrl,
              question.imageHash,
              question.rawText,
              question.promptText,
              question.passageText,
              question.choiceTexts,
              question.answerChoice,
              question.points,
              question.recommendedTagIds,
              JSON.stringify(question.recommendedTagMatches),
            ],
          );

          const revisionId = randomUUID();
          await client.query(
            `
              INSERT INTO "QuestionRevision"
                (
                  "id", "questionId", "revision", "type", "imageUrl", "imageHash",
                  "choiceCount", "rawText", "promptText", "passageText", "choiceTexts",
                  "gradingPolicy", "answerChoice", "answerText", "explanation", "points",
                  "recommendedTimeSeconds", "createdAt"
                )
              VALUES
                (
                  $1, $2, 1, 'MULTIPLE_CHOICE', $3, $4,
                  5, $5, $6, $7, $8::text[],
                  'EXACT', $9, NULL, NULL, $10,
                  NULL, NOW()
                )
              `,
            [
              revisionId,
              question.id,
              question.imageUrl,
              question.imageHash,
              question.rawText,
              question.promptText,
              question.passageText,
              question.choiceTexts,
              question.answerChoice,
              question.points,
            ],
          );

          await client.query(
            `
              INSERT INTO "QuestionSetItem"
                ("questionSetId", "questionRevisionId", "position", "createdAt")
              VALUES
                ($1, $2, $3, NOW())
              `,
            [questionSetId, revisionId, question.number],
          );
        }

        await client.query('COMMIT');
        return nextPaperId;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });

    return paperId;
  } catch (error) {
    await cleanupCopiedImages(copiedObjectKeys);
    throw error;
  }
}

async function processImportJob(importJob: PaperImportJobRow) {
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
      `문제지 생성을 시작합니다: job=${importJob.id}, questions=${manifest.questions?.length ?? 0}, answers=${answers.answers?.length ?? 0}`,
    );
    const paperId = await createPaperFromExtraction(
      importJob,
      manifest,
      answers,
      questionDir,
    );
    console.log(
      `문제지 생성을 완료했습니다: job=${importJob.id}, paper=${paperId}`,
    );

    return paperId;
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
    const paperId = await processImportJob(importJob);
    await markCompleted(jobId, paperId);
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
