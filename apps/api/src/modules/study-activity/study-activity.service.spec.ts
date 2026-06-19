import { BadRequestException } from '@nestjs/common';

import type { StudyActivityRepository } from './study-activity.repository';
import { StudyActivityService } from './study-activity.service';

describe('StudyActivityService', () => {
  let repository: jest.Mocked<StudyActivityRepository>;
  let service: StudyActivityService;

  beforeEach(() => {
    repository = {
      findActivityUsers: jest.fn(),
      findDraftActivityDates: jest.fn(),
      findSubmittedActivityDates: jest.fn(),
      findUserActivitySessions: jest.fn(),
    } as unknown as jest.Mocked<StudyActivityRepository>;
    service = new StudyActivityService(repository);
  });

  it('날짜가 없으면 KST 오늘 기준으로 공부시간을 조회한다', async () => {
    repository.findUserActivitySessions.mockResolvedValue([]);

    const response = await service.getStudyTime(
      'user_1',
      undefined,
      new Date('2026-06-18T16:00:00.000Z'),
    );

    expect(repository.findUserActivitySessions).toHaveBeenCalledWith(
      'user_1',
      new Date('2026-06-18T15:00:00.000Z'),
      new Date('2026-06-19T15:00:00.000Z'),
    );
    expect(response).toEqual({
      date: '2026-06-19',
      spentMilliseconds: 0,
    });
  });

  it('제출 또는 임시답안 갱신으로 활동한 세션의 시간을 합산한다', async () => {
    repository.findUserActivitySessions.mockResolvedValue([
      {
        items: [
          { draft: { spentMilliseconds: 60_000 } },
          { draft: { spentMilliseconds: 120_000 } },
          { draft: null },
        ],
      },
      {
        items: [{ draft: { spentMilliseconds: 30_000 } }],
      },
    ] as never);

    const response = await service.getStudyTime('user_1', '2026-06-01');

    expect(repository.findUserActivitySessions).toHaveBeenCalledWith(
      'user_1',
      new Date('2026-05-31T15:00:00.000Z'),
      new Date('2026-06-01T15:00:00.000Z'),
    );
    expect(response).toEqual({
      date: '2026-06-01',
      spentMilliseconds: 210_000,
    });
  });

  it('같은 날짜에 활동한 고유 사용자 수를 반환한다', async () => {
    repository.findActivityUsers.mockResolvedValue([
      { userId: 'user_1' },
      { userId: 'user_2' },
    ]);

    const response = await service.getActiveUsers('2026-06-01');

    expect(repository.findActivityUsers).toHaveBeenCalledWith(
      new Date('2026-05-31T15:00:00.000Z'),
      new Date('2026-06-01T15:00:00.000Z'),
    );
    expect(response).toEqual({
      date: '2026-06-01',
      activeUserCount: 2,
    });
  });

  it('날짜가 없으면 KST 오늘 기준으로 활동 사용자 수를 조회한다', async () => {
    repository.findActivityUsers.mockResolvedValue([{ userId: 'user_1' }]);

    const response = await service.getActiveUsers(
      undefined,
      new Date('2026-06-18T16:00:00.000Z'),
    );

    expect(repository.findActivityUsers).toHaveBeenCalledWith(
      new Date('2026-06-18T15:00:00.000Z'),
      new Date('2026-06-19T15:00:00.000Z'),
    );
    expect(response).toEqual({
      date: '2026-06-19',
      activeUserCount: 1,
    });
  });

  it('제출일과 임시답안 갱신일을 모두 연속 학습일로 계산한다', async () => {
    repository.findSubmittedActivityDates.mockResolvedValue([
      { submittedAt: new Date('2026-06-17T15:30:00.000Z') },
      { submittedAt: new Date('2026-06-15T15:30:00.000Z') },
      { submittedAt: new Date('2026-06-14T15:30:00.000Z') },
    ]);
    repository.findDraftActivityDates.mockResolvedValue([
      { updatedAt: new Date('2026-06-18T03:00:00.000Z') },
      { updatedAt: new Date('2026-06-16T15:30:00.000Z') },
    ]);

    const response = await service.getStudyStreak(
      'user_1',
      new Date('2026-06-18T12:00:00.000Z'),
    );

    expect(response).toEqual({ currentStreakDays: 4 });
  });

  it('오늘 학습 기록이 없으면 연속 학습일을 0으로 반환한다', async () => {
    repository.findSubmittedActivityDates.mockResolvedValue([
      { submittedAt: new Date('2026-06-17T03:00:00.000Z') },
    ]);
    repository.findDraftActivityDates.mockResolvedValue([
      { updatedAt: new Date('2026-06-16T03:00:00.000Z') },
    ]);

    const response = await service.getStudyStreak(
      'user_1',
      new Date('2026-06-18T12:00:00.000Z'),
    );

    expect(response).toEqual({ currentStreakDays: 0 });
  });

  it('연속 학습일은 학습하지 않은 날짜에서 끊긴다', async () => {
    repository.findSubmittedActivityDates.mockResolvedValue([
      { submittedAt: new Date('2026-06-18T03:00:00.000Z') },
      { submittedAt: new Date('2026-06-16T03:00:00.000Z') },
    ]);
    repository.findDraftActivityDates.mockResolvedValue([]);

    const response = await service.getStudyStreak(
      'user_1',
      new Date('2026-06-18T12:00:00.000Z'),
    );

    expect(response).toEqual({ currentStreakDays: 1 });
  });

  it('같은 날짜의 여러 활동은 연속 학습일을 중복 증가시키지 않는다', async () => {
    repository.findSubmittedActivityDates.mockResolvedValue([
      { submittedAt: new Date('2026-06-18T03:00:00.000Z') },
      { submittedAt: new Date('2026-06-18T05:00:00.000Z') },
      { submittedAt: new Date('2026-06-17T03:00:00.000Z') },
    ]);
    repository.findDraftActivityDates.mockResolvedValue([
      { updatedAt: new Date('2026-06-18T07:00:00.000Z') },
      { updatedAt: new Date('2026-06-17T07:00:00.000Z') },
    ]);

    const response = await service.getStudyStreak(
      'user_1',
      new Date('2026-06-18T12:00:00.000Z'),
    );

    expect(response).toEqual({ currentStreakDays: 2 });
  });

  it('날짜 형식이 YYYY-MM-DD가 아니면 거부한다', async () => {
    await expect(
      service.getStudyTime('user_1', '2026-06-01T00:00:00Z'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findUserActivitySessions).not.toHaveBeenCalled();
  });

  it('존재하지 않는 날짜는 거부한다', async () => {
    await expect(service.getActiveUsers('2026-02-31')).rejects.toThrow(
      '날짜가 올바른 날짜가 아닙니다.',
    );
    expect(repository.findActivityUsers).not.toHaveBeenCalled();
  });
});
