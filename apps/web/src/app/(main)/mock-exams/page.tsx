import { redirectToLoginIfUnauthorized } from '@/features/auth/api/server/redirect';
import { getExams } from '@/features/exams/api/server/queries';
import { MockExamStartPanel } from '@/features/learning/components/mock-exam-start-panel';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function MockExamsPage() {
  let exams;
  try {
    exams = await getExams();
  } catch (error) {
    redirectToLoginIfUnauthorized(error, '/mock-exams');
    return (
      <PageContainer className="min-h-[calc(100svh-16rem)]">
        <PageTitle>모의고사</PageTitle>
        <p className="mt-3 text-sm text-destructive">
          모의고사 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="min-h-[calc(100svh-16rem)]">
      <PageTitle>모의고사</PageTitle>
      <MockExamStartPanel exams={exams} />
    </PageContainer>
  );
}
