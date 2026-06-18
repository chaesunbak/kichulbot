import { QuestionNoteResponseEnvelope } from '@kichulbot/api-contract/question-notes';
import { Injectable, NotFoundException } from '@nestjs/common';

import { QuestionNotesRepository } from './question-notes.repository';
import type {
  QuestionNotePayload,
  QuestionNoteRecord,
} from './question-notes.types';

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
    return {
      note: note ? this.toQuestionNotePayload(note) : null,
    };
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
      return { note: null };
    }

    const note = await this.questionNotesRepository.upsertNote(
      userId,
      questionId,
      trimmedContent,
    );
    return {
      note: this.toQuestionNotePayload(note),
    };
  }

  private async assertPublishedQuestion(questionId: string) {
    const question =
      await this.questionNotesRepository.findPublishedQuestion(questionId);
    if (!question) throw new NotFoundException('문항을 찾을 수 없습니다.');
  }

  private toQuestionNotePayload(note: QuestionNoteRecord): QuestionNotePayload {
    return {
      questionId: note.questionId,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };
  }
}
