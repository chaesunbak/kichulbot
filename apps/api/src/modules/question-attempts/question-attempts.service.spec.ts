import { BadRequestException } from '@nestjs/common';

import { AttemptOutcome } from '../../infrastructure/database/prisma-client';
import type { QuestionAttemptsRepository } from './question-attempts.repository';
import { QuestionAttemptsService } from './question-attempts.service';

const gradedAt = new Date('2026-06-01T03:00:00.000Z');

describe('QuestionAttemptsService', () => {
  let service: QuestionAttemptsService;
  let repository: jest.Mocked<QuestionAttemptsRepository>;

  beforeEach(() => {
    repository = {
      findByUserAndRange: jest.fn(),
    } as unknown as jest.Mocked<QuestionAttemptsRepository>;
    service = new QuestionAttemptsService(repository);
  });

  it('KST 날짜 범위를 UTC 경계로 변환해 조회한다', async () => {
    repository.findByUserAndRange.mockResolvedValue([makeAttempt() as never]);

    const response = await service.list('user_1', {
      from: '2026-06-01',
      to: '2026-06-07',
    });

    expect(repository.findByUserAndRange).toHaveBeenCalledWith(
      'user_1',
      new Date('2026-05-31T15:00:00.000Z'),
      new Date('2026-06-07T15:00:00.000Z'),
      false,
    );
    expect(response.questionAttempts[0]).toMatchObject({
      id: 'attempt_1',
      questionId: 'question_1',
      outcome: AttemptOutcome.CORRECT,
      gradedAt: gradedAt.toISOString(),
    });
    expect(response.questionAttempts[0]).not.toHaveProperty('tags');
  });

  it('조회 종료일이 시작일보다 이전이면 거부한다', async () => {
    await expect(
      service.list('user_1', { from: '2026-06-02', to: '2026-06-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findByUserAndRange).not.toHaveBeenCalled();
  });

  it('날짜 형식이 YYYY-MM-DD가 아니면 거부한다', async () => {
    await expect(
      service.list('user_1', {
        from: '2026-06-01T00:00:00Z',
        to: '2026-06-02',
      }),
    ).rejects.toThrow('날짜는 YYYY-MM-DD 형식이어야 합니다.');
  });

  it('요청 시 문항 태그와 태그 그룹을 함께 반환한다', async () => {
    repository.findByUserAndRange.mockResolvedValue([
      makeAttemptWithTags() as never,
    ]);

    const response = await service.list('user_1', {
      from: '2026-06-01',
      to: '2026-06-01',
      includeTags: true,
    });

    expect(repository.findByUserAndRange).toHaveBeenCalledWith(
      'user_1',
      expect.any(Date),
      expect.any(Date),
      true,
    );
    expect(response.questionAttempts[0]).toMatchObject({
      tags: [
        {
          id: 'tag_1',
          name: '조선',
          kind: 'OFFICIAL',
          tagGroup: {
            id: 'tag_group_1',
            examId: 'exam_1',
            name: '시대',
          },
        },
        {
          id: 'tag_2',
          tagGroup: null,
        },
      ],
    });
  });
});

function makeAttempt() {
  return {
    id: 'attempt_1',
    userId: 'user_1',
    sessionItemId: 'session_item_1',
    questionRevisionId: 'question_revision_1',
    questionRevision: {
      id: 'question_revision_1',
      questionId: 'question_1',
    },
    answerChoice: 3,
    answerText: null,
    outcome: AttemptOutcome.CORRECT,
    spentMilliseconds: 1200,
    gradedAt,
  };
}

function makeAttemptWithTags() {
  return {
    ...makeAttempt(),
    questionRevision: {
      id: 'question_revision_1',
      questionId: 'question_1',
      question: {
        tags: [
          {
            tag: {
              id: 'tag_1',
              name: '조선',
              tagGroup: {
                id: 'tag_group_1',
                examId: 'exam_1',
                name: '시대',
                selectionMode: 'SINGLE',
                sortOrder: 1,
                isActive: true,
              },
            },
          },
          {
            tag: {
              id: 'tag_2',
              name: '사료',
              tagGroup: null,
            },
          },
        ],
      },
    },
  };
}
