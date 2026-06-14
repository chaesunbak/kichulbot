import type { PaperImportJob } from '../types';

export const paperImportJobStatusLabels: Record<
  PaperImportJob['status'],
  string
> = {
  PENDING: '대기 중',
  PROCESSING: '처리 중',
  COMPLETED: '완료',
  FAILED: '실패',
};

export function formatJobTime(job: PaperImportJob) {
  const value =
    job.completedAt ?? job.failedAt ?? job.startedAt ?? job.createdAt;
  if (!value) return '시간 정보 없음';

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
