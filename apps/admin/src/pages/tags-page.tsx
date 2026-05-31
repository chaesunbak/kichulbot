import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store';
import { subjectsQueryOptions } from '@/features/reference-data/queries';
import { TagManager } from '@/features/tags/components/tag-manager';

export function TagsPage() {
  const token = useAuthStore((state) => state.token)!;
  const subjects = useQuery(subjectsQueryOptions(token)).data?.subjects ?? [];
  return <TagManager token={token} subjects={subjects} />;
}
