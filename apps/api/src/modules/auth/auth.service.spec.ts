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

  it('creates an anonymous user and returns an access token', async () => {
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

  it('registers a normalized email user', async () => {
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

  it('rejects duplicate email registration', async () => {
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

  it('converts an anonymous user into an email user', async () => {
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

  it('rejects converting a non-anonymous user', async () => {
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

  it('logs in with a valid password', async () => {
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

  it('rejects login with an invalid password', async () => {
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

  it('validates a JWT payload against the current user row', async () => {
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

  it('deletes the current user account', async () => {
    usersRepository.findById.mockResolvedValue(user());
    usersRepository.deleteById.mockResolvedValue({ id: 'user_1' });

    await expect(service.deleteMe('user_1')).resolves.toEqual({
      id: 'user_1',
    });
    expect(usersRepository.deleteById).toHaveBeenCalledWith('user_1');
  });

  it('rejects account deletion with an invalid user id', async () => {
    usersRepository.findById.mockResolvedValue(null);

    await expect(service.deleteMe('missing_user')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(usersRepository.deleteById).not.toHaveBeenCalled();
  });

  it('updates the current user nickname', async () => {
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
