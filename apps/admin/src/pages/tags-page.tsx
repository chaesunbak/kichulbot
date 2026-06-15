import { useSuspenseQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/use-auth-store';
import { examsQueryOptions } from '@/features/reference-data/queries/options';
import { TagManager } from '@/features/tags/components/tag-manager';

export function TagsPage() {
  const token = useAuthStore((state) => state.token)!;
  const examsQuery = useSuspenseQuery(examsQueryOptions(token));
  const exams = examsQuery.data.exams;
  return <TagManager token={token} exams={exams} />;
}
