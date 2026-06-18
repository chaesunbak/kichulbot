import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service';
import {
  OAuthProvider,
  Prisma,
  QuestionSetKind,
  SignupMethod,
  UserRole,
} from '../../infrastructure/database/prisma-client';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  createOAuthUser(data: {
    provider: OAuthProvider;
    providerAccountId: string;
    nickname: string;
  }) {
    return this.db.user.create({
      data: {
        email: null,
        nickname: data.nickname,
        signupMethod: SignupMethod.KAKAO,
        role: UserRole.USER,
        questionSets: {
          create: { kind: QuestionSetKind.CUSTOM, title: '기본 북마크' },
        },
        oauthAccounts: {
          create: {
            provider: data.provider,
            providerAccountId: data.providerAccountId,
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
        signupMethod: SignupMethod.EMAIL,
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
      data: { passwordHash, tokenVersion: { increment: 1 } },
      include: { oauthAccounts: true },
    });
  }

  updateEmailLogin(
    userId: string,
    data: { email: string; passwordHash: string },
  ) {
    return this.db.user.update({
      where: { id: userId },
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        tokenVersion: { increment: 1 },
      },
      include: { oauthAccounts: true },
    });
  }

  upsertOAuthAccount(data: {
    userId: string;
    provider: OAuthProvider;
    providerAccountId: string;
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
        lastLoginAt: new Date(),
      },
      update: {
        lastLoginAt: new Date(),
      },
    });
  }

  deleteOAuthAccount(userId: string, provider: OAuthProvider) {
    return this.db.oAuthAccount.delete({
      where: {
        userId_provider: {
          userId,
          provider,
        },
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

  expireOAuthAuthorizationCodes(userId: string) {
    return this.db.oAuthAuthorizationCode.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  createOAuthAuthorizationCode(data: {
    userId: string;
    codeHash: string;
    expiresAt: Date;
  }) {
    return this.db.oAuthAuthorizationCode.create({ data });
  }

  consumeOAuthAuthorizationCode(codeHash: string, now = new Date()) {
    return this.db.$transaction(async (tx) => {
      const result = await tx.oAuthAuthorizationCode.updateMany({
        where: {
          codeHash,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });
      if (result.count !== 1) return null;

      return tx.oAuthAuthorizationCode.findUnique({
        where: { codeHash },
        include: {
          user: {
            include: { oauthAccounts: true },
          },
        },
      });
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
