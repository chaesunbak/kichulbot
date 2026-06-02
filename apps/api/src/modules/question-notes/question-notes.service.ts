import {
  QuestionNoteResponse,
  QuestionNoteResponseEnvelope,
  QuestionNoteResponseEnvelopeSchema,
} from '@kichulbot/api-contract/question-notes';
import { Injectable, NotFoundException } from '@nestjs/common';

import { QuestionNotesRepository } from './question-notes.repository';

type StoredQuestionNote = Awaited<
  ReturnType<QuestionNotesRepository['findNote']>
>;

@Injectable()
export class QuestionNotesService {
  constructor(
    private readonly questionNotesRepository: QuestionNotesRepository,
  ) {}

  async get(
    userId: string,
    questionId: string,
  ): Promise<QuestionNoteResponseEnvelope> {
    await this.assertPublishedQuestion(questionId);
    const note = await this.questionNotesRepository.findNote(
      userId,
      questionId,
    );
    return QuestionNoteResponseEnvelopeSchema.parse({
      note: note ? this.toResponse(note) : null,
    });
  }

  async save(
    userId: string,
    questionId: string,
    content: string,
  ): Promise<QuestionNoteResponseEnvelope> {
    await this.assertPublishedQuestion(questionId);
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      await this.questionNotesRepository.deleteNote(userId, questionId);
      return QuestionNoteResponseEnvelopeSchema.parse({ note: null });
    }

    const note = await this.questionNotesRepository.upsertNote(
      userId,
      questionId,
      trimmedContent,
    );
    return QuestionNoteResponseEnvelopeSchema.parse({
      note: this.toResponse(note),
    });
  }

  private async assertPublishedQuestion(questionId: string) {
    const question =
      await this.questionNotesRepository.findPublishedQuestion(questionId);
    if (!question) throw new NotFoundException('문항을 찾을 수 없습니다.');
  }

  private toResponse(note: StoredQuestionNote): QuestionNoteResponse {
    if (!note) throw new NotFoundException('메모를 찾을 수 없습니다.');
    return {
      questionId: note.questionId,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };
  }
}
