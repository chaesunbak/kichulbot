import {
  UserAuthType,
  UserRole,
} from '../../infrastructure/database/prisma-client';
import type { UploadedMemoryFile } from '../../infrastructure/storage/storage.service';
import type { RequestUser } from '../auth/types';
import { PapersController } from './papers.controller';
import type { PapersService } from './papers.service';

const adminUser = {
  id: 'admin_1',
  email: 'admin@example.com',
  nickname: '관리자',
  authType: UserAuthType.EMAIL,
  role: UserRole.ADMIN,
} satisfies RequestUser;

const createPaperBody = {
  title: '2025학년도 수능 한국사',
  year: 2025,
  examId: 'exam_1',
};

const imageFile = {
  originalname: 'question-1.png',
  mimetype: 'image/png',
  size: 1024,
  buffer: Buffer.from('image'),
} satisfies UploadedMemoryFile;

describe('PapersController', () => {
  let controller: PapersController;
  let papersService: jest.Mocked<PapersService>;

  beforeEach(() => {
    papersService = {
      createPaper: jest.fn(),
      createPaperWithQuestions: jest.fn(),
    } as unknown as jest.Mocked<PapersService>;

    controller = new PapersController(papersService);
  });

  it('payload가 있으면 이미지와 관리자 권한을 포함해 문제 포함 시험지 생성에 위임한다', async () => {
    papersService.createPaperWithQuestions.mockResolvedValue({
      paper: { id: 'paper_1' },
    } as never);

    await controller.createPaper(
      adminUser,
      { ...createPaperBody, payload: '{"questions":[]}' },
      [imageFile],
    );

    expect(papersService.createPaperWithQuestions).toHaveBeenCalledWith(
      '{"questions":[]}',
      [imageFile],
      UserRole.ADMIN,
    );
    expect(papersService.createPaper).not.toHaveBeenCalled();
  });

  it('payload가 없으면 일반 시험지 생성에 body와 관리자 권한을 전달한다', async () => {
    papersService.createPaper.mockResolvedValue({
      paper: { id: 'paper_1' },
    } as never);

    await controller.createPaper(adminUser, createPaperBody, [imageFile]);

    expect(papersService.createPaper).toHaveBeenCalledWith(
      createPaperBody,
      UserRole.ADMIN,
    );
    expect(papersService.createPaperWithQuestions).not.toHaveBeenCalled();
  });
});
