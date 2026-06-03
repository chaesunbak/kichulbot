import { NotFoundException } from '@nestjs/common';
import type { QuestionNote } from '../../infrastructure/database/prisma-client';

import type { QuestionNotesRepository } from './question-notes.repository';
import { QuestionNotesService } from './question-notes.service';

const now = new Date('2026-06-02T00:00:00.000Z');
const note = {
  id: 'note_1',
  userId: 'user_1',
  questionId: 'question_1',
  content: '선지 3번과 4번 구분 다시 보기',
  createdAt: now,
  updatedAt: now,
} satisfies QuestionNote;

describe('QuestionNotesService', () => {
  let service: QuestionNotesService;
  let repository: jest.Mocked<QuestionNotesRepository>;

  beforeEach(() => {
    repository = {
      findPublishedQuestion: jest.fn().mockResolvedValue({
        id: 'question_1',
      }),
      findNote: jest.fn(),
      upsertNote: jest.fn(),
      deleteNote: jest.fn(),
    } as unknown as jest.Mocked<QuestionNotesRepository>;
    service = new QuestionNotesService(repository);
  });

  it('사용자와 문항에 저장된 노트를 반환한다', async () => {
    repository.findNote.mockResolvedValue(note);

    await expect(service.get('user_1', 'question_1')).resolves.toMatchObject({
      note: {
        questionId: 'question_1',
        content: note.content,
      },
    });
    expect(repository.findNote).toHaveBeenCalledWith('user_1', 'question_1');
  });

  it('사용자와 문항별로 노트 하나만 저장되도록 갱신 또는 생성한다', async () => {
    repository.upsertNote.mockResolvedValue({
      ...note,
      content: '오답 원인: 시대 순서 착각',
    });

    await service.save('user_1', 'question_1', ' 오답 원인: 시대 순서 착각 ');

    expect(repository.upsertNote).toHaveBeenCalledWith(
      'user_1',
      'question_1',
      '오답 원인: 시대 순서 착각',
    );
  });

  it('저장 내용이 비어 있으면 노트를 삭제한다', async () => {
    repository.deleteNote.mockResolvedValue({ count: 1 });

    await expect(service.save('user_1', 'question_1', '   ')).resolves.toEqual({
      note: null,
    });
    expect(repository.deleteNote).toHaveBeenCalledWith('user_1', 'question_1');
    expect(repository.upsertNote).not.toHaveBeenCalled();
  });

  it('이용할 수 없는 문항의 노트 조회를 거부한다', async () => {
    repository.findPublishedQuestion.mockResolvedValue(null);

    await expect(service.get('user_1', 'question_1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
