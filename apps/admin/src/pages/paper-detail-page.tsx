import { useParams } from 'react-router';

import { useAuthStore } from '@/features/auth/store';
import { QuestionManager } from '@/features/questions/components/question-manager';

export function PaperDetailPage() {
  const { paperId = '' } = useParams<{ paperId: string }>();
  const token = useAuthStore((state) => state.token)!;
  return <QuestionManager paperId={paperId} token={token} />;
}
