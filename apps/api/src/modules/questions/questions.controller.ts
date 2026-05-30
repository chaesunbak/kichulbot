import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UploadedImageFile } from '../../infrastructure/storage/storage.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionsService } from './questions.service';

const IMAGE_UPLOAD_OPTIONS = {
  limits: { fileSize: 5 * 1024 * 1024 },
};

@ApiTags('admin-questions')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', IMAGE_UPLOAD_OPTIONS))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateQuestionDto })
  @ApiOperation({ summary: '문제 등록 (이미지 업로드)' })
  @ApiCreatedResponse({ description: '문제를 생성합니다.' })
  createQuestion(
    @Body() dto: CreateQuestionDto,
    @UploadedFile() file?: UploadedImageFile,
  ) {
    return this.questionsService.createQuestion(dto, file);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', IMAGE_UPLOAD_OPTIONS))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateQuestionDto })
  @ApiOperation({ summary: '문제 수정' })
  @ApiOkResponse({ description: '문제를 수정합니다.' })
  updateQuestion(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
    @UploadedFile() file?: UploadedImageFile,
  ) {
    return this.questionsService.updateQuestion(id, dto, file);
  }
}
