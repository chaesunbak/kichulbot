import type {
  AdminGetPaperResponse,
  CreatePaperResponse,
  PublicGetPaperResponse,
} from '@kichulbot/api-contract/papers';

import type {
  Exam,
  ExamSession,
  Paper,
  Prisma,
  Question,
  QuestionRevision,
} from '../../infrastructure/database/prisma-client';
import type { PapersRepository } from './papers.repository';

export type AdminPaperItem = CreatePaperResponse['paper'];
export type AdminPaperDetailItem = AdminGetPaperResponse['paper'];
export type PaperDetailItem = PublicGetPaperResponse['paper'];
export type PaperExamItem = PaperDetailItem['exam'];

export type PaperRecord = Paper & {
  examSession: ExamSession & { exam: Exam };
  questions?: Array<
    Question & {
      revisions?: QuestionRevision[];
      tags?: Array<
        Prisma.QuestionTagGetPayload<{
          include: { tag: { include: { tagGroup: true } } };
        }>
      >;
    }
  >;
  users?: Array<{ id: string }>;
};

export type PaperListRecord = Awaited<
  ReturnType<PapersRepository['findManyForList']>
>[number];
