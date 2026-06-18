import type { StudyWeeklyGoalsRepository } from './study-weekly-goals.repository';
import { StudyWeeklyGoalsService } from './study-weekly-goals.service';

describe('StudyWeeklyGoalsService', () => {
  let repository: jest.Mocked<StudyWeeklyGoalsRepository>;
  let service: StudyWeeklyGoalsService;

  beforeEach(() => {
    repository = {
      createCurrentWeekGoal: jest.fn(),
      findByUserAndWeek: jest.fn(),
    } as unknown as jest.Mocked<StudyWeeklyGoalsRepository>;
    service = new StudyWeeklyGoalsService(repository);
  });

  it('저장된 목표가 없으면 기본 5일 목표를 반환한다', async () => {
    repository.findByUserAndWeek.mockResolvedValue(null);

    const response = await service.getCurrent(
      'user_1',
      new Date('2026-06-18T03:00:00.000Z'),
    );

    expect(repository.findByUserAndWeek).toHaveBeenCalledWith(
      'user_1',
      new Date('2026-06-15T00:00:00.000Z'),
    );
    expect(response.goal).toEqual({
      targetDays: 5,
      effectiveWeekStartDate: '2026-06-15',
      currentWeekStartDate: '2026-06-15',
      isConfigured: false,
    });
  });

  it('현재 주에 설정한 목표를 반환한다', async () => {
    repository.findByUserAndWeek.mockResolvedValue({
      id: 'goal_1',
      userId: 'user_1',
      effectiveWeekStartDate: new Date('2026-06-15T00:00:00.000Z'),
      targetDays: 3,
      createdAt: new Date('2026-06-15T00:00:00.000Z'),
      updatedAt: new Date('2026-06-15T00:00:00.000Z'),
    });

    const response = await service.getCurrent(
      'user_1',
      new Date('2026-06-18T03:00:00.000Z'),
    );

    expect(response.goal).toEqual({
      targetDays: 3,
      effectiveWeekStartDate: '2026-06-15',
      currentWeekStartDate: '2026-06-15',
      isConfigured: true,
    });
  });

  it('현재 주 월요일을 기준으로 목표를 저장한다', async () => {
    repository.findByUserAndWeek.mockResolvedValue(null);
    repository.createCurrentWeekGoal.mockResolvedValue({
      id: 'goal_1',
      userId: 'user_1',
      effectiveWeekStartDate: new Date('2026-06-15T00:00:00.000Z'),
      targetDays: 6,
      createdAt: new Date('2026-06-18T00:00:00.000Z'),
      updatedAt: new Date('2026-06-18T00:00:00.000Z'),
    });

    const response = await service.updateCurrent(
      'user_1',
      6,
      new Date('2026-06-18T03:00:00.000Z'),
    );

    expect(repository.createCurrentWeekGoal).toHaveBeenCalledWith({
      userId: 'user_1',
      effectiveWeekStartDate: new Date('2026-06-15T00:00:00.000Z'),
      targetDays: 6,
    });
    expect(response.goal).toEqual({
      targetDays: 6,
      effectiveWeekStartDate: '2026-06-15',
      currentWeekStartDate: '2026-06-15',
      isConfigured: true,
    });
  });

  it('이미 설정한 현재 주 목표는 다시 저장할 수 없다', async () => {
    repository.findByUserAndWeek.mockResolvedValue({
      id: 'goal_1',
      userId: 'user_1',
      effectiveWeekStartDate: new Date('2026-06-15T00:00:00.000Z'),
      targetDays: 5,
      createdAt: new Date('2026-06-15T00:00:00.000Z'),
      updatedAt: new Date('2026-06-15T00:00:00.000Z'),
    });

    await expect(
      service.updateCurrent('user_1', 6, new Date('2026-06-18T03:00:00.000Z')),
    ).rejects.toThrow('이번 주 학습 목표는 이미 설정했습니다.');
  });
});
