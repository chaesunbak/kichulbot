import { CreateWrongQuestionSetRequest } from '@kichulbot/api-contract/review';
import { IsOptional, Matches } from 'class-validator';

export class CreateWrongQuestionSetDto implements CreateWrongQuestionSetRequest {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  studyDate?: string;
}
