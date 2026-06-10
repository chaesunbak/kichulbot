import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Redirect,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  AuthConnectionsResponseDto,
  AuthResponseDto,
  ConfirmEmailVerificationDto,
  DeleteMeResponseDto,
  EmailVerificationConfirmResponseDto,
  EmailVerificationDto,
  EmailVerificationIssueResponseDto,
  LoginDto,
  MeResponseDto,
  OAuthCodeExchangeDto,
  PasswordResetConfirmDto,
  PasswordResetConfirmResponseDto,
  PasswordResetDto,
  PasswordResetIssueResponseDto,
  RegisterDto,
  UpdateMeDto,
  UpdateMeResponseDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { KakaoAuthGuard, KakaoCallbackGuard } from './guards/kakao-auth.guard';
import type { KakaoOAuthProfile } from './strategies/kakao.strategy';
import { RequestUser } from './types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: '이메일 로그인' })
  @ApiCreatedResponse({
    description: '로그인에 성공하면 사용자 정보와 access token을 반환합니다.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: '요청 body 검증에 실패했습니다.' })
  @ApiUnauthorizedResponse({
    description: '이메일 또는 비밀번호가 올바르지 않습니다.',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('password-reset')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: '비밀번호 재설정 링크 발송' })
  @ApiCreatedResponse({
    description: '이메일 계정이면 비밀번호 재설정 링크를 발송합니다.',
    type: PasswordResetIssueResponseDto,
  })
  @ApiBadRequestResponse({ description: '요청 body 검증에 실패했습니다.' })
  requestPasswordReset(@Body() dto: PasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('password-reset/confirm')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: '비밀번호 재설정 완료' })
  @ApiCreatedResponse({
    description: '재설정 토큰을 확인하고 새 비밀번호로 변경합니다.',
    type: PasswordResetConfirmResponseDto,
  })
  @ApiBadRequestResponse({
    description: '비밀번호 재설정 링크가 유효하지 않습니다.',
  })
  confirmPasswordReset(@Body() dto: PasswordResetConfirmDto) {
    return this.authService.confirmPasswordReset(dto);
  }

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: '이메일 회원가입' })
  @ApiCreatedResponse({
    description:
      '이메일 인증을 완료한 사용자를 생성하고 access token을 발급합니다.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: '요청 body 검증에 실패했습니다.' })
  @ApiConflictResponse({ description: '이미 사용 중인 이메일입니다.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('email-verifications')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: '이메일 인증번호 발송' })
  @ApiCreatedResponse({
    description: '회원가입 이메일로 인증번호를 발송합니다.',
    type: EmailVerificationIssueResponseDto,
  })
  @ApiBadRequestResponse({ description: '요청 body 검증에 실패했습니다.' })
  @ApiConflictResponse({ description: '이미 사용 중인 이메일입니다.' })
  requestEmailVerification(@Body() dto: EmailVerificationDto) {
    return this.authService.requestEmailVerification(dto);
  }

  @Post('email-verifications/confirm')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: '이메일 인증번호 확인' })
  @ApiCreatedResponse({
    description: '인증번호가 맞으면 회원가입용 이메일 인증 토큰을 발급합니다.',
    type: EmailVerificationConfirmResponseDto,
  })
  @ApiBadRequestResponse({ description: '인증번호가 올바르지 않습니다.' })
  confirmEmailVerification(@Body() dto: ConfirmEmailVerificationDto) {
    return this.authService.confirmEmailVerification(dto);
  }

  @Get('kakao')
  @UseGuards(KakaoAuthGuard)
  @ApiOperation({ summary: '카카오 OAuth 로그인 시작' })
  startKakao(): undefined {
    return undefined;
  }

  @Get('kakao/callback')
  @UseGuards(KakaoCallbackGuard)
  @Redirect()
  @ApiOperation({ summary: '카카오 OAuth 콜백' })
  async kakaoCallback(@Req() request: Request) {
    const state =
      typeof request.query.state === 'string' ? request.query.state : '';
    const url = await this.authService.handleKakaoCallback(
      (request as Request & { user: KakaoOAuthProfile }).user,
      state,
    );
    return { url };
  }

  @Post('oauth/exchange')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'OAuth 일회용 코드 교환' })
  @ApiCreatedResponse({
    description: 'OAuth 일회용 코드를 access token으로 교환합니다.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: '요청 body 검증에 실패했습니다.' })
  @ApiUnauthorizedResponse({
    description: 'OAuth 인증 코드가 유효하지 않습니다.',
  })
  exchangeOAuthCode(@Body() dto: OAuthCodeExchangeDto) {
    return this.authService.exchangeOAuthCode(dto);
  }
}

@ApiTags('me')
@Controller('me')
export class MeController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 사용자 정보 조회' })
  @ApiOkResponse({
    description: '현재 인증된 사용자의 정보를 반환합니다.',
    type: MeResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '인증 정보가 없거나 유효하지 않습니다.',
  })
  me(@CurrentUser() user: RequestUser) {
    return this.authService.getMe(user.id);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 프로필 수정' })
  @ApiOkResponse({
    description: '현재 인증된 사용자의 프로필을 수정합니다.',
    type: UpdateMeResponseDto,
  })
  @ApiBadRequestResponse({ description: '요청 body 검증에 실패했습니다.' })
  @ApiUnauthorizedResponse({
    description: '인증 정보가 없거나 유효하지 않습니다.',
  })
  updateMe(@CurrentUser() user: RequestUser, @Body() dto: UpdateMeDto) {
    return this.authService.updateMe(user.id, dto);
  }

  @Get('auth-connections')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 인증 연결 상태 조회' })
  @ApiOkResponse({
    description: '현재 계정에 연결된 OAuth provider 목록을 반환합니다.',
    type: AuthConnectionsResponseDto,
  })
  authConnections(@CurrentUser() user: RequestUser) {
    return this.authService.listAuthConnections(user.id);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 계정 삭제' })
  @ApiOkResponse({
    description: '현재 인증된 사용자의 계정을 삭제합니다.',
    type: DeleteMeResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '인증 정보가 없거나 유효하지 않습니다.',
  })
  deleteMe(@CurrentUser() user: RequestUser) {
    return this.authService.deleteMe(user.id);
  }
}
