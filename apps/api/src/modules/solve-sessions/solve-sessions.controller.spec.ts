import {
  AnswerMode,
  UserAuthType,
  UserRole,
} from '../../infrastructure/database/prisma-client';
import type { RequestUser } from '../auth/types';
import {
  PublicSolveSessionsController,
  SolveSessionsController,
} from './solve-sessions.controller';
import type { SolveSessionsService } from './solve-sessions.service';

const user = {
  id: 'user_1',
  email: 'user@example.com',
  nickname: '사용자',
  authType: UserAuthType.EMAIL,
  role: UserRole.USER,
} satisfies RequestUser;

describe('SolveSessionsController', () => {
  let controller: SolveSessionsController;
  let solveSessionsService: jest.Mocked<SolveSessionsService>;

  beforeEach(() => {
    solveSessionsService = {
      listLogs: jest.fn(),
      start: jest.fn(),
      get: jest.fn(),
      saveAnswer: jest.fn(),
      submit: jest.fn(),
    } as unknown as jest.Mocked<SolveSessionsService>;

    controller = new SolveSessionsController(solveSessionsService);
  });

  it('내 풀이 로그 조회에서 사용자 식별자와 쿼리를 서비스에 전달한다', async () => {
    const query = {
      page: 2,
      limit: 10,
      status: 'completed',
      submittedDate: '2026-06-07',
    } as const;
    solveSessionsService.listLogs.mockResolvedValue({
      logs: [],
      pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
    } as never);

    await controller.listLogs(user, query);

    expect(solveSessionsService.listLogs).toHaveBeenCalledWith('user_1', query);
  });

  it('풀이 시작에서 사용자 식별자와 문제지, 풀이 방식을 서비스에 전달한다', async () => {
    solveSessionsService.start.mockResolvedValue({
      session: { id: 's1' },
    } as never);

    await controller.start(user, {
      paperId: 'paper_1',
      mode: AnswerMode.ONE_BY_ONE,
    });

    expect(solveSessionsService.start).toHaveBeenCalledWith(
      'user_1',
      'paper_1',
      AnswerMode.ONE_BY_ONE,
    );
  });
});

describe('PublicSolveSessionsController', () => {
  let controller: PublicSolveSessionsController;
  let solveSessionsService: jest.Mocked<SolveSessionsService>;

  beforeEach(() => {
    solveSessionsService = {
      getPublicPaperSession: jest.fn(),
    } as unknown as jest.Mocked<SolveSessionsService>;

    controller = new PublicSolveSessionsController(solveSessionsService);
  });

  it('공개 풀이 조회에서 mode가 없으면 시험 모드로 조회한다', async () => {
    solveSessionsService.getPublicPaperSession.mockResolvedValue({
      session: { id: 'public_paper_1' },
    } as never);

    await controller.getPaperSession('paper_1');

    expect(solveSessionsService.getPublicPaperSession).toHaveBeenCalledWith(
      'paper_1',
      AnswerMode.EXAM,
    );
  });

  it('공개 풀이 조회에서 mode를 서비스에 전달한다', async () => {
    solveSessionsService.getPublicPaperSession.mockResolvedValue({
      session: { id: 'public_paper_1' },
    } as never);

    await controller.getPaperSession('paper_1', AnswerMode.ONE_BY_ONE);

    expect(solveSessionsService.getPublicPaperSession).toHaveBeenCalledWith(
      'paper_1',
      AnswerMode.ONE_BY_ONE,
    );
  });
});
