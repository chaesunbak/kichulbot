import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsISO8601, IsOptional } from 'class-validator';

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

  @ApiProperty({
    required: false,
    example: true,
    description: 'true이면 문항에 연결된 태그와 태그 그룹 정보를 포함합니다.',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true';
  })
  includeTags?: boolean;
}
