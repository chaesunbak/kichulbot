import {
  ListSolveSessionLogsQuery,
  SolveSessionLogStatus,
} from '@kichulbot/api-contract/solve-sessions';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, Matches } from 'class-validator';

import { PaginationDto } from '../../../common/dto/pagination.dto';

const SOLVE_SESSION_LOG_STATUSES = ['all', 'completed', 'in_progress'] as const;

export class ListSolveSessionLogsDto
  extends PaginationDto
  implements ListSolveSessionLogsQuery
{
  @ApiProperty({
    required: false,
    enum: SOLVE_SESSION_LOG_STATUSES,
    default: 'all',
  })
  @IsOptional()
  @IsIn(SOLVE_SESSION_LOG_STATUSES)
  status: SolveSessionLogStatus = 'all';

  @ApiProperty({
    required: false,
    description: 'KST 기준 제출일(YYYY-MM-DD)',
    example: '2026-06-06',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  submittedDate?: string;
}
