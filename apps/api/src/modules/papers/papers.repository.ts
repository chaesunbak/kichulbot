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

  findMany(where: Prisma.PaperWhereInput, userId?: string) {
    return this.db.paper.findMany({
      where,
      include: this.paperIncludes(userId),
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findById(id: string, where: Prisma.PaperWhereInput = {}, userId?: string) {
    return this.db.paper.findFirst({
      where: {
        ...where,
        id,
      },
      include: {
        ...this.paperIncludes(userId),
        questions: {
          orderBy: { number: 'asc' },
          include: {
            tags: { include: { tag: true } },
          },
        },
      },
    });
  }

  update(id: string, data: Prisma.PaperUncheckedUpdateInput) {
    return this.db.paper.update({
      where: { id },
      data,
      include: this.paperIncludes(),
    });
  }

  delete(id: string) {
    return this.db.paper.delete({ where: { id } });
  }

  private paperIncludes(userId?: string) {
    return {
      exam: true,
      subject: true,
      questions: true,
      users: userId
        ? {
            where: { bookshelf: { userId } },
            select: { bookshelfId: true },
          }
        : false,
    } satisfies Prisma.PaperInclude;
  }
}
