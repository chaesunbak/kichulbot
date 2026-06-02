import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class QuestionNotesRepository {
  constructor(private readonly db: DatabaseService) {}

  findPublishedQuestion(questionId: string) {
    return this.db.question.findFirst({
      where: { id: questionId, paper: { isPublished: true } },
    });
  }

  findNote(userId: string, questionId: string) {
    return this.db.questionNote.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });
  }

  upsertNote(userId: string, questionId: string, content: string) {
    return this.db.questionNote.upsert({
      where: { userId_questionId: { userId, questionId } },
      create: { userId, questionId, content },
      update: { content },
    });
  }

  deleteNote(userId: string, questionId: string) {
    return this.db.questionNote.deleteMany({
      where: { userId, questionId },
    });
  }
}
