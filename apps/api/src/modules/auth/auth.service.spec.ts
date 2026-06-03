import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { UserAuthType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import type { UsersRepository } from './users.repository';

const now = new Date('2026-05-28T00:00:00.000Z');

function user(overrides: Partial<User> = {}): User {
  return {
    id: 'user_1',
    email: null,
    passwordHash: null,
    nickname: null,
    timezone: 'Asia/Seoul',
    authType: UserAuthType.ANONYMOUS,
    role: UserRole.USER,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    usersRepository = {
      createAnonymousUser: jest.fn(),
      createEmailUser: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
      updateProfile: jest.fn(),
      convertAnonymousUser: jest.fn(),
      isUniqueConstraintError: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    } as unknown as jest.Mocked<JwtService>;

    service = new AuthService(
      usersRepository,
      jwtService,
      new ConfigService({
        auth: {
          jwtSecret: 'test-secret',
          jwtExpiresIn: '1h',
        },
      }),
    );
  });

  it('익명 사용자를 만들고 액세스 토큰을 반환한다', async () => {
    usersRepository.createAnonymousUser.mockResolvedValue(user());

    await expect(service.startAnonymous()).resolves.toMatchObject({
      user: {
        id: 'user_1',
        authType: UserAuthType.ANONYMOUS,
        role: UserRole.USER,
      },
      accessToken: 'access-token',
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      {
        sub: 'user_1',
        role: UserRole.USER,
        authType: UserAuthType.ANONYMOUS,
      },
      {
        secret: 'test-secret',
        expiresIn: '1h',
      },
    );
  });

  it('정규화된 이메일로 사용자를 회원가입시킨다', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.createEmailUser.mockResolvedValue(
      user({
        email: 'student@example.com',
        passwordHash: 'hashed',
        nickname: '학생',
        authType: UserAuthType.EMAIL,
      }),
    );

    const response = await service.register({
      email: ' Student@Example.COM ',
      password: 'password123',
      nickname: '학생',
    });

    expect(response.user).toMatchObject({
      email: 'student@example.com',
      authType: UserAuthType.EMAIL,
    });
    expect(usersRepository.createEmailUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'student@example.com',
        nickname: '학생',
        passwordHash: expect.any(String),
      }),
    );
  });

  it('중복 이메일 회원가입을 거부한다', async () => {
    usersRepository.findByEmail.mockResolvedValue(
      user({ email: 'student@example.com' }),
    );

    await expect(
      service.register({
        email: 'student@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('익명 사용자를 이메일 사용자로 전환한다', async () => {
    usersRepository.findById.mockResolvedValue(user());
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.convertAnonymousUser.mockResolvedValue(
      user({
        email: 'student@example.com',
        passwordHash: 'hashed',
        authType: UserAuthType.EMAIL,
      }),
    );

    const response = await service.convertAnonymous('user_1', {
      email: 'student@example.com',
      password: 'password123',
    });

    expect(response.user.authType).toBe(UserAuthType.EMAIL);
    expect(usersRepository.convertAnonymousUser).toHaveBeenCalledWith(
      'user_1',
      expect.objectContaining({
        email: 'student@example.com',
        passwordHash: expect.any(String),
      }),
    );
  });

  it('익명 사용자가 아닌 계정의 전환을 거부한다', async () => {
    usersRepository.findById.mockResolvedValue(
      user({ authType: UserAuthType.EMAIL }),
    );

    await expect(
      service.convertAnonymous('user_1', {
        email: 'student@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('유효한 비밀번호로 로그인한다', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    usersRepository.findByEmail.mockResolvedValue(
      user({
        email: 'student@example.com',
        passwordHash,
        authType: UserAuthType.EMAIL,
      }),
    );

    await expect(
      service.login({
        email: 'student@example.com',
        password: 'password123',
      }),
    ).resolves.toMatchObject({
      accessToken: 'access-token',
      user: {
        email: 'student@example.com',
      },
    });
  });

  it('유효하지 않은 비밀번호 로그인은 거부한다', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    usersRepository.findByEmail.mockResolvedValue(
      user({
        email: 'student@example.com',
        passwordHash,
        authType: UserAuthType.EMAIL,
      }),
    );

    await expect(
      service.login({
        email: 'student@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('JWT 정보를 현재 사용자 레코드와 대조해 검증한다', async () => {
    usersRepository.findById.mockResolvedValue(user({ email: 'a@b.com' }));

    await expect(
      service.validateJwtPayload({
        sub: 'user_1',
        role: UserRole.USER,
        authType: UserAuthType.ANONYMOUS,
      }),
    ).resolves.toMatchObject({
      id: 'user_1',
      email: 'a@b.com',
    });
  });

  it('현재 사용자 계정을 삭제한다', async () => {
    usersRepository.findById.mockResolvedValue(user());
    usersRepository.deleteById.mockResolvedValue({ id: 'user_1' });

    await expect(service.deleteMe('user_1')).resolves.toEqual({
      id: 'user_1',
    });
    expect(usersRepository.deleteById).toHaveBeenCalledWith('user_1');
  });

  it('유효하지 않은 사용자 식별자의 계정 삭제를 거부한다', async () => {
    usersRepository.findById.mockResolvedValue(null);

    await expect(service.deleteMe('missing_user')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(usersRepository.deleteById).not.toHaveBeenCalled();
  });

  it('현재 사용자 닉네임을 수정한다', async () => {
    usersRepository.findById.mockResolvedValue(user());
    usersRepository.updateProfile.mockResolvedValue(
      user({ nickname: '새 닉네임' }),
    );

    await expect(
      service.updateMe('user_1', { nickname: '  새 닉네임  ' }),
    ).resolves.toEqual({
      user: expect.objectContaining({ nickname: '새 닉네임' }),
    });
    expect(usersRepository.updateProfile).toHaveBeenCalledWith('user_1', {
      nickname: '새 닉네임',
    });
  });
});
