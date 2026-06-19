import type { DatabaseService } from '../../../infrastructure/database/database.service';
import { QuestionSetKind } from '../../../infrastructure/database/prisma-client';

type BookmarkedQuestionIdsClient = Pick<DatabaseService, 'questionSetItem'>;

export async function findBookmarkedQuestionIds(
  db: BookmarkedQuestionIdsClient,
  userId: string,
  questionIds: string[],
) {
  if (questionIds.length === 0) return [];

  const items = await db.questionSetItem.findMany({
    where: {
      questionSet: {
        ownerUserId: userId,
        kind: QuestionSetKind.CUSTOM,
      },
      questionRevision: {
        questionId: { in: questionIds },
      },
    },
    select: {
      questionRevision: {
        select: { questionId: true },
      },
    },
  });

  return [...new Set(items.map((item) => item.questionRevision.questionId))];
}
