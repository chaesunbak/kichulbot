import { describe, expect, it } from 'vitest';

import type {
  ImportPaperQuestionValues,
  ImportPaperValues,
  PaperValues,
} from '../types';
import {
  toCreatePaperInput,
  toCreatePaperQuestionImages,
  toCreatePaperWithQuestionsInput,
} from './mappers';

describe('toCreatePaperInput', () => {
  it('시험 설정에서 사용하는 시행 정보를 유지하고 공개 여부를 boolean으로 변환한다', () => {
    expect(
      toCreatePaperInput(
        {
          title: '2026학년도 6월 모의고사',
          year: 2026,
          month: 6,
          grade: 3,
          round: 2,
          examId: 'exam-1',
          questionCount: 20,
          isPublished: 'true',
        } satisfies PaperValues,
        { usesMonth: true, usesGrade: true, usesRound: true },
      ),
    ).toEqual({
      title: '2026학년도 6월 모의고사',
      year: 2026,
      month: 6,
      grade: 3,
      round: 2,
      examId: 'exam-1',
      questionCount: 20,
      isPublished: true,
    });
  });

  it('시험 설정에서 사용하지 않는 시행 정보는 undefined로 제거한다', () => {
    expect(
      toCreatePaperInput(
        {
          title: '한국사능력검정시험',
          year: 2026,
          month: 6,
          grade: 3,
          round: 72,
          examId: 'exam-1',
          questionCount: 50,
          isPublished: 'false',
        } satisfies PaperValues,
        { usesMonth: false, usesGrade: false, usesRound: true },
      ),
    ).toMatchObject({
      month: undefined,
      grade: undefined,
      round: 72,
      isPublished: false,
    });
  });
});

describe('toCreatePaperWithQuestionsInput', () => {
  it('제외한 문항을 빼고 문제지와 문항 생성 요청으로 변환한다', () => {
    const values = {
      title: '2026학년도 6월 모의고사',
      year: 2026,
      month: 6,
      grade: 3,
      round: null,
      examId: 'exam-1',
      questionCount: 2,
      isPublished: true,
      layout: 'korean-history',
      variant: 'odd',
      questionPdf: new File(['question'], 'question.pdf'),
      answerPdf: new File(['answer'], 'answer.pdf'),
    } satisfies ImportPaperValues;

    expect(
      toCreatePaperWithQuestionsInput(
        values,
        { usesMonth: true, usesGrade: false, usesRound: false },
        [
          createImportQuestion({
            number: 1,
            image: {
              filename: 'question-1.webp',
              mimeType: 'image/webp',
              base64: 'MQ==',
            },
          }),
          createImportQuestion({
            number: 2,
            excluded: true,
            image: {
              filename: 'question-2.webp',
              mimeType: 'image/webp',
              base64: 'Mg==',
            },
          }),
        ],
      ),
    ).toEqual({
      paper: {
        title: '2026학년도 6월 모의고사',
        year: 2026,
        month: 6,
        grade: undefined,
        round: undefined,
        examId: 'exam-1',
        questionCount: 2,
        isPublished: true,
      },
      questions: [
        expect.objectContaining({
          number: 1,
          imageFileName: 'question-1.webp',
        }),
      ],
    });
  });
});

describe('toCreatePaperQuestionImages', () => {
  it('포함 문항의 base64 이미지만 File로 변환한다', async () => {
    const files = toCreatePaperQuestionImages([
      createImportQuestion({
        number: 1,
        image: {
          filename: 'question-1.webp',
          mimeType: 'image/webp',
          base64: 'aW1hZ2UtMQ==',
        },
      }),
      createImportQuestion({
        number: 2,
        excluded: true,
        image: {
          filename: 'question-2.webp',
          mimeType: 'image/webp',
          base64: 'aW1hZ2UtMg==',
        },
      }),
    ]);

    expect(files).toHaveLength(1);
    expect(files[0]).toBeInstanceOf(File);
    expect(files[0].name).toBe('question-1.webp');
    expect(files[0].type).toBe('image/webp');
    await expect(files[0].text()).resolves.toBe('image-1');
  });
});

function createImportQuestion(
  overrides: Partial<ImportPaperQuestionValues> = {},
): ImportPaperQuestionValues {
  return {
    number: 1,
    type: 'MULTIPLE_CHOICE',
    choiceCount: 5,
    gradingPolicy: 'EXACT',
    answerChoice: 1,
    answerText: null,
    explanation: null,
    rawText: '원문',
    promptText: '발문',
    passageText: null,
    choiceTexts: ['선지 1', '선지 2'],
    points: 2,
    recommendedTimeSeconds: null,
    recommendedTagIds: ['tag-1'],
    recommendedTagMatches: [{ tagId: 'tag-1', keywords: ['키워드'] }],
    tagIds: ['tag-1'],
    image: {
      filename: 'question-1.webp',
      mimeType: 'image/webp',
      base64: 'MQ==',
    },
    excluded: false,
    ...overrides,
  };
}
