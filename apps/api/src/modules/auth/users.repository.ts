import { Injectable } from '@nestjs/common';
import { Prisma, UserAuthType, UserRole } from '@prisma/client';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  createAnonymousUser() {
    return this.db.user.create({
      data: {
        authType: UserAuthType.ANONYMOUS,
        role: UserRole.USER,
        bookshelves: { create: { name: '기본 책장' } },
        bookmarkLists: { create: { name: '기본 북마크' } },
      },
    });
  }

  createEmailUser(data: {
    email: string;
    passwordHash: string;
    nickname?: string;
  }) {
    return this.db.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        nickname: data.nickname,
        authType: UserAuthType.EMAIL,
        role: UserRole.USER,
        bookshelves: { create: { name: '기본 책장' } },
        bookmarkLists: { create: { name: '기본 북마크' } },
      },
    });
  }

  findByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  findById(id: string) {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  convertAnonymousUser(
    userId: string,
    data: {
      email: string;
      passwordHash: string;
      nickname?: string;
    },
  ) {
    return this.db.user.update({
      where: { id: userId },
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        nickname: data.nickname,
        authType: UserAuthType.EMAIL,
      },
    });
  }

  isUniqueConstraintError(error: unknown, target?: string) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return false;
    }

    if (error.code !== 'P2002') {
      return false;
    }

    if (!target) {
      return true;
    }

    return Array.isArray(error.meta?.target)
      ? error.meta.target.includes(target)
      : error.meta?.target === target;
  }
}
