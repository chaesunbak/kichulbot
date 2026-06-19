import { NotFoundException } from '@nestjs/common';

import { AttemptOutcome } from '../../infrastructure/database/prisma-client';
import type { RecapRepository } from './recap.repository';
import { RecapService } from './recap.service';

describe('RecapService', () => {
  let repository: jest.Mocked<RecapRepository>;
  let service: RecapService;

  beforeEach(() => {
    repository = {
      findDailyWrongQuestionSetSummary: jest.fn(),
      findSubmittedSolveSessions: jest.fn(),
      findUserTimezone: jest.fn(),
    } as unknown as jest.Mocked<RecapRepository>;
    service = new RecapService(repository);
  });

  it('오늘 제출된 풀이 세션 통계를 합산한다', async () => {
    const generatedAt = new Date('2026-06-19T01:00:00.000Z');
    repository.findUserTimezone.mockResolvedValue({ timezone: 'Asia/Seoul' });
    repository.findSubmittedSolveSessions.mockResolvedValue([
      {
        items: [
          { attempts: [{ outcome: AttemptOutcome.CORRECT }] },
          { attempts: [{ outcome: AttemptOutcome.INCORRECT }] },
          { attempts: [{ outcome: AttemptOutcome.OMITTED }] },
          {
            attempts: [
              { outcome: AttemptOutcome.INCORRECT },
              { outcome: AttemptOutcome.CORRECT },
            ],
          },
        ],
      },
    ]);
    repository.findDailyWrongQuestionSetSummary.mockResolvedValue({
      id: 'daily_wrong_1',
      generated: { generatedAt },
      _count: { items: 3 },
    });

    const response = await service.getSummary(
      'user_1',
      new Date('2026-06-19T03:00:00.000Z'),
    );

    expect(repository.findSubmittedSolveSessions).toHaveBeenCalledWith(
      'user_1',
      new Date('2026-06-18T15:00:00.000Z'),
      new Date('2026-06-19T15:00:00.000Z'),
    );
    expect(repository.findDailyWrongQuestionSetSummary).toHaveBeenCalledWith(
      'user_1',
      new Date('2026-06-19T00:00:00.000Z'),
    );
    expect(response).toEqual({
      studyDate: '2026-06-19',
      todayStats: {
        accuracyRate: 50,
        correctCount: 2,
        incorrectCount: 1,
        omittedCount: 1,
        totalCount: 4,
      },
      wrongReview: {
        questionSetId: 'daily_wrong_1',
        questionCount: 3,
        generatedAt: generatedAt.toISOString(),
      },
    });
  });

  it('오늘 제출된 풀이와 오답 세트가 없으면 빈 요약을 반환한다', async () => {
    repository.findUserTimezone.mockResolvedValue({ timezone: 'Asia/Seoul' });
    repository.findSubmittedSolveSessions.mockResolvedValue([]);
    repository.findDailyWrongQuestionSetSummary.mockResolvedValue(null);

    const response = await service.getSummary(
      'user_1',
      new Date('2026-06-19T03:00:00.000Z'),
    );

    expect(response).toEqual({
      studyDate: '2026-06-19',
      todayStats: {
        accuracyRate: 0,
        correctCount: 0,
        incorrectCount: 0,
        omittedCount: 0,
        totalCount: 0,
      },
      wrongReview: {
        questionSetId: null,
        questionCount: 0,
        generatedAt: null,
      },
    });
  });

  it('사용자를 찾을 수 없으면 예외를 던진다', async () => {
    repository.findUserTimezone.mockResolvedValue(null);

    await expect(service.getSummary('user_1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.findSubmittedSolveSessions).not.toHaveBeenCalled();
    expect(repository.findDailyWrongQuestionSetSummary).not.toHaveBeenCalled();
  });
});
