import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class ServiceAccountsRepository {
  constructor(private readonly db: DatabaseService) {}

  findByTokenHash(tokenHash: string) {
    return this.db.serviceAccount.findUnique({
      where: { tokenHash },
    });
  }

  markUsed(id: string) {
    return this.db.serviceAccount.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }
}
