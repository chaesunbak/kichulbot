import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service';
import { Prisma } from '../../infrastructure/database/prisma-client';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly db: DatabaseService) {}

  findMany() {
    return this.db.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.db.category.findUnique({ where: { id } });
  }

  create(data: Prisma.CategoryCreateInput) {
    return this.db.category.create({ data });
  }

  update(id: string, data: Prisma.CategoryUpdateInput) {
    return this.db.category.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return this.db.category.delete({ where: { id } });
  }
}
