import {
  CreateWrongQuestionSetResponse,
  CreateWrongQuestionSetResponseSchema,
  DailyWrongQuestionSetResponse,
  GetWrongQuestionSetResponse,
  GetWrongQuestionSetResponseSchema,
  StartWrongReviewSessionResponse,
} from '@kichulbot/api-contract/review';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AnswerMode,
  AttemptOutcome,
  Prisma,
} from '../../infrastructure/database/prisma-client';
import { SolveSessionsService } from '../solve-sessions/solve-sessions.service';
import { ReviewRepository } from './review.repository';

type DailyWrongQuestionSet = Prisma.QuestionSetGetPayload<{
  include: {
    generated: true;
    items: {
      include: {
        sourceAttempt: true;
        questionRevision: {
          include: {
            question: {
              include: {
                paper: {
                  include: {
                    examSession: { include: { exam: true } };
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}>;

@Injectable()
export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly solveSessionsService: SolveSessionsService,
  ) {}

  async getByStudyDate(
    userId: string,
    studyDateInput?: string,
  ): Promise<GetWrongQuestionSetResponse> {
    const studyDate = await this.resolveStudyDate(userId, studyDateInput);
    const questionSet = await this.reviewRepository.findByStudyDate(
      userId,
      studyDate,
    );
    return GetWrongQuestionSetResponseSchema.parse({
      questionSet: questionSet ? this.toResponse(questionSet) : null,
    });
  }

  async generate(
    userId: string,
    studyDateInput?: string,
  ): Promise<CreateWrongQuestionSetResponse> {
    const studyDate = await this.resolveStudyDate(userId, studyDateInput);
    const questionSet = await this.reviewRepository.regenerate(
      userId,
      studyDate,
    );
    return CreateWrongQuestionSetResponseSchema.parse({
      questionSet: this.toResponse(questionSet),
    });
  }

  async start(
    userId: string,
    questionSetId: string,
    mode: AnswerMode = AnswerMode.ONE_BY_ONE,
  ): Promise<StartWrongReviewSessionResponse> {
    const questionSet =
      await this.reviewRepository.findOwnedDailyWrongQuestionSet(
        userId,
        questionSetId,
      );
    if (!questionSet) {
      throw new NotFoundException('오답 세트를 찾을 수 없습니다.');
    }
    if (questionSet.items.length === 0) {
      throw new BadRequestException('다시 풀 오답이 없습니다.');
    }
    return this.solveSessionsService.startQuestionSet(
      userId,
      questionSet.id,
      mode,
    );
  }

  async startLatest(
    userId: string,
    mode: AnswerMode = AnswerMode.ONE_BY_ONE,
    studyDateInput?: string,
  ): Promise<StartWrongReviewSessionResponse> {
    const studyDate = await this.resolveStudyDate(userId, studyDateInput);
    const questionSet = await this.reviewRepository.regenerate(
      userId,
      studyDate,
    );
    if (questionSet.items.length === 0) {
      throw new BadRequestException('다시 풀 오답이 없습니다.');
    }
    return this.solveSessionsService.startQuestionSet(
      userId,
      questionSet.id,
      mode,
      { reuseUnsubmitted: false },
    );
  }

  private async resolveStudyDate(userId: string, studyDateInput?: string) {
    if (studyDateInput) return this.parseStudyDate(studyDateInput);

    const user = await this.reviewRepository.findUser(userId);
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return this.toStudyDate(new Date(), user.timezone);
  }

  private parseStudyDate(studyDate: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(studyDate)) {
      throw new BadRequestException(
        'studyDate는 YYYY-MM-DD 형식이어야 합니다.',
      );
    }
    const parsed = new Date(`${studyDate}T00:00:00Z`);
    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== studyDate
    ) {
      throw new BadRequestException('studyDate가 올바른 날짜가 아닙니다.');
    }
    return parsed;
  }

  private toStudyDate(now: Date, timezone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value;
    return new Date(`${get('year')}-${get('month')}-${get('day')}T00:00:00Z`);
  }

  private toResponse(
    questionSet: DailyWrongQuestionSet,
  ): DailyWrongQuestionSetResponse {
    if (!questionSet.generated?.studyDate) {
      throw new Error('DAILY_WRONG 세트의 studyDate가 없습니다.');
    }
    return {
      id: questionSet.id,
      title: questionSet.title,
      studyDate: questionSet.generated.studyDate.toISOString().slice(0, 10),
      questionCount: questionSet.items.length,
      questions: questionSet.items.map((item) => {
        const { question } = item.questionRevision;
        const outcome = item.sourceAttempt?.outcome;
        if (
          outcome !== AttemptOutcome.INCORRECT &&
          outcome !== AttemptOutcome.OMITTED
        ) {
          throw new Error('DAILY_WRONG 세트의 source attempt가 없습니다.');
        }
        return {
          id: question.id,
          number: question.number,
          imageUrl: item.questionRevision.imageUrl,
          imageCacheKey: this.toImageCacheKey(item.questionRevision.imageHash),
          sourceOutcome: outcome,
          paper: {
            id: question.paper.id,
            title: question.paper.title,
            year: question.paper.examSession.displayYear,
            examName: question.paper.examSession.exam.name,
          },
        };
      }),
      generatedAt: questionSet.generated.generatedAt.toISOString(),
    };
  }

  private toImageCacheKey(imageHash: string): string {
    return imageHash.startsWith('legacy_') ? imageHash : `sha256_${imageHash}`;
  }
}
