import type {
  Exam,
  ExamSession,
  Paper,
  Question,
  QuestionSet,
} from '../../infrastructure/database/prisma-client';
import { QuestionSetKind } from '../../infrastructure/database/prisma-client';
import type { SolveSessionsService } from '../solve-sessions/solve-sessions.service';
import type { BookmarksRepository } from './bookmarks.repository';
import { BookmarksService } from './bookmarks.service';

const now = new Date('2026-05-31T00:00:00.000Z');
const exam = {
  id: 'exam_1',
  name: '수능',
  slug: 'korean-history',
  usesMonth: false,
  usesGrade: false,
  usesRound: false,
  mockExamQuestionCount: null,
  eraTagGroupId: null,
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
  imageUrl: 'http://localhost:4000/uploads/questions/question_1.png',
  imageHash: 'legacy_question_1',
  choiceCount: 5,
  gradingPolicy: 'EXACT',
  rawText: null,
  promptText: null,
  passageText: null,
  choiceTexts: [],
  answerChoice: 3,
  answerText: null,
  explanation: null,
  points: 5,
  recommendedTimeSeconds: null,
  recommendedTagIds: [],
  recommendedTagMatches: [],
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
    imageHash: question.imageHash,
    choiceCount: question.choiceCount,
    gradingPolicy: question.gradingPolicy,
    rawText: question.rawText,
    promptText: question.promptText,
    passageText: question.passageText,
    choiceTexts: question.choiceTexts,
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
  let solveSessionsService: jest.Mocked<SolveSessionsService>;

  beforeEach(() => {
    repository = {
      findBookmarkLists: jest.fn(),
      findBookmarkList: jest.fn(),
      createBookmarkList: jest.fn(),
      updateBookmarkList: jest.fn(),
      deleteBookmarkList: jest.fn(),
      findQuestion: jest.fn(),
      addQuestion: jest.fn(),
      findBookmarkedQuestion: jest.fn(),
      deleteQuestion: jest.fn(),
    } as unknown as jest.Mocked<BookmarksRepository>;
    solveSessionsService = {
      startQuestionSet: jest.fn(),
    } as unknown as jest.Mocked<SolveSessionsService>;
    service = new BookmarksService(repository, solveSessionsService);
  });

  it('이름을 변경하기 전에 북마크 목록 소유권을 확인하고 이름을 정리한다', async () => {
    repository.findBookmarkList.mockResolvedValue(bookmarkList);
    repository.updateBookmarkList.mockResolvedValue({
      ...bookmarkList,
      title: '오답 모음',
      _count: { items: 0 },
    });

    const response = await service.updateBookmarkList(
      'user_1',
      bookmarkList.id,
      '  오답 모음  ',
    );

    expect(repository.findBookmarkList).toHaveBeenCalledWith(
      'user_1',
      bookmarkList.id,
    );
    expect(repository.updateBookmarkList).toHaveBeenCalledWith(
      bookmarkList.id,
      '오답 모음',
    );
    expect(response.bookmarkList.name).toBe('오답 모음');
  });

  it('없는 북마크 목록 이름은 변경하지 않는다', async () => {
    repository.findBookmarkList.mockResolvedValue(null);

    await expect(
      service.updateBookmarkList('user_1', bookmarkList.id, '오답 모음'),
    ).rejects.toThrow('북마크 리스트를 찾을 수 없습니다.');
    expect(repository.updateBookmarkList).not.toHaveBeenCalled();
  });

  it('북마크 목록을 삭제하기 전에 소유권을 확인한다', async () => {
    repository.findBookmarkList.mockResolvedValue(bookmarkList);
    repository.deleteBookmarkList.mockResolvedValue(bookmarkList);

    await expect(
      service.deleteBookmarkList('user_1', bookmarkList.id),
    ).resolves.toEqual({ id: bookmarkList.id });
    expect(repository.findBookmarkList).toHaveBeenCalledWith(
      'user_1',
      bookmarkList.id,
    );
    expect(repository.deleteBookmarkList).toHaveBeenCalledWith(bookmarkList.id);
  });

  it('없는 북마크 목록은 삭제하지 않는다', async () => {
    repository.findBookmarkList.mockResolvedValue(null);

    await expect(
      service.deleteBookmarkList('user_1', bookmarkList.id),
    ).rejects.toThrow('북마크 리스트를 찾을 수 없습니다.');
    expect(repository.deleteBookmarkList).not.toHaveBeenCalled();
  });

  it('같은 문항을 다시 추가해도 멱등적으로 저장 동작을 수행한다', async () => {
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

  it('문항을 삭제하기 전에 북마크 목록 소유권을 확인한다', async () => {
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

  it('비어 있는 북마크 목록으로는 풀이를 시작하지 않는다', async () => {
    repository.findBookmarkList.mockResolvedValue(bookmarkList);

    await expect(
      service.startSolveSession('user_1', bookmarkList.id, 'ONE_BY_ONE'),
    ).rejects.toThrow('풀 문제가 없습니다.');
    expect(solveSessionsService.startQuestionSet).not.toHaveBeenCalled();
  });
});
