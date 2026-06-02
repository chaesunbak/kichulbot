import { NotFoundException } from '@nestjs/common';
import type { QuestionNote } from '@prisma/client';

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

  it('returns the note stored for the user and question', async () => {
    repository.findNote.mockResolvedValue(note);

    await expect(service.get('user_1', 'question_1')).resolves.toMatchObject({
      note: {
        questionId: 'question_1',
        content: note.content,
      },
    });
    expect(repository.findNote).toHaveBeenCalledWith('user_1', 'question_1');
  });

  it('upserts one note per user and question', async () => {
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

  it('deletes the note when saved content is blank', async () => {
    repository.deleteNote.mockResolvedValue({ count: 1 });

    await expect(service.save('user_1', 'question_1', '   ')).resolves.toEqual({
      note: null,
    });
    expect(repository.deleteNote).toHaveBeenCalledWith('user_1', 'question_1');
    expect(repository.upsertNote).not.toHaveBeenCalled();
  });

  it('rejects notes for unavailable questions', async () => {
    repository.findPublishedQuestion.mockResolvedValue(null);

    await expect(service.get('user_1', 'question_1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
