import { UpdatePaperRequest } from '@kichulbot/api-contract/papers';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdatePaperDto implements UpdatePaperRequest {
  @ApiProperty()
  @IsBoolean()
  isPublished: boolean;
}
