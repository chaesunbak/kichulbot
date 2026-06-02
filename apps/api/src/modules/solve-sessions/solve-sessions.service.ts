import {
  AnswerResponse,
  GetSolveSessionResponse,
  GetSolveSessionResponseSchema,
  ListSolveSessionLogsResponse,
  ListSolveSessionLogsResponseSchema,
  QuestionResultResponse,
  SaveAnswerResponse,
  SaveAnswerResponseSchema,
  SolveSessionLogResponse,
  SolveSessionResponse,
  SolveSessionResultResponse,
  StartSolveSessionResponse,
  StartSolveSessionResponseSchema,
  SubmitSolveSessionResponse,
  SubmitSolveSessionResponseSchema,
} from '@kichulbot/api-contract/solve-sessions';
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
  QuestionSetKind,
  QuestionType,
} from '@prisma/client';

import { SaveAnswerDto } from './dto/save-answer.dto';
import {
  SolveSessionsRepository,
  SubmittedSolveSessionError,
} from './solve-sessions.repository';

type SessionWithRelations = Prisma.SolveSessionGetPayload<{
  include: {
    paper: {
      include: {
        examSession: { include: { exam: true } };
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
type GradedAnswer = Pick<StoredAttempt, 'outcome'>;

@Injectable()
export class SolveSessionsService {
  constructor(
    private readonly solveSessionsRepository: SolveSessionsRepository,
  ) {}

  async start(
    userId: string,
    paperId: string,
    mode: AnswerMode,
  ): Promise<StartSolveSessionResponse> {
    const paper =
      await this.solveSessionsRepository.findPublishedPaper(paperId);
    if (!paper) throw new NotFoundException('문제지를 찾을 수 없습니다.');

    const session = await this.solveSessionsRepository.start(
      userId,
      paperId,
      mode,
    );
    return StartSolveSessionResponseSchema.parse({
      session: this.toResponse(session),
    });
  }

  async listLogs(userId: string): Promise<ListSolveSessionLogsResponse> {
    const sessions = await this.solveSessionsRepository.findLogs(userId);
    return ListSolveSessionLogsResponseSchema.parse({
      logs: sessions
        .filter((session) => this.shouldIncludeInLogs(session))
        .map((session) => this.toLogResponse(session)),
    });
  }

  async startQuestionSet(
    userId: string,
    questionSetId: string,
    mode: AnswerMode,
  ) {
    const session = await this.solveSessionsRepository.startQuestionSet(
      userId,
      questionSetId,
      mode,
    );
    return StartSolveSessionResponseSchema.parse({
      session: this.toResponse(session),
    });
  }

  async get(userId: string, id: string): Promise<GetSolveSessionResponse> {
    const session = await this.findOwnedSession(userId, id);
    return GetSolveSessionResponseSchema.parse({
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
    const { draft, attempt } = await this.solveSessionsRepository
      .saveAnswer(id, item.id, {
        ...answer,
        spentMilliseconds: dto.spentMilliseconds,
      })
      .catch((error: unknown) => {
        if (error instanceof SubmittedSolveSessionError) {
          throw new BadRequestException('이미 종료된 풀이입니다.');
        }
        throw error;
      });
    const gradedAnswer =
      attempt ?? this.toEphemeralGradedAnswer(session, item, draft);
    return SaveAnswerResponseSchema.parse({
      answer: this.toAnswerResponse(item, draft, gradedAnswer ?? null),
      result: gradedAnswer
        ? this.toQuestionResult(item.questionRevision, gradedAnswer)
        : null,
    });
  }

  async submit(
    userId: string,
    id: string,
  ): Promise<SubmitSolveSessionResponse> {
    const existing = await this.findOwnedSession(userId, id);
    const session = existing.submittedAt
      ? existing
      : await this.solveSessionsRepository.submit(id);
    return SubmitSolveSessionResponseSchema.parse({
      session: this.toResponse(session),
    });
  }

  private async findOwnedSession(userId: string, id: string) {
    const session = await this.solveSessionsRepository.findById(id);
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

  private toResponse(session: SessionWithRelations): SolveSessionResponse {
    return {
      id: session.id,
      mode: session.mode,
      paper: {
        ...this.toPaperResponse(session),
        questions: session.items.map((item) => {
          const gradedAnswer = this.toGradedAnswer(session, item);
          return {
            id: item.questionRevision.questionId,
            questionRevisionId: item.questionRevisionId,
            number: item.position,
            type: item.questionRevision.type,
            imageUrl: item.questionRevision.imageUrl,
            choiceCount: item.questionRevision.choiceCount,
            points: item.questionRevision.points,
            recommendedTimeSeconds:
              item.questionRevision.recommendedTimeSeconds,
            result: this.shouldRevealResult(session, gradedAnswer)
              ? this.toQuestionResult(item.questionRevision, gradedAnswer)
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
            this.toGradedAnswer(session, item) ?? null,
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
  ): SolveSessionLogResponse {
    return {
      id: session.id,
      mode: session.mode,
      paper: this.toPaperResponse(session),
      result: session.submittedAt ? this.toSessionResult(session) : null,
      submittedAt: session.submittedAt?.toISOString() ?? null,
      totalSpentMilliseconds: this.getTotalSpentMilliseconds(session),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
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
      },
    };
  }

  private shouldRevealResult(
    session: SessionWithRelations,
    gradedAnswer?: GradedAnswer,
  ) {
    return (
      (!!session.submittedAt || session.mode === AnswerMode.ONE_BY_ONE) &&
      !!gradedAnswer
    );
  }

  private toQuestionResult(
    question: StoredRevision,
    gradedAnswer?: GradedAnswer,
  ): QuestionResultResponse {
    return {
      answerChoice: question.answerChoice,
      answerText: question.answerText,
      explanation: question.explanation,
      isCorrect: gradedAnswer?.outcome === AttemptOutcome.CORRECT,
    };
  }

  private toAnswerResponse(
    item: SessionItem,
    draft: StoredDraft,
    gradedAnswer: GradedAnswer | null,
  ): AnswerResponse {
    return {
      questionId: item.questionRevision.questionId,
      answerChoice: draft.answerChoice,
      answerText: draft.answerText,
      isCorrect: gradedAnswer
        ? gradedAnswer.outcome === AttemptOutcome.CORRECT
        : null,
      spentMilliseconds: draft.spentMilliseconds,
      updatedAt: draft.updatedAt.toISOString(),
    };
  }

  private latestAttempt(item: SessionItem) {
    return item.attempts.at(-1);
  }

  private toGradedAnswer(session: SessionWithRelations, item: SessionItem) {
    return (
      this.latestAttempt(item) ??
      this.toEphemeralGradedAnswer(session, item, item.draft)
    );
  }

  private toEphemeralGradedAnswer(
    session: SessionWithRelations,
    item: SessionItem,
    draft?: StoredDraft | null,
  ): GradedAnswer | undefined {
    if (this.shouldCreateAttempts(session)) return undefined;
    if (!draft) {
      return session.submittedAt
        ? { outcome: AttemptOutcome.OMITTED }
        : undefined;
    }
    if (!this.hasAnswer(draft) && !session.submittedAt) return undefined;
    return { outcome: this.toOutcome(item.questionRevision, draft) };
  }

  private shouldCreateAttempts(session: SessionWithRelations) {
    return session.sourceSet?.kind !== QuestionSetKind.DAILY_WRONG;
  }

  private shouldIncludeInLogs(session: SessionWithRelations) {
    return this.shouldCreateAttempts(session);
  }

  private getTotalSpentMilliseconds(session: SessionWithRelations) {
    return session.items.reduce(
      (total, item) => total + (item.draft?.spentMilliseconds ?? 0),
      0,
    );
  }

  private toSessionResult(
    session: SessionWithRelations,
  ): SolveSessionResultResponse {
    const attempts = session.items
      .map((item) => this.toGradedAnswer(session, item))
      .filter((attempt): attempt is GradedAnswer => !!attempt);
    const answered = attempts.filter(
      (attempt) => attempt.outcome !== AttemptOutcome.OMITTED,
    );
    const correctCount = attempts.filter(
      (attempt) => attempt.outcome === AttemptOutcome.CORRECT,
    ).length;
    const totalCount = session.items.length;
    const score = session.items.reduce((total, item) => {
      const gradedAnswer = this.toGradedAnswer(session, item);
      return gradedAnswer?.outcome === AttemptOutcome.CORRECT
        ? total + item.questionRevision.points
        : total;
    }, 0);
    return {
      score,
      totalCount,
      answeredCount: answered.length,
      correctCount,
      wrongCount: totalCount - correctCount,
      totalSpentMilliseconds: this.getTotalSpentMilliseconds(session),
    };
  }

  private toOutcome(
    question: StoredRevision,
    draft?: StoredDraft | null,
  ): AttemptOutcome {
    if (!draft || !this.hasAnswer(draft)) return AttemptOutcome.OMITTED;
    const isCorrect =
      question.type === QuestionType.MULTIPLE_CHOICE
        ? draft.answerChoice === question.answerChoice
        : draft.answerText?.trim() === question.answerText?.trim();
    return isCorrect ? AttemptOutcome.CORRECT : AttemptOutcome.INCORRECT;
  }

  private hasAnswer(answer?: {
    answerChoice?: number | null;
    answerText?: string | null;
  }) {
    return answer?.answerChoice != null || answer?.answerText != null;
  }
}
