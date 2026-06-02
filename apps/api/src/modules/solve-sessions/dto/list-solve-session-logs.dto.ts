import {
  ListSolveSessionLogsQuery,
  SolveSessionLogStatus,
} from '@kichulbot/api-contract/solve-sessions';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

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
}
