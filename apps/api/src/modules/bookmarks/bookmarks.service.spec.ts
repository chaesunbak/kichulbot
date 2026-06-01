import {
  Exam,
  ExamSession,
  Paper,
  Question,
  QuestionSet,
  QuestionSetKind,
} from '@prisma/client';

import { BookmarksRepository } from './bookmarks.repository';
import { BookmarksService } from './bookmarks.service';

const now = new Date('2026-05-31T00:00:00.000Z');
const exam = {
  id: 'exam_1',
  name: '수능',
  usesMonth: false,
  usesGrade: false,
  usesRound: false,
  createdAt: now,
  updatedAt: now,
} satisfies Exam;
const examSession = {
  id: 'exam_session_1',
  key: 'exam_1:2025:-:-:-',
  examId: exam.id,
  displayYear: 2025,
  month: null,
  grade: null,
  round: null,
  createdAt: now,
  updatedAt: now,
  exam,
} satisfies ExamSession & { exam: Exam };
const bookmarkList = {
  id: 'bookmark_list_1',
  kind: QuestionSetKind.CUSTOM,
  ownerUserId: 'user_1',
  title: '기본 북마크',
  createdAt: now,
  updatedAt: now,
  items: [],
} satisfies QuestionSet & { items: [] };
const question = {
  id: 'question_1',
  paperId: 'paper_1',
  number: 1,
  type: 'MULTIPLE_CHOICE',
  imageUrl: null,
  choiceCount: 5,
  answerChoice: 3,
  answerText: null,
  explanation: null,
  points: 5,
  recommendedTimeSeconds: null,
  createdAt: now,
  updatedAt: now,
} satisfies Question;
const paper = {
  id: 'paper_1',
  title: '2025학년도 수능 한국사',
  questionCount: 20,
  isPublished: true,
  examSessionId: examSession.id,
  questionSetId: 'question_set_1',
  createdAt: now,
  updatedAt: now,
  examSession,
} satisfies Paper & {
  examSession: ExamSession & { exam: Exam };
};
const questionSetItem = {
  questionSetId: bookmarkList.id,
  questionRevisionId: 'question_revision_1',
  position: 1,
  sourceAttemptId: null,
  reason: null,
  createdAt: now,
  questionRevision: {
    id: 'question_revision_1',
    questionId: question.id,
    revision: 1,
    type: question.type,
    imageUrl: question.imageUrl,
    choiceCount: question.choiceCount,
    answerChoice: question.answerChoice,
    answerText: question.answerText,
    explanation: question.explanation,
    points: question.points,
    recommendedTimeSeconds: question.recommendedTimeSeconds,
    createdAt: now,
    question: { ...question, paper },
  },
};

describe('BookmarksService', () => {
  let service: BookmarksService;
  let repository: jest.Mocked<BookmarksRepository>;

  beforeEach(() => {
    repository = {
      findBookmarkLists: jest.fn(),
      findBookmarkList: jest.fn(),
      createBookmarkList: jest.fn(),
      findQuestion: jest.fn(),
      addQuestion: jest.fn(),
      findBookmarkedQuestion: jest.fn(),
      deleteQuestion: jest.fn(),
    } as unknown as jest.Mocked<BookmarksRepository>;
    service = new BookmarksService(repository);
  });

  it('uses an idempotent repository operation when the same question is added again', async () => {
    repository.findBookmarkList.mockResolvedValue(bookmarkList);
    repository.findQuestion.mockResolvedValue(question);
    repository.addQuestion.mockResolvedValue(questionSetItem);

    await service.addQuestion('user_1', bookmarkList.id, question.id);
    await service.addQuestion('user_1', bookmarkList.id, question.id);

    expect(repository.addQuestion).toHaveBeenNthCalledWith(
      1,
      bookmarkList.id,
      question.id,
    );
    expect(repository.addQuestion).toHaveBeenNthCalledWith(
      2,
      bookmarkList.id,
      question.id,
    );
  });

  it('checks list ownership before removing a question', async () => {
    repository.findBookmarkList.mockResolvedValue(bookmarkList);
    repository.findBookmarkedQuestion.mockResolvedValue({
      questionSetId: bookmarkList.id,
      questionRevisionId: questionSetItem.questionRevisionId,
      position: 1,
      sourceAttemptId: null,
      reason: null,
      createdAt: now,
    });
    repository.deleteQuestion.mockResolvedValue({
      questionSetId: bookmarkList.id,
      questionRevisionId: questionSetItem.questionRevisionId,
      position: 1,
      sourceAttemptId: null,
      reason: null,
      createdAt: now,
    });

    await service.deleteQuestion('user_1', bookmarkList.id, question.id);

    expect(repository.findBookmarkList).toHaveBeenCalledWith(
      'user_1',
      bookmarkList.id,
    );
    expect(repository.deleteQuestion).toHaveBeenCalledWith(
      bookmarkList.id,
      question.id,
    );
  });
});
