import { BookmarkList, Exam, Paper, Question, Subject } from '@prisma/client';
import { BookmarksRepository } from './bookmarks.repository';
import { BookmarksService } from './bookmarks.service';

const now = new Date('2026-05-31T00:00:00.000Z');
const bookmarkList = {
  id: 'bookmark_list_1',
  userId: 'user_1',
  name: '기본 북마크',
  createdAt: now,
  updatedAt: now,
  questions: [],
} satisfies BookmarkList & { questions: [] };
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
  recommendedTimeSeconds: null,
  createdAt: now,
  updatedAt: now,
} satisfies Question;
const paper = {
  id: 'paper_1',
  title: '2025학년도 수능 한국사',
  year: 2025,
  questionCount: 20,
  isPublished: true,
  examId: 'exam_1',
  subjectId: 'subject_1',
  createdAt: now,
  updatedAt: now,
  exam: { id: 'exam_1', name: '수능', slug: 'suneung' } as Exam,
  subject: {
    id: 'subject_1',
    name: '한국사',
    slug: 'korean-history',
  } as Subject,
} satisfies Paper & { exam: Exam; subject: Subject };

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
    repository.addQuestion.mockResolvedValue({
      bookmarkListId: bookmarkList.id,
      questionId: question.id,
      createdAt: now,
      question: { ...question, paper },
    });

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
      bookmarkListId: bookmarkList.id,
      questionId: question.id,
      createdAt: now,
    });
    repository.deleteQuestion.mockResolvedValue({
      bookmarkListId: bookmarkList.id,
      questionId: question.id,
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
