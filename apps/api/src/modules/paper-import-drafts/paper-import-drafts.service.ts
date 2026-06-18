import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  CreatePaperImportJobRequest,
  CreatePaperImportJobRequestSchema,
  CreatePaperImportJobResponse,
  CreatePaperResponse,
  CreatePaperWithQuestionsRequest,
  ListPaperImportJobsResponse,
  PaperImportDraftResponse,
  PaperImportDraftResponseSchema,
  PaperImportJobPayloadResponse,
  PaperImportJobResponse,
  SavePaperImportJobResultRequest,
  SavePaperImportJobResultRequestSchema,
  UpdatePaperImportJobStatusRequest,
  UpdatePaperImportJobStatusRequestSchema,
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

import { assertPdfUploadFile } from '../../common/pipes/upload-file.pipe';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { UserRole } from '../../infrastructure/database/prisma-client';
import { UploadedMemoryFile } from '../../infrastructure/storage/storage.service';
import { PapersService } from '../papers/papers.service';
import { TagsService } from '../tags/tags.service';
import type {
  CreateDraftInput,
  PaperImportDraftPayload,
  PaperImportJobItem,
  PaperImportJobRecord,
} from './paper-import-drafts.types';

const DEFAULT_LAYOUT = 'korean-history';
const DEFAULT_VARIANT = 'odd';
const QUEUE_NAME = 'paper-import';
const JOB_NAME = 'extract-paper';

@Injectable()
export class PaperImportDraftsService implements OnModuleDestroy {
  private readonly importRootDir: string;
  private readonly queue: Queue<{ jobId: string }>;

  constructor(
    private readonly database: DatabaseService,
    configService: ConfigService,
    private readonly papersService: PapersService,
    private readonly tagsService: TagsService,
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
    assertPdfUploadFile(questionPdf, '문제 PDF');
    assertPdfUploadFile(answerPdf, '답지 PDF');

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

    return {
      job: {
        id: job.id,
        status: job.status,
        paperId: job.paperId,
      },
    };
  }

  async listDraftJobs(): Promise<ListPaperImportJobsResponse> {
    const jobs = await this.database.paperImportJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      jobs: jobs.map((job) => this.toPaperImportJobItem(job)),
    };
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
        ? await this.readDraftResult(job)
        : null;

    return {
      job: this.toPaperImportJobItem(job, result),
    };
  }

  async getImportJobPayload(
    id: string,
  ): Promise<PaperImportJobPayloadResponse> {
    const job = await this.database.paperImportJob.findUnique({
      where: { id },
    });
    if (!job) {
      throw new NotFoundException('PDF 추출 작업을 찾을 수 없습니다.');
    }

    return {
      job: {
        id: job.id,
        questionPdfPath: job.questionPdfPath,
        questionPdfName: job.questionPdfName,
        answerPdfPath: job.answerPdfPath,
        inputOptions: this.toExtractorOptions(
          CreatePaperImportJobRequestSchema.parse(job.paperInput),
        ),
        paperInput: CreatePaperImportJobRequestSchema.parse(job.paperInput),
      },
    };
  }

  async updateImportJobStatus(
    id: string,
    input: UpdatePaperImportJobStatusRequest,
  ): Promise<PaperImportJobResponse> {
    const body = this.parseStatusUpdate(input);
    const existingJob = await this.database.paperImportJob.findUnique({
      where: { id },
    });
    if (!existingJob) {
      throw new NotFoundException('PDF 추출 작업을 찾을 수 없습니다.');
    }

    const job = await this.database.paperImportJob.update({
      where: { id },
      data: this.toStatusUpdateData(body),
    });

    return {
      job: this.toPaperImportJobItem(job),
    };
  }

  async saveImportJobResult(
    id: string,
    input: SavePaperImportJobResultRequest,
  ): Promise<PaperImportJobResponse> {
    const body = this.parseResultInput(input);
    const existingJob = await this.database.paperImportJob.findUnique({
      where: { id },
    });
    if (!existingJob) {
      throw new NotFoundException('PDF 추출 작업을 찾을 수 없습니다.');
    }

    const job = await this.database.paperImportJob.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        resultJsonPath: body.resultJsonPath,
        completedAt: new Date(),
        failedAt: null,
        errorMessage: null,
        updatedAt: new Date(),
      },
    });

    return {
      job: this.toPaperImportJobItem(job),
    };
  }

  async createPaperFromImportJob(id: string): Promise<CreatePaperResponse> {
    const job = await this.database.paperImportJob.findUnique({
      where: { id },
    });
    if (!job) {
      throw new NotFoundException('PDF 추출 작업을 찾을 수 없습니다.');
    }
    if (job.paperId) {
      return this.papersService.getAdminPaper(job.paperId);
    }
    if (job.status !== 'COMPLETED' || !job.resultJsonPath) {
      throw new BadRequestException(
        '완료된 PDF 추출 작업만 문제지로 생성할 수 있습니다.',
      );
    }

    const paperInput = CreatePaperImportJobRequestSchema.parse(job.paperInput);
    const result = await this.readDraftResult(job);
    const payload = this.toCreatePaperWithQuestionsRequest(paperInput, result);
    const images = this.toUploadedImageFiles(result);
    const response = await this.papersService.createPaperWithQuestions(
      JSON.stringify(payload),
      images,
      UserRole.ADMIN,
    );

    await this.database.paperImportJob.update({
      where: { id },
      data: {
        paperId: response.paper.id,
        updatedAt: new Date(),
      },
    });

    return response;
  }

  private resolveStoragePath(relativePath: string) {
    return join(this.importRootDir, '..', relativePath);
  }

  private async readDraftResult(job: {
    paperInput: unknown;
    resultJsonPath: string | null;
  }): Promise<PaperImportDraftResponse> {
    if (!job.resultJsonPath) {
      throw new BadRequestException('PDF 추출 결과를 찾을 수 없습니다.');
    }

    const paperInput = CreatePaperImportJobRequestSchema.parse(job.paperInput);
    const result = PaperImportDraftResponseSchema.parse(
      JSON.parse(
        await readFile(this.resolveStoragePath(job.resultJsonPath), 'utf8'),
      ) as unknown,
    );
    const matches = await this.tagsService.matchRecommendedTagsBatch(
      paperInput.examId,
      result.questions.map((question) => ({
        text: question.rawText ?? question.textLayer?.text,
        promptText: question.promptText ?? question.textLayer?.promptText,
        passageText: question.passageText ?? question.textLayer?.passageText,
        choiceTexts:
          question.choiceTexts.length > 0
            ? question.choiceTexts
            : question.textLayer?.choiceTexts,
      })),
    );

    return {
      ...result,
      questions: result.questions.map((question, index) => ({
        ...question,
        recommendedTagIds: matches[index]?.map((match) => match.tagId) ?? [],
        recommendedTagMatches: matches[index] ?? [],
      })),
    };
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

  private parseStatusUpdate(input: UpdatePaperImportJobStatusRequest) {
    const result = UpdatePaperImportJobStatusRequestSchema.safeParse(input);
    if (!result.success) {
      throw new BadRequestException(
        result.error.issues.map((issue) => issue.message),
      );
    }
    return result.data;
  }

  private parseResultInput(input: SavePaperImportJobResultRequest) {
    const result = SavePaperImportJobResultRequestSchema.safeParse(input);
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

  private toStatusUpdateData(input: UpdatePaperImportJobStatusRequest) {
    const now = new Date();
    if (input.status === 'PROCESSING') {
      return {
        status: input.status,
        startedAt: now,
        failedAt: null,
        errorMessage: null,
        updatedAt: now,
      };
    }

    if (input.status === 'FAILED') {
      return {
        status: input.status,
        failedAt: now,
        errorMessage: input.errorMessage?.slice(0, 4000) ?? null,
        updatedAt: now,
      };
    }

    return {
      status: input.status,
      errorMessage: input.errorMessage?.slice(0, 4000) ?? null,
      updatedAt: now,
    };
  }

  private toCreatePaperWithQuestionsRequest(
    paperInput: CreatePaperImportJobRequest,
    result: PaperImportDraftResponse,
  ): CreatePaperWithQuestionsRequest {
    return {
      paper: {
        title: paperInput.title,
        year: paperInput.year,
        month: paperInput.month,
        grade: paperInput.grade,
        round: paperInput.round,
        examId: paperInput.examId,
        questionCount: paperInput.questionCount,
        isPublished: paperInput.isPublished,
      },
      questions: result.questions.map((question) => ({
        number: question.number,
        type: question.type,
        choiceCount: question.choiceCount,
        gradingPolicy: question.gradingPolicy,
        answerChoice: question.answerChoice,
        answerText: question.answerText,
        explanation: question.explanation,
        rawText: question.rawText,
        promptText: question.promptText,
        passageText: question.passageText,
        choiceTexts: question.choiceTexts,
        points: question.points,
        recommendedTimeSeconds: question.recommendedTimeSeconds,
        recommendedTagIds: question.recommendedTagIds,
        recommendedTagMatches: question.recommendedTagMatches,
        tagIds: question.tagIds,
        imageFileName: question.image.filename,
      })),
    };
  }

  private toUploadedImageFiles(
    result: PaperImportDraftResponse,
  ): UploadedMemoryFile[] {
    return result.questions.map((question) => {
      const buffer = Buffer.from(question.image.base64, 'base64');
      return {
        fieldname: 'images',
        originalname: question.image.filename,
        mimetype: question.image.mimeType,
        size: buffer.byteLength,
        buffer,
      };
    });
  }

  private toPaperImportJobItem(
    job: PaperImportJobRecord,
    result: PaperImportDraftPayload | null = null,
  ): PaperImportJobItem {
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
}
