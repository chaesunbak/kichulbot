import type { AuthResponse, UserResponse } from '@kichulbot/api-contract/auth';
import type { AdminPaperResponse } from '@kichulbot/api-contract/papers';
import type {
  ExamResponse,
  TaxonomyResponse,
} from '@kichulbot/api-contract/taxonomy';

export type User = UserResponse;
export type AuthPayload = AuthResponse;
export type Taxonomy = TaxonomyResponse;
export type Exam = ExamResponse;
export type Paper = AdminPaperResponse;
