import { SaveQuestionNoteRequest } from '@kichulbot/api-contract/question-notes';
import { IsString, MaxLength } from 'class-validator';

export class SaveQuestionNoteDto implements SaveQuestionNoteRequest {
  @IsString()
  @MaxLength(5000)
  content!: string;
}
