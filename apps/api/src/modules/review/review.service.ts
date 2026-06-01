import {
  DailyWrongQuestionSetResponse,
  GetTodayWrongQuestionsResponse,
  GetTodayWrongQuestionsResponseSchema,
  RefreshTodayWrongQuestionSetResponse,
  RefreshTodayWrongQuestionSetResponseSchema,
  StartWrongReviewSessionResponse,
} from '@kichulbot/api-contract/review';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AnswerMode, AttemptOutcome, Prisma } from '@prisma/client';
import { AnswerSessionsService } from '../answer-sessions/answer-sessions.service';
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
                    subject: true;
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
    private readonly answerSessionsService: AnswerSessionsService,
  ) {}

  async getToday(userId: string): Promise<GetTodayWrongQuestionsResponse> {
    const questionSet = await this.getOrCreateToday(userId);
    return GetTodayWrongQuestionsResponseSchema.parse({
      questionSet: this.toResponse(questionSet),
    });
  }

  async refreshToday(
    userId: string,
  ): Promise<RefreshTodayWrongQuestionSetResponse> {
    const studyDate = await this.getStudyDate(userId);
    const questionSet = await this.reviewRepository.refreshToday(
      userId,
      studyDate,
    );
    return RefreshTodayWrongQuestionSetResponseSchema.parse({
      questionSet: this.toResponse(questionSet),
    });
  }

  async startToday(
    userId: string,
    mode: AnswerMode = AnswerMode.ONE_BY_ONE,
  ): Promise<StartWrongReviewSessionResponse> {
    const questionSet = await this.getOrCreateToday(userId);
    if (questionSet.items.length === 0) {
      throw new BadRequestException('오늘 다시 풀 오답이 없습니다.');
    }
    return this.answerSessionsService.startQuestionSet(
      userId,
      questionSet.id,
      mode,
    );
  }

  private async getOrCreateToday(userId: string) {
    const studyDate = await this.getStudyDate(userId);
    return this.reviewRepository.findOrCreateToday(userId, studyDate);
  }

  private async getStudyDate(userId: string) {
    const user = await this.reviewRepository.findUser(userId);
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return this.toStudyDate(new Date(), user.timezone);
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
          sourceOutcome: outcome,
          paper: {
            id: question.paper.id,
            title: question.paper.title,
            year: question.paper.examSession.displayYear,
            examName: question.paper.examSession.exam.name,
            subjectName: question.paper.subject.name,
          },
        };
      }),
      generatedAt: questionSet.generated.generatedAt.toISOString(),
    };
  }
}
