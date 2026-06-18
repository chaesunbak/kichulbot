import type { AuthResponse } from '@kichulbot/api-contract/auth';
import type {
  CreatePaperResponse,
  PaperImportDraftResponse,
} from '@kichulbot/api-contract/papers';
import type {
  ListTagGroupsResponse,
  PublicListTagsResponse,
  TagMutationResponse,
} from '@kichulbot/api-contract/tags';
import type {
  CategoryMutationResponse,
  ExamMutationResponse,
  PublicListCategoriesResponse,
  PublicListExamsResponse,
} from '@kichulbot/api-contract/taxonomy';

export type User = AuthResponse['user'];

export type AdminPaper = CreatePaperResponse['paper'];
export type AdminPaperQuestion = NonNullable<AdminPaper['questions']>[number];
export type PaperImportDraftQuestion =
  PaperImportDraftResponse['questions'][number];

export type Tag = PublicListTagsResponse['tags'][number];
export type AdminTag = TagMutationResponse['tag'];
export type AdminTagGroup = ListTagGroupsResponse['tagGroups'][number];

export type Taxonomy = PublicListCategoriesResponse['categories'][number];
export type Exam = PublicListExamsResponse['exams'][number];
export type AdminTaxonomy = CategoryMutationResponse['category'];
export type AdminExam = ExamMutationResponse['exam'];
