import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';

export class ListQuestionAttemptsDto {
  @ApiProperty({
    example: '2026-06-01',
    description:
      '조회 시작일입니다. YYYY-MM-DD 형식이며 해당 날짜 00:00부터 포함합니다.',
  })
  @IsISO8601({ strict: true })
  from: string;

  @ApiProperty({
    example: '2026-06-07',
    description:
      '조회 종료일입니다. YYYY-MM-DD 형식이며 해당 날짜 23:59:59까지 포함합니다.',
  })
  @IsISO8601({ strict: true })
  to: string;
}
