import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class TagsRepository {
  constructor(private readonly db: DatabaseService) {}

  findMany() {
    return this.db.tag.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }
}
