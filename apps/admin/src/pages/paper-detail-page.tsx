import { useParams } from 'react-router';
import { QuestionManager } from '@/features/questions/components/question-manager';
import { useAuthStore } from '@/features/auth/store';

export function PaperDetailPage() {
  const { paperId = '' } = useParams<{ paperId: string }>();
  const token = useAuthStore((state) => state.token)!;
  return <QuestionManager paperId={paperId} token={token} />;
}
