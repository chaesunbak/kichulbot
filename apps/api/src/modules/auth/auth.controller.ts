import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  AuthResponseDto,
  ConvertAnonymousDto,
  DeleteMeResponseDto,
  LoginDto,
  MeResponseDto,
  RegisterDto,
  UpdateMeDto,
  UpdateMeResponseDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequestUser } from './types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('anonymous')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: '게스트 사용자 시작' })
  @ApiCreatedResponse({
    description: '게스트 사용자를 생성하고 access token을 발급합니다.',
    type: AuthResponseDto,
  })
  startAnonymous() {
    return this.authService.startAnonymous();
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: '이메일 회원가입' })
  @ApiCreatedResponse({
    description: '이메일 계정을 생성하고 access token을 발급합니다.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: '요청 body 검증에 실패했습니다.' })
  @ApiConflictResponse({ description: '이미 사용 중인 이메일입니다.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('convert')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '게스트 계정을 이메일 계정으로 전환' })
  @ApiCreatedResponse({
    description:
      '게스트 계정을 이메일 계정으로 전환하고 새 access token을 발급합니다.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: '요청 body 검증에 실패했습니다.' })
  @ApiUnauthorizedResponse({
    description: '인증 정보가 없거나 유효하지 않습니다.',
  })
  @ApiForbiddenResponse({
    description: '게스트 사용자가 아닌 계정은 전환할 수 없습니다.',
  })
  @ApiConflictResponse({ description: '이미 사용 중인 이메일입니다.' })
  convertAnonymous(
    @CurrentUser() user: RequestUser,
    @Body() dto: ConvertAnonymousDto,
  ) {
    return this.authService.convertAnonymous(user.id, dto);
  }

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
