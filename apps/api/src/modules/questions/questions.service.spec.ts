import { BadRequestException } from '@nestjs/common';
import { QuestionType } from '@prisma/client';

import type { StorageService } from '../../infrastructure/storage/storage.service';
import type { TagsService } from '../tags/tags.service';
import type { QuestionsRepository } from './questions.repository';
import { QuestionsService } from './questions.service';

const image = {
  originalname: 'question.png',
  mimetype: 'image/png',
  size: 128,
  buffer: Buffer.from('image'),
};

describe('QuestionsService', () => {
  let service: QuestionsService;
  let repository: jest.Mocked<QuestionsRepository>;
  let storageService: jest.Mocked<StorageService>;
  let tagsService: jest.Mocked<TagsService>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findPaper: jest.fn(),
      updateImageUrl: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<QuestionsRepository>;
    storageService = {
      uploadQuestionImage: jest.fn(),
      getPublicUrl: jest.fn(),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };
    tagsService = {
      assertTagsAssignable: jest.fn(),
    } as unknown as jest.Mocked<TagsService>;
    service = new QuestionsService(repository, storageService, tagsService);
  });

  it('rejects creating a question number beyond the paper size', async () => {
    repository.findPaper.mockResolvedValue({
      id: 'paper_1',
      questionCount: 20,
    } as never);

    await expect(
      service.createQuestion(
        {
          paperId: 'paper_1',
          number: 21,
          choiceCount: 5,
          answerChoice: 1,
        },
        image,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects moving a question number beyond the paper size', async () => {
    repository.findById.mockResolvedValue({
      id: 'question_1',
      paperId: 'paper_1',
      type: QuestionType.MULTIPLE_CHOICE,
      choiceCount: 5,
      answerChoice: 1,
      answerText: null,
      imageUrl: null,
      tags: [],
    } as never);
    repository.findPaper.mockResolvedValue({
      id: 'paper_1',
      questionCount: 20,
    } as never);

    await expect(
      service.updateQuestion('question_1', { number: 21 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects creating a written question without an answer text', async () => {
    repository.findPaper.mockResolvedValue({
      id: 'paper_1',
      questionCount: 20,
    } as never);

    await expect(
      service.createQuestion(
        {
          paperId: 'paper_1',
          number: 1,
          type: QuestionType.WRITTEN,
        },
        image,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('clears multiple-choice fields when changing a question to written', async () => {
    repository.findById.mockResolvedValue({
      id: 'question_1',
      paperId: 'paper_1',
      number: 1,
      type: QuestionType.MULTIPLE_CHOICE,
      choiceCount: 5,
      answerChoice: 2,
      answerText: null,
      imageUrl: null,
      tags: [],
    } as never);
    repository.update.mockResolvedValue({
      id: 'question_1',
      paperId: 'paper_1',
      number: 1,
      type: QuestionType.WRITTEN,
      choiceCount: null,
      answerChoice: null,
      answerText: '모범답안',
      explanation: null,
      points: 5,
      recommendedTimeSeconds: null,
      imageUrl: null,
      tags: [],
      createdAt: new Date('2026-05-31T00:00:00.000Z'),
      updatedAt: new Date('2026-05-31T00:00:00.000Z'),
    });

    await service.updateQuestion('question_1', {
      type: QuestionType.WRITTEN,
      answerText: ' 모범답안 ',
    });

    expect(repository.update).toHaveBeenCalledWith(
      'question_1',
      {
        number: undefined,
        type: QuestionType.WRITTEN,
        choiceCount: null,
        answerChoice: null,
        answerText: '모범답안',
      },
      undefined,
    );
  });

  it('deletes a question and its stored image', async () => {
    repository.findById.mockResolvedValue({
      id: 'question_1',
      imageUrl: 'http://localhost:4000/uploads/questions/question_1.png',
    } as never);

    await service.deleteQuestion('question_1');

    expect(repository.delete).toHaveBeenCalledWith('question_1');
    expect(storageService.deleteObject).toHaveBeenCalledWith(
      'questions/question_1.png',
    );
  });
});
