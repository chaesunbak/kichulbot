import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import {
  CreatePaperImportJobResponse,
  CreatePaperImportJobResponseSchema,
  PaperImportDraftResponse,
  PaperImportDraftResponseSchema,
  PaperImportJobResponse,
  PaperImportJobResponseSchema,
} from '@kichulbot/api-contract/papers';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

import { DatabaseService } from '../../infrastructure/database/database.service';
import { UploadedMemoryFile } from '../../infrastructure/storage/storage.service';

const DEFAULT_LAYOUT = 'korean-history';
const DEFAULT_VARIANT = 'odd';
const DEFAULT_DPI = 216;
const DEFAULT_IMAGE_FORMAT = 'webp';
const DEFAULT_QUALITY = 82;
const QUEUE_NAME = 'paper-import';
const JOB_NAME = 'extract-paper';

type CreateDraftInput = {
  questionPdf?: UploadedMemoryFile;
  answerPdf?: UploadedMemoryFile;
  options: Record<string, string | undefined>;
};

@Injectable()
export class PaperImportDraftsService implements OnModuleDestroy {
  private readonly importRootDir: string;
  private readonly queue: Queue<{ jobId: string }>;

  constructor(
    private readonly database: DatabaseService,
    configService: ConfigService,
  ) {
    const storageRoot =
      configService.get<string>('storage.local.dir') ??
      join(process.cwd(), 'uploads');
    this.importRootDir = join(storageRoot, 'paper-import-jobs');
    this.queue = new Queue(QUEUE_NAME, {
      connection: {
        url: configService.get<string>('redis.url') ?? 'redis://localhost:6379',
      },
    });
  }

  async onModuleDestroy() {
    await this.queue.close();
  }

  async createDraft(
    input: CreateDraftInput,
  ): Promise<CreatePaperImportJobResponse> {
    const { questionPdf, answerPdf } = input;
    if (!questionPdf) {
      throw new BadRequestException('문제 PDF를 업로드해주세요.');
    }
    if (!answerPdf) {
      throw new BadRequestException('답지 PDF를 업로드해주세요.');
    }
    this.assertPdf(questionPdf, '문제 PDF');
    this.assertPdf(answerPdf, '답지 PDF');

    const options = this.resolveOptions(input.options);
    const jobId = randomUUID();
    const jobDir = join(this.importRootDir, jobId);
    const questionPdfPath = join('paper-import-jobs', jobId, 'questions.pdf');
    const answerPdfPath = join('paper-import-jobs', jobId, 'answers.pdf');

    await mkdir(jobDir, { recursive: true });
    await Promise.all([
      writeFile(join(jobDir, 'questions.pdf'), questionPdf.buffer),
      writeFile(join(jobDir, 'answers.pdf'), answerPdf.buffer),
    ]);

    const job = await this.database.paperImportJob.create({
      data: {
        id: jobId,
        questionPdfPath,
        questionPdfName: questionPdf.originalname,
        answerPdfPath,
        answerPdfName: answerPdf.originalname,
        inputOptions: options,
      },
    });

    try {
      await this.queue.add(
        JOB_NAME,
        { jobId },
        {
          jobId,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5_000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    } catch (error) {
      await this.database.paperImportJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errorMessage:
            error instanceof Error
              ? error.message
              : 'PDF 추출 작업을 큐에 등록하지 못했습니다.',
          failedAt: new Date(),
        },
      });
      throw new InternalServerErrorException(
        'PDF 추출 작업을 큐에 등록하지 못했습니다.',
      );
    }

    return CreatePaperImportJobResponseSchema.parse({
      job: {
        id: job.id,
        status: job.status,
      },
    });
  }

  async getDraftJob(id: string): Promise<PaperImportJobResponse> {
    const job = await this.database.paperImportJob.findUnique({
      where: { id },
    });
    if (!job) {
      throw new NotFoundException('PDF 추출 작업을 찾을 수 없습니다.');
    }

    const result =
      job.status === 'COMPLETED' && job.resultJsonPath
        ? await this.withRecommendedTags(
            PaperImportDraftResponseSchema.parse(
              JSON.parse(
                await readFile(
                  this.resolveStoragePath(job.resultJsonPath),
                  'utf8',
                ),
              ) as unknown,
            ),
            this.resolveExamId(job.inputOptions),
          )
        : null;

    return PaperImportJobResponseSchema.parse({
      job: {
        id: job.id,
        status: job.status,
        errorMessage: job.errorMessage,
        result,
      },
    });
  }

  private resolveStoragePath(relativePath: string) {
    return join(this.importRootDir, '..', relativePath);
  }

  private async withRecommendedTags(
    result: PaperImportDraftResponse,
    examId: string | null,
  ): Promise<PaperImportDraftResponse> {
    if (!examId) return result;

    const tags = await this.database.tag.findMany({
      where: {
        examId,
        keywords: { isEmpty: false },
      },
      select: {
        id: true,
        keywords: true,
      },
    });
    if (tags.length === 0) return result;

    return {
      ...result,
      questions: result.questions.map((question) => ({
        ...question,
        recommendedTagIds: this.matchRecommendedTagIds(
          [
            question.rawText,
            question.promptText,
            question.passageText,
            ...question.choiceTexts,
          ].join('\n'),
          tags,
        ),
      })),
    };
  }

  private matchRecommendedTagIds(
    text: string,
    tags: Array<{ id: string; keywords: string[] }>,
  ) {
    const haystack = this.normalizeForKeywordMatch(text);
    if (!haystack) return [];

    return tags
      .filter((tag) =>
        tag.keywords.some((keyword) => {
          const normalizedKeyword = this.normalizeForKeywordMatch(keyword);
          return (
            Boolean(normalizedKeyword) && haystack.includes(normalizedKeyword)
          );
        }),
      )
      .map((tag) => tag.id);
  }

  private normalizeForKeywordMatch(value: string) {
    return value.toLowerCase().replace(/\s+/g, '');
  }

  private resolveExamId(inputOptions: unknown) {
    if (!inputOptions || typeof inputOptions !== 'object') return null;
    const examId = (inputOptions as { examId?: unknown }).examId;
    return typeof examId === 'string' && examId.trim() ? examId.trim() : null;
  }

  private resolveOptions(options: Record<string, string | undefined>) {
    const dpi = Number(options.dpi ?? DEFAULT_DPI);
    const quality = Number(options.quality ?? DEFAULT_QUALITY);
    return {
      layout: options.layout || DEFAULT_LAYOUT,
      variant: options.variant || DEFAULT_VARIANT,
      dpi: Number.isFinite(dpi) ? dpi : DEFAULT_DPI,
      imageFormat: options.imageFormat || DEFAULT_IMAGE_FORMAT,
      quality: Number.isFinite(quality) ? quality : DEFAULT_QUALITY,
      examId: options.examId?.trim() || null,
    };
  }

  private assertPdf(file: UploadedMemoryFile, label: string) {
    if (
      file.mimetype !== 'application/pdf' &&
      extname(file.originalname).toLowerCase() !== '.pdf'
    ) {
      throw new BadRequestException(
        `${label}는 PDF 파일만 업로드할 수 있습니다.`,
      );
    }
  }
}
