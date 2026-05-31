import {
  AnswerSessionLogResponse,
  AnswerSessionResponse,
  DraftAnswerResponse,
  GetAnswerSessionResponse,
  GetAnswerSessionResponseSchema,
  ListAnswerSessionLogsResponse,
  ListAnswerSessionLogsResponseSchema,
  QuestionResultResponse,
  SaveDraftAnswerResponse,
  SaveDraftAnswerResponseSchema,
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
import { AnswerMode, Prisma, Question, QuestionType } from '@prisma/client';
import { SaveDraftAnswerDto } from './dto/save-draft-answer.dto';
import { AnswerSessionsRepository } from './answer-sessions.repository';

type SessionWithRelations = Prisma.AnswerSessionGetPayload<{
  include: {
    paper: { include: { exam: true; subject: true; questions: true } };
    draftAnswers: true;
  };
}>;
type Draft = SessionWithRelations['draftAnswers'][number];

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

  async get(userId: string, id: string): Promise<GetAnswerSessionResponse> {
    const session = await this.findOwnedSession(userId, id);
    return GetAnswerSessionResponseSchema.parse({
      session: this.toResponse(session),
    });
  }

  async saveDraftAnswer(
    userId: string,
    id: string,
    questionId: string,
    dto: SaveDraftAnswerDto,
  ): Promise<SaveDraftAnswerResponse> {
    const session = await this.findOwnedSession(userId, id);
    if (session.submittedAt) {
      throw new BadRequestException('이미 종료된 풀이입니다.');
    }
    const question = session.paper.questions.find(
      (item) => item.id === questionId,
    );
    if (!question) throw new NotFoundException('문항을 찾을 수 없습니다.');

    const answer = this.resolveAnswer(question.type, question.choiceCount, dto);
    if (!answer && dto.spentMilliseconds === undefined) {
      throw new BadRequestException(
        '저장할 답안 또는 풀이 시간을 입력해주세요.',
      );
    }
    const draftAnswer = await this.answerSessionsRepository.saveDraftAnswer(
      id,
      questionId,
      { ...answer, spentMilliseconds: dto.spentMilliseconds },
    );
    return SaveDraftAnswerResponseSchema.parse({
      draftAnswer: this.toDraftAnswerResponse(draftAnswer),
      result: this.shouldRevealResult(session, draftAnswer)
        ? this.toQuestionResult(question, draftAnswer)
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
    dto: SaveDraftAnswerDto,
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
    const { paper } = session;
    return {
      id: session.id,
      mode: session.mode,
      paper: {
        ...this.toPaperResponse(paper),
        questions: paper.questions.map((question) => {
          const draft = session.draftAnswers.find(
            (answer) => answer.questionId === question.id,
          );
          return {
            id: question.id,
            number: question.number,
            type: question.type,
            imageUrl: question.imageUrl,
            choiceCount: question.choiceCount,
            recommendedTimeSeconds: question.recommendedTimeSeconds,
            result:
              draft && this.shouldRevealResult(session, draft)
                ? this.toQuestionResult(question, draft)
                : null,
          };
        }),
      },
      draftAnswers: session.draftAnswers.map((answer) =>
        this.toDraftAnswerResponse(answer),
      ),
      submittedAt: session.submittedAt?.toISOString() ?? null,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  private toLogResponse(
    session: SessionWithRelations,
  ): AnswerSessionLogResponse {
    const answeredDrafts = session.draftAnswers.filter((draft) =>
      this.hasAnswer(draft),
    );
    return {
      id: session.id,
      mode: session.mode,
      paper: this.toPaperResponse(session.paper),
      answeredCount: answeredDrafts.length,
      correctCount: answeredDrafts.filter((draft) => {
        const question = session.paper.questions.find(
          (item) => item.id === draft.questionId,
        );
        return question && this.isCorrect(question, draft);
      }).length,
      totalSpentMilliseconds: session.draftAnswers.reduce(
        (total, draft) => total + draft.spentMilliseconds,
        0,
      ),
      submittedAt: session.submittedAt!.toISOString(),
      createdAt: session.createdAt.toISOString(),
    };
  }

  private toPaperResponse(paper: SessionWithRelations['paper']) {
    return {
      id: paper.id,
      title: paper.title,
      year: paper.year,
      questionCount: paper.questionCount,
      isInLibrary: false,
      exam: { id: paper.exam.id, name: paper.exam.name, slug: paper.exam.slug },
      subject: {
        id: paper.subject.id,
        name: paper.subject.name,
        slug: paper.subject.slug,
      },
    };
  }

  private shouldRevealResult(session: SessionWithRelations, draft: Draft) {
    return (
      !!session.submittedAt ||
      (session.mode === AnswerMode.ONE_BY_ONE && this.hasAnswer(draft))
    );
  }

  private toQuestionResult(
    question: Question,
    draft: Draft,
  ): QuestionResultResponse {
    return {
      answerChoice: question.answerChoice,
      answerText: question.answerText,
      explanation: question.explanation,
      isCorrect: this.hasAnswer(draft) ? this.isCorrect(question, draft) : null,
    };
  }

  private hasAnswer(draft: Draft) {
    return draft.answerChoice !== null || draft.answerText !== null;
  }

  private isCorrect(question: Question, draft: Draft) {
    return question.type === QuestionType.MULTIPLE_CHOICE
      ? draft.answerChoice === question.answerChoice
      : draft.answerText?.trim() === question.answerText?.trim();
  }

  private toDraftAnswerResponse(answer: Draft): DraftAnswerResponse {
    return {
      questionId: answer.questionId,
      answerChoice: answer.answerChoice,
      answerText: answer.answerText,
      spentMilliseconds: answer.spentMilliseconds,
      updatedAt: answer.updatedAt.toISOString(),
    };
  }
}
