import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import {
  CreatePaperImportJobRequest,
  CreatePaperImportJobRequestSchema,
  CreatePaperImportJobResponse,
  CreatePaperImportJobResponseSchema,
  ListPaperImportJobsResponse,
  ListPaperImportJobsResponseSchema,
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
const QUEUE_NAME = 'paper-import';
const JOB_NAME = 'extract-paper';

type CreateDraftInput = {
  questionPdf?: UploadedMemoryFile;
  answerPdf?: UploadedMemoryFile;
  options: Record<string, string | undefined>;
};

type PaperImportJobRow = {
  id: string;
  status: string;
  questionPdfName: string;
  answerPdfName: string;
  paperId: string | null;
  paperInput: unknown;
  errorMessage: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
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

    const paperInput = this.parsePaperInput(input.options);
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
        inputOptions: this.toExtractorOptions(paperInput),
        paperInput,
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
        paperId: job.paperId,
      },
    });
  }

  async listDraftJobs(): Promise<ListPaperImportJobsResponse> {
    const jobs = await this.database.paperImportJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return ListPaperImportJobsResponseSchema.parse({
      jobs: jobs.map((job) => this.toJobResponse(job)),
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
        ? PaperImportDraftResponseSchema.parse(
            JSON.parse(
              await readFile(
                this.resolveStoragePath(job.resultJsonPath),
                'utf8',
              ),
            ) as unknown,
          )
        : null;

    return PaperImportJobResponseSchema.parse({
      job: this.toJobResponse(job, result),
    });
  }

  private resolveStoragePath(relativePath: string) {
    return join(this.importRootDir, '..', relativePath);
  }

  private parsePaperInput(
    options: Record<string, string | undefined>,
  ): CreatePaperImportJobRequest {
    const result = CreatePaperImportJobRequestSchema.safeParse({
      ...options,
      year: Number(options.year),
      month: options.month ? Number(options.month) : undefined,
      grade: options.grade ? Number(options.grade) : undefined,
      round: options.round ? Number(options.round) : undefined,
      questionCount: options.questionCount
        ? Number(options.questionCount)
        : undefined,
      isPublished: options.isPublished === 'true',
      dpi: options.dpi ? Number(options.dpi) : undefined,
      quality: options.quality ? Number(options.quality) : undefined,
      layout: options.layout || DEFAULT_LAYOUT,
      variant: options.variant || DEFAULT_VARIANT,
    });
    if (!result.success) {
      throw new BadRequestException(
        result.error.issues.map((issue) => issue.message),
      );
    }
    return result.data;
  }

  private toExtractorOptions(paperInput: CreatePaperImportJobRequest) {
    return {
      layout: paperInput.layout,
      variant: paperInput.variant,
      dpi: paperInput.dpi ?? 216,
      imageFormat: paperInput.imageFormat,
      quality: paperInput.quality ?? 82,
      examId: paperInput.examId,
    };
  }

  private toJobResponse(
    job: PaperImportJobRow,
    result: PaperImportDraftResponse | null = null,
  ) {
    return {
      id: job.id,
      status: job.status,
      questionPdfName: job.questionPdfName,
      answerPdfName: job.answerPdfName,
      paperTitle: this.resolvePaperTitle(job.paperInput),
      paperId: job.paperId,
      errorMessage: job.errorMessage,
      result,
      createdAt: job.createdAt.toISOString(),
      startedAt: job.startedAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
      failedAt: job.failedAt?.toISOString() ?? null,
    };
  }

  private resolvePaperTitle(paperInput: unknown) {
    if (!paperInput || typeof paperInput !== 'object') return undefined;
    const title = (paperInput as { title?: unknown }).title;
    return typeof title === 'string' ? title : undefined;
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
