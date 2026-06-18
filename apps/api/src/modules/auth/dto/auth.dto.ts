import {
  AuthConnectionsResponse,
  AuthResponse,
  ConfigureEmailLoginRequestSchema,
  ConfirmEmailVerificationRequestSchema,
  DeleteMeResponse,
  EmailVerificationConfirmResponse,
  EmailVerificationIssueResponse,
  EmailVerificationRequestSchema,
  KakaoOAuthProfileRequestSchema,
  LoginRequestSchema,
  MeResponse,
  OAuthCodeExchangeRequestSchema,
  PasswordResetConfirmRequestSchema,
  PasswordResetConfirmResponse,
  PasswordResetIssueResponse,
  PasswordResetRequestSchema,
  RegisterRequestSchema,
  UpdateMeRequestSchema,
  UpdateMeResponse,
} from '@kichulbot/api-contract/auth';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import {
  OAuthProvider,
  SignupMethod,
  UserRole,
} from '../../../infrastructure/database/prisma-client';

type UserResponse = AuthResponse['user'];

export class LoginDto extends createZodDto(LoginRequestSchema) {}

export class PasswordResetDto extends createZodDto(
  PasswordResetRequestSchema,
) {}

export class PasswordResetConfirmDto extends createZodDto(
  PasswordResetConfirmRequestSchema,
) {}

export class RegisterDto extends createZodDto(RegisterRequestSchema) {}

export class EmailVerificationDto extends createZodDto(
  EmailVerificationRequestSchema,
) {}

export class ConfirmEmailVerificationDto extends createZodDto(
  ConfirmEmailVerificationRequestSchema,
) {}

export class KakaoOAuthProfileDto extends createZodDto(
  KakaoOAuthProfileRequestSchema,
) {}

export class OAuthCodeExchangeDto extends createZodDto(
  OAuthCodeExchangeRequestSchema,
) {}

export class UpdateMeDto extends createZodDto(UpdateMeRequestSchema) {}

export class ConfigureEmailLoginDto extends createZodDto(
  ConfigureEmailLoginRequestSchema,
) {}

export class UserResponseDto implements UserResponse {
  @ApiProperty({ example: 'clx0000000000000000000000' })
  id: string;

  @ApiProperty({
    nullable: true,
    example: 'user@example.com',
    description: 'OAuth 계정은 이메일 제공 동의 여부에 따라 없을 수 있습니다.',
  })
  email: string | null;

  @ApiProperty({
    nullable: true,
    example: 'kichul',
    description: '사용자 표시 이름입니다.',
  })
  nickname: string | null;

  @ApiProperty({ enum: SignupMethod, example: SignupMethod.EMAIL })
  signupMethod: SignupMethod;

  @ApiProperty({
    enum: ['EMAIL', 'KAKAO'],
    isArray: true,
    example: ['EMAIL', 'KAKAO'],
    description: '현재 사용할 수 있는 로그인 수단 목록입니다.',
  })
  authMethods: Array<'EMAIL' | 'KAKAO'>;

  @ApiProperty({
    enum: OAuthProvider,
    isArray: true,
    example: [OAuthProvider.KAKAO],
    description: '현재 사용자에게 연결된 OAuth provider 목록입니다.',
  })
  linkedProviders: OAuthProvider[];

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role: UserRole;

  @ApiProperty({ example: '2026-05-28T08:45:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-28T08:45:00.000Z' })
  updatedAt: string;
}

export class AuthResponseDto implements AuthResponse {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Bearer 인증에 사용할 JWT access token입니다.',
  })
  accessToken: string;
}

export class EmailVerificationIssueResponseDto implements EmailVerificationIssueResponse {
  @ApiProperty({ example: true })
  ok: true;
}

export class EmailVerificationConfirmResponseDto implements EmailVerificationConfirmResponse {
  @ApiProperty({
    description: '이메일 회원가입에 사용할 짧은 수명의 인증 토큰입니다.',
  })
  emailVerificationToken: string;
}

export class PasswordResetIssueResponseDto implements PasswordResetIssueResponse {
  @ApiProperty({ example: true })
  ok: true;
}

export class PasswordResetConfirmResponseDto implements PasswordResetConfirmResponse {
  @ApiProperty({ example: true })
  ok: true;
}

export class MeResponseDto implements MeResponse {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

export class UpdateMeResponseDto implements UpdateMeResponse {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

export class DeleteMeResponseDto implements DeleteMeResponse {
  @ApiProperty({ example: 'clx0000000000000000000000' })
  id: string;
}

export class AuthConnectionDto {
  @ApiProperty({ enum: OAuthProvider, example: OAuthProvider.KAKAO })
  provider: OAuthProvider;

  @ApiProperty({ nullable: true, example: '2026-05-28T08:45:00.000Z' })
  lastLoginAt: string | null;

  @ApiProperty({ example: '2026-05-28T08:45:00.000Z' })
  createdAt: string;
}

export class AuthConnectionsResponseDto implements AuthConnectionsResponse {
  @ApiProperty({ type: AuthConnectionDto, isArray: true })
  connections: AuthConnectionDto[];
}
