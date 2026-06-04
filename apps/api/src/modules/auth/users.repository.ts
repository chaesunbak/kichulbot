import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service';
import {
  OAuthProvider,
  Prisma,
  QuestionSetKind,
  UserAuthType,
  UserRole,
} from '../../infrastructure/database/prisma-client';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  createOAuthUser(data: {
    provider: OAuthProvider;
    providerAccountId: string;
    providerEmail?: string | null;
    nickname: string;
    providerNickname?: string | null;
    rawProfile?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  }) {
    return this.db.user.create({
      data: {
        email: data.providerEmail,
        nickname: data.nickname,
        authType: UserAuthType.OAUTH,
        role: UserRole.USER,
        questionSets: {
          create: { kind: QuestionSetKind.CUSTOM, title: '기본 북마크' },
        },
        oauthAccounts: {
          create: {
            provider: data.provider,
            providerAccountId: data.providerAccountId,
            providerEmail: data.providerEmail,
            providerNickname: data.providerNickname,
            rawProfile: data.rawProfile,
            lastLoginAt: new Date(),
          },
        },
      },
      include: { oauthAccounts: true },
    });
  }

  createEmailUser(data: {
    email: string;
    passwordHash: string;
    nickname?: string | null;
  }) {
    return this.db.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        nickname: data.nickname,
        authType: UserAuthType.EMAIL,
        role: UserRole.USER,
        questionSets: {
          create: { kind: QuestionSetKind.CUSTOM, title: '기본 북마크' },
        },
      },
      include: { oauthAccounts: true },
    });
  }

  findByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
      include: { oauthAccounts: true },
    });
  }

  findById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      include: { oauthAccounts: true },
    });
  }

  findByOAuthAccount(provider: OAuthProvider, providerAccountId: string) {
    return this.db.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: {
        user: {
          include: { oauthAccounts: true },
        },
      },
    });
  }

  listAuthConnections(userId: string) {
    return this.db.oAuthAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  deleteById(id: string) {
    return this.db.user.delete({
      where: { id },
      select: { id: true },
    });
  }

  updateProfile(
    userId: string,
    data: {
      nickname: string;
    },
  ) {
    return this.db.user.update({
      where: { id: userId },
      data: {
        nickname: data.nickname,
      },
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.db.user.update({
      where: { id: userId },
      data: { passwordHash },
      include: { oauthAccounts: true },
    });
  }

  upsertOAuthAccount(data: {
    userId: string;
    provider: OAuthProvider;
    providerAccountId: string;
    providerEmail?: string | null;
    providerNickname?: string | null;
    rawProfile?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  }) {
    return this.db.oAuthAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: data.provider,
          providerAccountId: data.providerAccountId,
        },
      },
      create: {
        userId: data.userId,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        providerEmail: data.providerEmail,
        providerNickname: data.providerNickname,
        rawProfile: data.rawProfile,
        lastLoginAt: new Date(),
      },
      update: {
        providerEmail: data.providerEmail,
        providerNickname: data.providerNickname,
        rawProfile: data.rawProfile,
        lastLoginAt: new Date(),
      },
    });
  }

  expireEmailVerificationCodes(email: string) {
    return this.db.emailVerificationCode.updateMany({
      where: { email, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  createEmailVerificationCode(data: {
    email: string;
    codeHash: string;
    expiresAt: Date;
  }) {
    return this.db.emailVerificationCode.create({ data });
  }

  findLatestUsableEmailVerificationCode(email: string, now = new Date()) {
    return this.db.emailVerificationCode.findFirst({
      where: {
        email,
        usedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findEmailVerificationCodeById(id: string, email: string, now = new Date()) {
    return this.db.emailVerificationCode.findFirst({
      where: {
        id,
        email,
        usedAt: null,
        verifiedAt: { not: null },
        expiresAt: { gt: now },
      },
    });
  }

  incrementEmailVerificationAttempts(id: string) {
    return this.db.emailVerificationCode.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  markEmailVerificationCodeVerified(id: string) {
    return this.db.emailVerificationCode.update({
      where: { id },
      data: { verifiedAt: new Date() },
    });
  }

  markEmailVerificationCodeUsed(id: string) {
    return this.db.emailVerificationCode.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  expirePasswordResetTokens(userId: string) {
    return this.db.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  createPasswordResetToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.db.passwordResetToken.create({ data });
  }

  findUsablePasswordResetToken(tokenHash: string, now = new Date()) {
    return this.db.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: now },
      },
      include: {
        user: {
          include: { oauthAccounts: true },
        },
      },
    });
  }

  markPasswordResetTokenUsed(id: string) {
    return this.db.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
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
