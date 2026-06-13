import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';
import { examsQueryOptions } from '@/features/reference-data/api/server/queries';
import { TagManager } from '@/features/tags/components/tag-manager';

export function TagsPage() {
  const token = useAuthStore((state) => state.token)!;
  const exams = useQuery(examsQueryOptions(token)).data?.exams ?? [];
  return <TagManager token={token} exams={exams} />;
}
