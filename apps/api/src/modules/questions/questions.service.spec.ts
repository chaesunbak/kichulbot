import { BadRequestException } from '@nestjs/common';

import {
  GradingPolicy,
  QuestionType,
} from '../../infrastructure/database/prisma-client';
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

  it('시험지 문항 수를 초과한 번호로 문항 생성을 거부한다', async () => {
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

  it('시험지 문항 수를 초과한 번호로 문항 이동을 거부한다', async () => {
    repository.findById.mockResolvedValue({
      id: 'question_1',
      paperId: 'paper_1',
      type: QuestionType.MULTIPLE_CHOICE,
      choiceCount: 5,
      gradingPolicy: GradingPolicy.EXACT,
      answerChoice: 1,
      answerText: null,
      imageUrl: 'http://localhost:4000/uploads/questions/question_1.png',
      imageHash: 'legacy_question_1',
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

  it('서술형 문항에 정답 텍스트가 없으면 생성을 거부한다', async () => {
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

  it('모든 선택지가 정답인 객관식은 정답 번호 없이 생성한다', async () => {
    repository.findPaper.mockResolvedValue(makePaper() as never);
    storageService.uploadQuestionImage.mockResolvedValue({
      objectKey: 'questions/korean-history-advanced/78/001-question_1.png',
      url: 'http://localhost:4000/uploads/questions/korean-history-advanced/78/001-question_1.png',
    });
    repository.create.mockResolvedValue({
      id: 'question_1',
      paperId: 'paper_1',
      number: 1,
      type: QuestionType.MULTIPLE_CHOICE,
      choiceCount: 5,
      gradingPolicy: GradingPolicy.ANY_CHOICE,
      rawText: null,
      promptText: null,
      passageText: null,
      choiceTexts: [],
      answerChoice: null,
      answerText: null,
      explanation: null,
      points: 5,
      recommendedTimeSeconds: null,
      recommendedTagIds: [],
      recommendedTagMatches: [],
      imageUrl: 'http://localhost:4000/uploads/questions/question_1.png',
      imageHash: 'legacy_question_1',
      tags: [],
      createdAt: new Date('2026-05-31T00:00:00.000Z'),
      updatedAt: new Date('2026-05-31T00:00:00.000Z'),
    });

    await service.createQuestion(
      {
        paperId: 'paper_1',
        number: 1,
        choiceCount: 5,
        gradingPolicy: GradingPolicy.ANY_CHOICE,
      },
      image,
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        gradingPolicy: GradingPolicy.ANY_CHOICE,
        answerChoice: null,
      }),
      [],
    );
  });

  it('이미지 업로드 파일 내용의 sha256 해시를 문항에 저장한다', async () => {
    repository.findPaper.mockResolvedValue(makePaper() as never);
    storageService.uploadQuestionImage.mockResolvedValue({
      objectKey: 'questions/korean-history-advanced/78/001-question_1.png',
      url: 'http://localhost:4000/uploads/questions/korean-history-advanced/78/001-question_1.png',
    });
    repository.create.mockResolvedValue({
      id: 'question_1',
      paperId: 'paper_1',
      number: 1,
      type: QuestionType.MULTIPLE_CHOICE,
      choiceCount: 5,
      gradingPolicy: GradingPolicy.EXACT,
      rawText: null,
      promptText: null,
      passageText: null,
      choiceTexts: [],
      answerChoice: 2,
      answerText: null,
      explanation: null,
      points: 5,
      recommendedTimeSeconds: null,
      recommendedTagIds: [],
      recommendedTagMatches: [],
      imageUrl: 'http://localhost:4000/uploads/questions/question_1.png',
      imageHash:
        '6105d6cc76af400325e94d588ce511be5bfdbb73b437dc51eca43917d7a43e3d',
      tags: [],
      createdAt: new Date('2026-05-31T00:00:00.000Z'),
      updatedAt: new Date('2026-05-31T00:00:00.000Z'),
    });

    const response = await service.createQuestion(
      {
        paperId: 'paper_1',
        number: 1,
        choiceCount: 5,
        answerChoice: 2,
      },
      image,
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        imageHash:
          '6105d6cc76af400325e94d588ce511be5bfdbb73b437dc51eca43917d7a43e3d',
      }),
      [],
    );
    expect(storageService.uploadQuestionImage).toHaveBeenCalledWith(
      image,
      expect.objectContaining({
        examSlug: 'korean-history-advanced',
        paperSlug: '78',
        questionNumber: 1,
      }),
    );
    expect(response.question.imageCacheKey).toBe(
      'sha256_6105d6cc76af400325e94d588ce511be5bfdbb73b437dc51eca43917d7a43e3d',
    );
  });

  it('문항 원문과 선지 텍스트를 문항 생성 데이터에 저장한다', async () => {
    repository.findPaper.mockResolvedValue(makePaper() as never);
    storageService.uploadQuestionImage.mockResolvedValue({
      objectKey: 'questions/korean-history-advanced/78/001-question_1.png',
      url: 'http://localhost:4000/uploads/questions/korean-history-advanced/78/001-question_1.png',
    });
    repository.create.mockResolvedValue({
      id: 'question_1',
      paperId: 'paper_1',
      number: 1,
      type: QuestionType.MULTIPLE_CHOICE,
      choiceCount: 5,
      gradingPolicy: GradingPolicy.EXACT,
      rawText: '1. 문항 전체 텍스트',
      promptText: '1. 문항 발문',
      passageText: '문항 지문',
      choiceTexts: ['① 첫 번째', '② 두 번째'],
      answerChoice: 2,
      answerText: null,
      explanation: null,
      points: 5,
      recommendedTimeSeconds: null,
      recommendedTagIds: [],
      recommendedTagMatches: [],
      imageUrl: 'http://localhost:4000/uploads/questions/question_1.png',
      imageHash: 'legacy_question_1',
      tags: [],
      createdAt: new Date('2026-05-31T00:00:00.000Z'),
      updatedAt: new Date('2026-05-31T00:00:00.000Z'),
    });

    await service.createQuestion(
      {
        paperId: 'paper_1',
        number: 1,
        choiceCount: 5,
        answerChoice: 2,
        rawText: ' 1. 문항 전체 텍스트 ',
        promptText: ' 1. 문항 발문 ',
        passageText: ' 문항 지문 ',
        choiceTexts: ['① 첫 번째', ' ', '② 두 번째'],
      },
      image,
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        rawText: '1. 문항 전체 텍스트',
        promptText: '1. 문항 발문',
        passageText: '문항 지문',
        choiceTexts: ['① 첫 번째', '② 두 번째'],
      }),
      [],
    );
  });

  it('문항을 서술형으로 바꾸면 객관식 필드를 비운다', async () => {
    repository.findById.mockResolvedValue({
      id: 'question_1',
      paperId: 'paper_1',
      number: 1,
      type: QuestionType.MULTIPLE_CHOICE,
      choiceCount: 5,
      gradingPolicy: GradingPolicy.EXACT,
      answerChoice: 2,
      answerText: null,
      imageUrl: 'http://localhost:4000/uploads/questions/question_1.png',
      imageHash: 'legacy_question_1',
      tags: [],
    } as never);
    repository.update.mockResolvedValue({
      id: 'question_1',
      paperId: 'paper_1',
      number: 1,
      type: QuestionType.WRITTEN,
      choiceCount: null,
      gradingPolicy: GradingPolicy.EXACT,
      rawText: null,
      promptText: null,
      passageText: null,
      choiceTexts: [],
      answerChoice: null,
      answerText: '모범답안',
      explanation: null,
      points: 5,
      recommendedTimeSeconds: null,
      recommendedTagIds: [],
      recommendedTagMatches: [],
      imageUrl: 'http://localhost:4000/uploads/questions/question_1.png',
      imageHash: 'legacy_question_1',
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
        gradingPolicy: GradingPolicy.EXACT,
        answerChoice: null,
        answerText: '모범답안',
        explanation: undefined,
        rawText: undefined,
        promptText: undefined,
        passageText: undefined,
        choiceTexts: undefined,
        points: undefined,
        recommendedTimeSeconds: undefined,
        recommendedTagIds: undefined,
      },
      undefined,
    );
  });

  it('문항 이미지 수정 실패 시 새 업로드를 삭제하고 기존 이미지는 유지한다', async () => {
    const updateError = new Error('DB 업데이트 실패');
    repository.findById.mockResolvedValue({
      id: 'question_1',
      paperId: 'paper_1',
      number: 1,
      type: QuestionType.MULTIPLE_CHOICE,
      choiceCount: 5,
      gradingPolicy: GradingPolicy.EXACT,
      answerChoice: 2,
      answerText: null,
      imageUrl:
        'http://localhost:4000/uploads/questions/korean-history-advanced/78/001-old-image.png',
      imageHash: 'legacy_question_1',
      tags: [],
    } as never);
    repository.findPaper.mockResolvedValue(makePaper() as never);
    storageService.uploadQuestionImage.mockResolvedValue({
      objectKey: 'questions/korean-history-advanced/78/001-new-image.png',
      url: 'http://localhost:4000/uploads/questions/korean-history-advanced/78/001-new-image.png',
    });
    repository.update.mockRejectedValue(updateError);

    await expect(service.updateQuestion('question_1', {}, image)).rejects.toBe(
      updateError,
    );

    expect(storageService.deleteObject).toHaveBeenCalledTimes(1);
    expect(storageService.deleteObject).toHaveBeenCalledWith(
      'questions/korean-history-advanced/78/001-new-image.png',
    );
    expect(storageService.deleteObject).not.toHaveBeenCalledWith(
      'questions/korean-history-advanced/78/001-old-image.png',
    );
  });

  it('문항 이미지 수정 성공 후 기존 이미지를 삭제한다', async () => {
    repository.findById.mockResolvedValue({
      id: 'question_1',
      paperId: 'paper_1',
      number: 1,
      type: QuestionType.MULTIPLE_CHOICE,
      choiceCount: 5,
      gradingPolicy: GradingPolicy.EXACT,
      answerChoice: 2,
      answerText: null,
      imageUrl:
        'http://localhost:4000/uploads/questions/korean-history-advanced/78/001-old-image.png',
      imageHash: 'legacy_question_1',
      tags: [],
    } as never);
    repository.findPaper.mockResolvedValue(makePaper() as never);
    storageService.uploadQuestionImage.mockResolvedValue({
      objectKey: 'questions/korean-history-advanced/78/001-new-image.png',
      url: 'http://localhost:4000/uploads/questions/korean-history-advanced/78/001-new-image.png',
    });
    repository.update.mockResolvedValue({
      id: 'question_1',
      paperId: 'paper_1',
      number: 1,
      type: QuestionType.MULTIPLE_CHOICE,
      choiceCount: 5,
      gradingPolicy: GradingPolicy.EXACT,
      rawText: null,
      promptText: null,
      passageText: null,
      choiceTexts: [],
      answerChoice: 2,
      answerText: null,
      explanation: null,
      points: 5,
      recommendedTimeSeconds: null,
      recommendedTagIds: [],
      recommendedTagMatches: [],
      imageUrl:
        'http://localhost:4000/uploads/questions/korean-history-advanced/78/001-new-image.png',
      imageHash:
        '6105d6cc76af400325e94d588ce511be5bfdbb73b437dc51eca43917d7a43e3d',
      tags: [],
      createdAt: new Date('2026-05-31T00:00:00.000Z'),
      updatedAt: new Date('2026-05-31T00:00:00.000Z'),
    });

    await service.updateQuestion('question_1', {}, image);

    expect(storageService.uploadQuestionImage).toHaveBeenCalledWith(
      image,
      expect.objectContaining({
        imageObjectId: expect.any(String),
        questionId: 'question_1',
        questionNumber: 1,
      }),
    );
    expect(storageService.deleteObject).toHaveBeenCalledTimes(1);
    expect(storageService.deleteObject).toHaveBeenCalledWith(
      'questions/korean-history-advanced/78/001-old-image.png',
    );
    expect(repository.update.mock.invocationCallOrder[0]).toBeLessThan(
      storageService.deleteObject.mock.invocationCallOrder[0],
    );
  });

  it('문항과 저장된 이미지를 함께 삭제한다', async () => {
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

function makePaper() {
  return {
    id: 'paper_1',
    questionCount: 20,
    examSession: {
      examId: 'exam_1',
      displayYear: 2026,
      month: null,
      grade: null,
      round: 78,
      exam: {
        id: 'exam_1',
        name: '한국사능력검정시험 심화',
        slug: 'korean-history-advanced',
      },
    },
  };
}
