import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class ExamsRepository {
  constructor(private readonly db: DatabaseService) {}

  findMany() {
    return this.db.exam.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.db.exam.findUnique({
      where: { id },
    });
  }
}
