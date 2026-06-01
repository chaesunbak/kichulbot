import {
  AuthResponse,
  ConvertAnonymousRequest,
  DeleteMeResponse,
  LoginRequest,
  MeResponse,
  RegisterRequest,
  UserResponse,
} from '@kichulbot/api-contract/auth';
import { ApiProperty } from '@nestjs/swagger';
import { UserAuthType, UserRole } from '@prisma/client';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto implements RegisterRequest {
  @ApiProperty({
    example: 'user@example.com',
    description: '로그인에 사용할 이메일 주소입니다.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    minLength: 8,
    maxLength: 72,
    example: 'password123!',
    description: '8자 이상 72자 이하의 비밀번호입니다.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({
    required: false,
    maxLength: 30,
    example: 'kichul',
    description: '사용자 표시 이름입니다.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  nickname?: string;
}

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

export class ConvertAnonymousDto
  extends RegisterDto
  implements ConvertAnonymousRequest {}

export class UserResponseDto implements UserResponse {
  @ApiProperty({ example: 'clx0000000000000000000000' })
  id: string;

  @ApiProperty({
    nullable: true,
    example: 'user@example.com',
    description: '게스트 사용자는 이메일이 없을 수 있습니다.',
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

export class MeResponseDto implements MeResponse {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

export class DeleteMeResponseDto implements DeleteMeResponse {
  @ApiProperty({ example: 'clx0000000000000000000000' })
  id: string;
}
