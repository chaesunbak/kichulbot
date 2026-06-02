import { BadRequestException, Injectable } from '@nestjs/common';

import { QuestionAttemptsRepository } from './question-attempts.repository';

const KST_OFFSET = '+09:00';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class QuestionAttemptsService {
  constructor(
    private readonly questionAttemptsRepository: QuestionAttemptsRepository,
  ) {}

  async list(userId: string, query: { from: string; to: string }) {
    const from = this.toStartOfKstDay(query.from);
    const toExclusive = this.toStartOfNextKstDay(query.to);

    if (from >= toExclusive) {
      throw new BadRequestException('조회 종료일은 시작일 이후여야 합니다.');
    }

    const attempts = await this.questionAttemptsRepository.findByUserAndRange(
      userId,
      from,
      toExclusive,
    );

    return {
      questionAttempts: attempts.map((attempt) => ({
        id: attempt.id,
        sessionItemId: attempt.sessionItemId,
        questionRevisionId: attempt.questionRevisionId,
        questionId: attempt.questionRevision.questionId,
        answerChoice: attempt.answerChoice,
        answerText: attempt.answerText,
        outcome: attempt.outcome,
        spentMilliseconds: attempt.spentMilliseconds,
        gradedAt: attempt.gradedAt.toISOString(),
      })),
    };
  }

  private toStartOfKstDay(date: string) {
    this.assertDateOnly(date);
    return new Date(`${date}T00:00:00.000${KST_OFFSET}`);
  }

  private toStartOfNextKstDay(date: string) {
    const start = this.toStartOfKstDay(date);
    start.setUTCDate(start.getUTCDate() + 1);
    return start;
  }

  private assertDateOnly(date: string) {
    if (!DATE_PATTERN.test(date)) {
      throw new BadRequestException('날짜는 YYYY-MM-DD 형식이어야 합니다.');
    }
  }
}
