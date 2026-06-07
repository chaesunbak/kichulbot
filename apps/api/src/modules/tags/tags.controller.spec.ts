import {
  UserAuthType,
  UserRole,
} from '../../infrastructure/database/prisma-client';
import type { RequestUser } from '../auth/types';
import { TagGroupsController, TagsController } from './tags.controller';
import type { TagsService } from './tags.service';

const adminUser = {
  id: 'admin_1',
  email: 'admin@example.com',
  nickname: '관리자',
  authType: UserAuthType.EMAIL,
  role: UserRole.ADMIN,
} satisfies RequestUser;

const regularUser = {
  id: 'user_1',
  email: 'user@example.com',
  nickname: '사용자',
  authType: UserAuthType.EMAIL,
  role: UserRole.USER,
} satisfies RequestUser;

describe('TagsController', () => {
  let controller: TagsController;
  let tagsService: jest.Mocked<TagsService>;

  beforeEach(() => {
    tagsService = {
      listAdminTags: jest.fn(),
      listTags: jest.fn(),
      createTag: jest.fn(),
      updateTag: jest.fn(),
      deleteTag: jest.fn(),
    } as unknown as jest.Mocked<TagsService>;

    controller = new TagsController(tagsService);
  });

  it('관리자가 시험 필터 없이 태그를 조회하면 관리자 전체 목록을 요청한다', async () => {
    tagsService.listAdminTags.mockResolvedValue({ tags: [] });

    await controller.listTags(adminUser);

    expect(tagsService.listAdminTags).toHaveBeenCalledWith();
    expect(tagsService.listTags).not.toHaveBeenCalled();
  });

  it('관리자가 시험 필터를 지정하면 일반 목록 조회에 역할과 시험 식별자를 전달한다', async () => {
    tagsService.listTags.mockResolvedValue({ tags: [] });

    await controller.listTags(adminUser, 'exam_1');

    expect(tagsService.listTags).toHaveBeenCalledWith(UserRole.ADMIN, 'exam_1');
    expect(tagsService.listAdminTags).not.toHaveBeenCalled();
  });

  it('일반 사용자는 시험 필터가 없어도 역할 기반 목록 조회를 사용한다', async () => {
    tagsService.listTags.mockResolvedValue({ tags: [] });

    await controller.listTags(regularUser);

    expect(tagsService.listTags).toHaveBeenCalledWith(UserRole.USER, undefined);
    expect(tagsService.listAdminTags).not.toHaveBeenCalled();
  });
});

describe('TagGroupsController', () => {
  let controller: TagGroupsController;
  let tagsService: jest.Mocked<TagsService>;

  beforeEach(() => {
    tagsService = {
      listTagGroups: jest.fn(),
      createTagGroup: jest.fn(),
      updateTagGroup: jest.fn(),
      deleteTagGroup: jest.fn(),
    } as unknown as jest.Mocked<TagsService>;

    controller = new TagGroupsController(tagsService);
  });

  it('태그 그룹 목록 조회 필터를 서비스에 전달한다', async () => {
    tagsService.listTagGroups.mockResolvedValue({ tagGroups: [] });

    await controller.listTagGroups('exam_1');

    expect(tagsService.listTagGroups).toHaveBeenCalledWith('exam_1');
  });
});
