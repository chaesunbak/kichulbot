import {
  AnswerSessionLogResponse,
  AnswerSessionResponse,
  AnswerResponse,
  AnswerSessionResultResponse,
  GetAnswerSessionResponse,
  GetAnswerSessionResponseSchema,
  ListAnswerSessionLogsResponse,
  ListAnswerSessionLogsResponseSchema,
  QuestionResultResponse,
  SaveAnswerResponse,
  SaveAnswerResponseSchema,
  StartAnswerSessionResponse,
  StartAnswerSessionResponseSchema,
  SubmitAnswerSessionResponse,
  SubmitAnswerSessionResponseSchema,
} from '@kichulbot/api-contract/answer-sessions';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AnswerMode,
  AttemptOutcome,
  Prisma,
  QuestionType,
} from '@prisma/client';
import { SaveAnswerDto } from './dto/save-answer.dto';
import {
  AnswerSessionsRepository,
  SubmittedAnswerSessionError,
} from './answer-sessions.repository';

type SessionWithRelations = Prisma.AnswerSessionGetPayload<{
  include: {
    paper: {
      include: {
        examSession: { include: { exam: true } };
        subject: true;
      };
    };
    sourceSet: true;
    items: {
      include: {
        questionRevision: { include: { question: true } };
        draft: true;
        attempts: true;
      };
    };
  };
}>;
type SessionItem = SessionWithRelations['items'][number];
type StoredDraft = NonNullable<SessionItem['draft']>;
type StoredAttempt = SessionItem['attempts'][number];
type StoredRevision = SessionItem['questionRevision'];

@Injectable()
export class AnswerSessionsService {
  constructor(
    private readonly answerSessionsRepository: AnswerSessionsRepository,
  ) {}

  async start(
    userId: string,
    paperId: string,
    mode: AnswerMode,
  ): Promise<StartAnswerSessionResponse> {
    const paper =
      await this.answerSessionsRepository.findPublishedPaper(paperId);
    if (!paper) throw new NotFoundException('문제지를 찾을 수 없습니다.');

    const session = await this.answerSessionsRepository.start(
      userId,
      paperId,
      mode,
    );
    return StartAnswerSessionResponseSchema.parse({
      session: this.toResponse(session),
    });
  }

  async listLogs(userId: string): Promise<ListAnswerSessionLogsResponse> {
    const sessions = await this.answerSessionsRepository.findLogs(userId);
    return ListAnswerSessionLogsResponseSchema.parse({
      logs: sessions.map((session) => this.toLogResponse(session)),
    });
  }

  async startQuestionSet(
    userId: string,
    questionSetId: string,
    mode: AnswerMode,
  ) {
    const session = await this.answerSessionsRepository.startQuestionSet(
      userId,
      questionSetId,
      mode,
    );
    return StartAnswerSessionResponseSchema.parse({
      session: this.toResponse(session),
    });
  }

  async get(userId: string, id: string): Promise<GetAnswerSessionResponse> {
    const session = await this.findOwnedSession(userId, id);
    return GetAnswerSessionResponseSchema.parse({
      session: this.toResponse(session),
    });
  }

  async saveAnswer(
    userId: string,
    id: string,
    questionId: string,
    dto: SaveAnswerDto,
  ): Promise<SaveAnswerResponse> {
    const session = await this.findOwnedSession(userId, id);
    if (session.submittedAt) {
      throw new BadRequestException('이미 종료된 풀이입니다.');
    }
    const item = session.items.find(
      ({ questionRevision }) => questionRevision.questionId === questionId,
    );
    if (!item) throw new NotFoundException('문항을 찾을 수 없습니다.');

    const answer = this.resolveAnswer(
      item.questionRevision.type,
      item.questionRevision.choiceCount,
      dto,
    );
    if (!answer && dto.spentMilliseconds === undefined) {
      throw new BadRequestException(
        '저장할 답안 또는 풀이 시간을 입력해주세요.',
      );
    }
    const { draft, attempt } = await this.answerSessionsRepository
      .saveAnswer(id, item.id, {
        ...answer,
        spentMilliseconds: dto.spentMilliseconds,
      })
      .catch((error: unknown) => {
        if (error instanceof SubmittedAnswerSessionError) {
          throw new BadRequestException('이미 종료된 풀이입니다.');
        }
        throw error;
      });
    return SaveAnswerResponseSchema.parse({
      answer: this.toAnswerResponse(item, draft, attempt),
      result: attempt
        ? this.toQuestionResult(item.questionRevision, attempt)
        : null,
    });
  }

  async submit(
    userId: string,
    id: string,
  ): Promise<SubmitAnswerSessionResponse> {
    const existing = await this.findOwnedSession(userId, id);
    const session = existing.submittedAt
      ? existing
      : await this.answerSessionsRepository.submit(id);
    return SubmitAnswerSessionResponseSchema.parse({
      session: this.toResponse(session),
    });
  }

  private async findOwnedSession(userId: string, id: string) {
    const session = await this.answerSessionsRepository.findById(id);
    if (!session) throw new NotFoundException('풀이 세션을 찾을 수 없습니다.');
    if (session.userId !== userId) {
      throw new ForbiddenException(
        '다른 사용자의 풀이 세션에 접근할 수 없습니다.',
      );
    }
    return session;
  }

  private resolveAnswer(
    type: QuestionType,
    choiceCount: number | null,
    dto: SaveAnswerDto,
  ) {
    const hasAnswer =
      dto.answerChoice !== undefined || dto.answerText !== undefined;
    if (!hasAnswer) return undefined;

    if (type === QuestionType.MULTIPLE_CHOICE) {
      if (!dto.answerChoice)
        throw new BadRequestException('선택할 답안 번호를 입력해주세요.');
      if (!choiceCount || dto.answerChoice > choiceCount) {
        throw new BadRequestException('선택지 범위를 벗어난 답안입니다.');
      }
      return { answerChoice: dto.answerChoice, answerText: null };
    }

    const answerText = dto.answerText?.trim();
    if (!answerText)
      throw new BadRequestException('서술형 답안을 입력해주세요.');
    return { answerChoice: null, answerText };
  }

  private toResponse(session: SessionWithRelations): AnswerSessionResponse {
    return {
      id: session.id,
      mode: session.mode,
      paper: {
        ...this.toPaperResponse(session),
        questions: session.items.map((item) => {
          const attempt = this.latestAttempt(item);
          return {
            id: item.questionRevision.questionId,
            number: item.position,
            type: item.questionRevision.type,
            imageUrl: item.questionRevision.imageUrl,
            choiceCount: item.questionRevision.choiceCount,
            recommendedTimeSeconds:
              item.questionRevision.recommendedTimeSeconds,
            result: this.shouldRevealResult(session, attempt)
              ? this.toQuestionResult(item.questionRevision, attempt)
              : null,
          };
        }),
      },
      answers: session.items
        .filter((item) => item.draft)
        .map((item) =>
          this.toAnswerResponse(
            item,
            item.draft!,
            this.latestAttempt(item) ?? null,
          ),
        ),
      result: session.submittedAt ? this.toSessionResult(session) : null,
      submittedAt: session.submittedAt?.toISOString() ?? null,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  private toLogResponse(
    session: SessionWithRelations,
  ): AnswerSessionLogResponse {
    return {
      id: session.id,
      mode: session.mode,
      paper: this.toPaperResponse(session),
      result: this.toSessionResult(session),
      submittedAt: session.submittedAt!.toISOString(),
      createdAt: session.createdAt.toISOString(),
    };
  }

  private toPaperResponse(session: SessionWithRelations) {
    const { paper } = session;
    if (!paper) {
      return {
        id: session.sourceSetId ?? session.id,
        title: session.sourceSet?.title ?? '오답 복습',
        year: session.createdAt.getUTCFullYear(),
        month: null,
        grade: null,
        round: null,
        questionCount: session.items.length,
        isInLibrary: false,
        exam: {
          id: 'wrong-review',
          name: '오답 복습',
          slug: 'wrong-review',
        },
        subject: {
          id: 'mixed',
          name: '혼합',
          slug: 'mixed',
        },
      };
    }
    return {
      id: paper.id,
      title: paper.title,
      year: paper.examSession.displayYear,
      month: paper.examSession.month,
      grade: paper.examSession.grade,
      round: paper.examSession.round,
      questionCount: paper.questionCount,
      isInLibrary: false,
      exam: {
        id: paper.examSession.exam.id,
        name: paper.examSession.exam.name,
        slug: paper.examSession.exam.slug,
      },
      subject: {
        id: paper.subject.id,
        name: paper.subject.name,
        slug: paper.subject.slug,
      },
    };
  }

  private shouldRevealResult(
    session: SessionWithRelations,
    attempt?: StoredAttempt,
  ) {
    return (
      (!!session.submittedAt || session.mode === AnswerMode.ONE_BY_ONE) &&
      !!attempt
    );
  }

  private toQuestionResult(
    question: StoredRevision,
    attempt?: StoredAttempt,
  ): QuestionResultResponse {
    return {
      answerChoice: question.answerChoice,
      answerText: question.answerText,
      explanation: question.explanation,
      isCorrect: attempt?.outcome === AttemptOutcome.CORRECT,
    };
  }

  private toAnswerResponse(
    item: SessionItem,
    draft: StoredDraft,
    attempt: StoredAttempt | null,
  ): AnswerResponse {
    return {
      questionId: item.questionRevision.questionId,
      answerChoice: draft.answerChoice,
      answerText: draft.answerText,
      isCorrect: attempt ? attempt.outcome === AttemptOutcome.CORRECT : null,
      spentMilliseconds: draft.spentMilliseconds,
      updatedAt: draft.updatedAt.toISOString(),
    };
  }

  private latestAttempt(item: SessionItem) {
    return item.attempts.at(-1);
  }

  private toSessionResult(
    session: SessionWithRelations,
  ): AnswerSessionResultResponse {
    const attempts = session.items
      .map((item) => this.latestAttempt(item))
      .filter((attempt): attempt is StoredAttempt => !!attempt);
    const answered = attempts.filter(
      (attempt) => attempt.outcome !== AttemptOutcome.OMITTED,
    );
    const correctCount = attempts.filter(
      (attempt) => attempt.outcome === AttemptOutcome.CORRECT,
    ).length;
    const totalCount = session.items.length;
    return {
      score:
        totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100),
      totalCount,
      answeredCount: answered.length,
      correctCount,
      wrongCount: totalCount - correctCount,
      totalSpentMilliseconds: session.items.reduce(
        (total, item) => total + (item.draft?.spentMilliseconds ?? 0),
        0,
      ),
    };
  }
}
