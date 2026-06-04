import {
  AuthResponse,
  AuthConnectionsResponse,
  ConfirmEmailVerificationRequest,
  DeleteMeResponse,
  EmailVerificationConfirmResponse,
  EmailVerificationIssueResponse,
  EmailVerificationRequest,
  KakaoOAuthProfileRequest,
  LoginRequest,
  MeResponse,
  PasswordResetConfirmRequest,
  PasswordResetConfirmResponse,
  PasswordResetIssueResponse,
  PasswordResetRequest,
  RegisterRequest,
  UpdateMeRequest,
  UpdateMeResponse,
  UserResponse,
} from '@kichulbot/api-contract/auth';
import { ApiProperty } from '@nestjs/swagger';
import {
  OAuthProvider,
  UserAuthType,
  UserRole,
} from '../../../infrastructure/database/prisma-client';
import {
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto implements LoginRequest {
  @ApiProperty({
    example: 'user@example.com',
    description: '가입한 이메일 주소입니다.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    minLength: 8,
    maxLength: 72,
    example: 'password123!',
    description: '계정 비밀번호입니다.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}

export class PasswordResetDto implements PasswordResetRequest {
  @ApiProperty({
    example: 'student@example.com',
    description: '비밀번호 재설정 링크를 받을 이메일 주소입니다.',
  })
  @IsEmail()
  email: string;
}

export class PasswordResetConfirmDto implements PasswordResetConfirmRequest {
  @ApiProperty({
    description: '비밀번호 재설정 메일에 포함된 토큰입니다.',
  })
  @IsString()
  @MinLength(1)
  token: string;

  @ApiProperty({
    minLength: 8,
    maxLength: 72,
    example: 'new-password123!',
    description: '새 계정 비밀번호입니다.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}

export class RegisterDto implements RegisterRequest {
  @ApiProperty({
    example: 'student@example.com',
    description: '회원가입에 사용할 이메일 주소입니다.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    minLength: 8,
    maxLength: 72,
    example: 'password123!',
    description: '계정 비밀번호입니다.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({
    required: false,
    maxLength: 20,
    example: '기출러',
    description: '표시 이름입니다.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  nickname?: string;

  @ApiProperty({
    description: '인증번호 확인 후 발급받은 이메일 인증 토큰입니다.',
  })
  @IsString()
  @MinLength(1)
  emailVerificationToken: string;
}

export class EmailVerificationDto implements EmailVerificationRequest {
  @ApiProperty({
    example: 'student@example.com',
    description: '인증번호를 받을 이메일 주소입니다.',
  })
  @IsEmail()
  email: string;
}

export class ConfirmEmailVerificationDto implements ConfirmEmailVerificationRequest {
  @ApiProperty({
    example: 'student@example.com',
    description: '인증번호를 받은 이메일 주소입니다.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: '메일로 받은 6자리 인증번호입니다.',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}

export class KakaoOAuthProfileDto implements KakaoOAuthProfileRequest {
  @ApiProperty({
    example: '3765432101',
    description: '카카오가 제공하는 고유 사용자 ID입니다.',
  })
  @IsString()
  @MinLength(1)
  providerAccountId: string;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 'student@example.com',
    description: '카카오 계정 이메일입니다. 미동의 시 없을 수 있습니다.',
  })
  @IsOptional()
  @IsEmail()
  providerEmail?: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    maxLength: 50,
    example: '기출러',
    description: '카카오 프로필 닉네임입니다.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  providerNickname?: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description: '최소 범위로 보관할 provider 원본 프로필입니다.',
  })
  @IsOptional()
  @IsObject()
  rawProfile?: Record<string, unknown> | null;
}

export class UpdateMeDto implements UpdateMeRequest {
  @ApiProperty({
    minLength: 2,
    maxLength: 20,
    example: '기출왕',
    description: '수정할 사용자 닉네임입니다.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  nickname: string;
}

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

  @ApiProperty({ enum: UserAuthType, example: UserAuthType.EMAIL })
  authType: UserAuthType;

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

  @ApiProperty({ nullable: true, example: 'student@example.com' })
  providerEmail: string | null;

  @ApiProperty({ nullable: true, example: '기출러' })
  providerNickname: string | null;

  @ApiProperty({ nullable: true, example: '2026-05-28T08:45:00.000Z' })
  lastLoginAt: string | null;

  @ApiProperty({ example: '2026-05-28T08:45:00.000Z' })
  createdAt: string;
}

export class AuthConnectionsResponseDto implements AuthConnectionsResponse {
  @ApiProperty({ type: AuthConnectionDto, isArray: true })
  connections: AuthConnectionDto[];
}
