import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class PapersRepository {
  constructor(private readonly db: DatabaseService) {}

  create(data: Prisma.PaperUncheckedCreateInput) {
    return this.db.paper.create({
      data,
      include: this.paperIncludes(),
    });
  }

  findMany(where: Prisma.PaperWhereInput) {
    return this.db.paper.findMany({
      where,
      include: this.paperIncludes(),
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findById(id: string, where: Prisma.PaperWhereInput = {}) {
    return this.db.paper.findFirst({
      where: {
        ...where,
        id,
      },
      include: {
        ...this.paperIncludes(),
        questions: {
          orderBy: { number: 'asc' },
        },
      },
    });
  }

  private paperIncludes() {
    return {
      exam: true,
      subject: true,
      questions: true,
    } satisfies Prisma.PaperInclude;
  }
}
