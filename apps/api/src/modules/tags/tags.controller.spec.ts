import { PATH_METADATA } from '@nestjs/common/constants';

import { UserRole } from '../../infrastructure/database/prisma-client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { TagGroupsController, TagsController } from './tags.controller';
import type { TagsService } from './tags.service';

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

  it('관리자 태그 경로와 역할 정책을 선언한다', () => {
    expect(Reflect.getMetadata(PATH_METADATA, TagsController)).toBe(
      'admin/tags',
    );
    expect(Reflect.getMetadata(ROLES_KEY, TagsController)).toEqual([
      UserRole.ADMIN,
    ]);
  });

  it('시험 필터 없이 태그를 조회하면 관리자 전체 목록을 요청한다', async () => {
    tagsService.listAdminTags.mockResolvedValue({ tags: [] });

    await controller.listTags();

    expect(tagsService.listAdminTags).toHaveBeenCalledWith();
    expect(tagsService.listTags).not.toHaveBeenCalled();
  });

  it('시험 필터를 지정하면 관리자 역할과 시험 식별자로 목록을 요청한다', async () => {
    tagsService.listTags.mockResolvedValue({ tags: [] });

    await controller.listTags('exam_1');

    expect(tagsService.listTags).toHaveBeenCalledWith(UserRole.ADMIN, 'exam_1');
    expect(tagsService.listAdminTags).not.toHaveBeenCalled();
  });

  it('태그 생성을 서비스에 위임한다', async () => {
    const dto = { name: '고대', examId: 'exam_1' };
    tagsService.createTag.mockResolvedValue({ tag: { id: 'tag_1' } } as never);

    await controller.createTag(dto);

    expect(tagsService.createTag).toHaveBeenCalledWith(dto);
  });

  it('태그 수정을 서비스에 위임한다', async () => {
    const dto = { name: '중세' };
    tagsService.updateTag.mockResolvedValue({ tag: { id: 'tag_1' } } as never);

    await controller.updateTag('tag_1', dto);

    expect(tagsService.updateTag).toHaveBeenCalledWith('tag_1', dto);
  });

  it('태그 삭제를 서비스에 위임한다', async () => {
    tagsService.deleteTag.mockResolvedValue({ id: 'tag_1' });

    await controller.deleteTag('tag_1');

    expect(tagsService.deleteTag).toHaveBeenCalledWith('tag_1');
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

  it('관리자 태그 그룹 경로와 역할 정책을 선언한다', () => {
    expect(Reflect.getMetadata(PATH_METADATA, TagGroupsController)).toBe(
      'admin/tag-groups',
    );
    expect(Reflect.getMetadata(ROLES_KEY, TagGroupsController)).toEqual([
      UserRole.ADMIN,
    ]);
  });

  it('태그 그룹 목록 조회 필터를 서비스에 전달한다', async () => {
    tagsService.listTagGroups.mockResolvedValue({ tagGroups: [] });

    await controller.listTagGroups('exam_1');

    expect(tagsService.listTagGroups).toHaveBeenCalledWith('exam_1');
  });

  it('태그 그룹 생성을 서비스에 위임한다', async () => {
    const dto = { name: '시대', examId: 'exam_1', selectionMode: 'MULTIPLE' };
    tagsService.createTagGroup.mockResolvedValue({
      tagGroup: { id: 'tag_group_1' },
    } as never);

    await controller.createTagGroup(dto as never);

    expect(tagsService.createTagGroup).toHaveBeenCalledWith(dto);
  });

  it('태그 그룹 수정을 서비스에 위임한다', async () => {
    const dto = { name: '시대 구분' };
    tagsService.updateTagGroup.mockResolvedValue({
      tagGroup: { id: 'tag_group_1' },
    } as never);

    await controller.updateTagGroup('tag_group_1', dto);

    expect(tagsService.updateTagGroup).toHaveBeenCalledWith('tag_group_1', dto);
  });

  it('태그 그룹 삭제를 서비스에 위임한다', async () => {
    tagsService.deleteTagGroup.mockResolvedValue({ id: 'tag_group_1' });

    await controller.deleteTagGroup('tag_group_1');

    expect(tagsService.deleteTagGroup).toHaveBeenCalledWith('tag_group_1');
  });
});
