import { createHash } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';

import { ServiceAccountsRepository } from './service-accounts.repository';

export type RequestServiceAccount = {
  id: string;
  name: string;
};

@Injectable()
export class ServiceAccountsService {
  constructor(
    private readonly serviceAccountsRepository: ServiceAccountsRepository,
  ) {}

  async authenticate(token: string) {
    const account = await this.serviceAccountsRepository.findByTokenHash(
      this.hashToken(token),
    );
    const now = new Date();
    if (
      !account ||
      !account.isActive ||
      (account.expiresAt && account.expiresAt <= now)
    ) {
      throw new UnauthorizedException(
        '서비스 계정 인증 정보가 유효하지 않습니다.',
      );
    }

    await this.serviceAccountsRepository.markUsed(account.id);

    return {
      id: account.id,
      name: account.name,
    } satisfies RequestServiceAccount;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
