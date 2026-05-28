import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class SubjectsRepository {
  constructor(private readonly db: DatabaseService) {}

  findMany() {
    return this.db.subject.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.db.subject.findUnique({
      where: { id },
    });
  }
}
