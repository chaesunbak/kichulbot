import type { StudyWeeklyGoal } from '@/features/study-weekly-goals/types';
import { clientApi } from '@/shared/api/client';

export async function updateCurrentStudyWeeklyGoal(
  targetDays: number,
): Promise<StudyWeeklyGoal> {
  const res = await clientApi.patch<{
    data: { goal: StudyWeeklyGoal };
  }>('/api/me/study-weekly-goals/current', { targetDays });

  return res.data.goal;
}
