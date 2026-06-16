import { createHash } from 'node:crypto';

import { UnauthorizedException } from '@nestjs/common';

import type { ServiceAccountsRepository } from './service-accounts.repository';
import { ServiceAccountsService } from './service-accounts.service';

const now = new Date('2026-06-15T00:00:00.000Z');

describe('ServiceAccountsService', () => {
  let service: ServiceAccountsService;
  let repository: jest.Mocked<ServiceAccountsRepository>;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    repository = {
      findByTokenHash: jest.fn(),
      markUsed: jest.fn(),
    } as unknown as jest.Mocked<ServiceAccountsRepository>;
    service = new ServiceAccountsService(repository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('토큰 해시를 확인하고 서비스 계정을 반환한다', async () => {
    repository.findByTokenHash.mockResolvedValue(makeServiceAccount());
    repository.markUsed.mockResolvedValue(makeServiceAccount());

    const account = await service.authenticate('plain-token');

    expect(repository.findByTokenHash).toHaveBeenCalledWith(
      createHash('sha256').update('plain-token').digest('hex'),
    );
    expect(repository.markUsed).toHaveBeenCalledWith('service_account_1');
    expect(account).toEqual({
      id: 'service_account_1',
      name: 'extractor',
    });
  });

  it('비활성 서비스 계정은 거부한다', async () => {
    repository.findByTokenHash.mockResolvedValue(
      makeServiceAccount({ isActive: false }),
    );

    await expect(service.authenticate('plain-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(repository.markUsed).not.toHaveBeenCalled();
  });

  it('만료된 서비스 계정은 거부한다', async () => {
    repository.findByTokenHash.mockResolvedValue(
      makeServiceAccount({ expiresAt: new Date('2026-06-14T00:00:00.000Z') }),
    );

    await expect(service.authenticate('plain-token')).rejects.toThrow(
      '서비스 계정 인증 정보가 유효하지 않습니다.',
    );
  });
});

function makeServiceAccount(overrides = {}) {
  return {
    id: 'service_account_1',
    name: 'extractor',
    tokenHash: 'hashed-token',
    isActive: true,
    expiresAt: null,
    lastUsedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
