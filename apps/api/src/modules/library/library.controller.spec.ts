import {
  UserAuthType,
  UserRole,
} from '../../infrastructure/database/prisma-client';

import type { RequestUser } from '../auth/types';
import { LibraryController } from './library.controller';
import type { LibraryService } from './library.service';

const user = {
  id: 'user_1',
  email: 'student@example.com',
  nickname: '학생',
  authType: UserAuthType.EMAIL,
  role: UserRole.USER,
} satisfies RequestUser;

describe('LibraryController', () => {
  let controller: LibraryController;
  let libraryService: jest.Mocked<LibraryService>;

  beforeEach(() => {
    libraryService = {
      addPaper: jest.fn(),
      movePaper: jest.fn(),
    } as unknown as jest.Mocked<LibraryService>;

    controller = new LibraryController(libraryService);
  });

  it('서재에 시험지를 추가할 때 폴더가 없으면 null을 전달한다', async () => {
    libraryService.addPaper.mockResolvedValue({
      libraryPaper: { id: 'library_paper_1' },
    } as never);

    await controller.addPaper(user, 'paper_1', {});

    expect(libraryService.addPaper).toHaveBeenCalledWith(
      'user_1',
      'paper_1',
      null,
    );
  });

  it('서재에 시험지를 추가할 때 폴더가 있으면 해당 식별자를 전달한다', async () => {
    libraryService.addPaper.mockResolvedValue({
      libraryPaper: { id: 'library_paper_1' },
    } as never);

    await controller.addPaper(user, 'paper_1', { folderId: 'folder_1' });

    expect(libraryService.addPaper).toHaveBeenCalledWith(
      'user_1',
      'paper_1',
      'folder_1',
    );
  });

  it('저장된 시험지를 이동할 때 폴더가 없으면 루트 이동을 위해 null을 전달한다', async () => {
    libraryService.movePaper.mockResolvedValue({
      libraryPaper: { id: 'library_paper_1' },
    } as never);

    await controller.movePaper(user, 'library_paper_1', { folderId: null });

    expect(libraryService.movePaper).toHaveBeenCalledWith(
      'user_1',
      'library_paper_1',
      null,
    );
  });

  it('저장된 시험지를 이동할 때 폴더가 있으면 해당 식별자를 전달한다', async () => {
    libraryService.movePaper.mockResolvedValue({
      libraryPaper: { id: 'library_paper_1' },
    } as never);

    await controller.movePaper(user, 'library_paper_1', {
      folderId: 'folder_1',
    });

    expect(libraryService.movePaper).toHaveBeenCalledWith(
      'user_1',
      'library_paper_1',
      'folder_1',
    );
  });
});
