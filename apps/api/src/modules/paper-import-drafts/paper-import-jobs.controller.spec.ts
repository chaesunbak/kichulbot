import type { PaperImportDraftsService } from './paper-import-drafts.service';
import { PaperImportJobsController } from './paper-import-jobs.controller';

describe('PaperImportJobsController', () => {
  let controller: PaperImportJobsController;
  let paperImportDraftsService: jest.Mocked<PaperImportDraftsService>;

  beforeEach(() => {
    paperImportDraftsService = {
      getImportJobPayload: jest.fn(),
      updateImportJobStatus: jest.fn(),
      saveImportJobResult: jest.fn(),
      createPaperFromImportJob: jest.fn(),
    } as unknown as jest.Mocked<PaperImportDraftsService>;

    controller = new PaperImportJobsController(paperImportDraftsService);
  });

  it('PDF 추출 작업 payload 조회를 서비스에 위임한다', async () => {
    paperImportDraftsService.getImportJobPayload.mockResolvedValue({
      job: { id: 'job_1' },
    } as never);

    await controller.getJobPayload('job_1');

    expect(paperImportDraftsService.getImportJobPayload).toHaveBeenCalledWith(
      'job_1',
    );
  });

  it('PDF 추출 작업 상태 변경을 서비스에 위임한다', async () => {
    const body = { status: 'PROCESSING' as const };
    paperImportDraftsService.updateImportJobStatus.mockResolvedValue({
      job: { id: 'job_1' },
    } as never);

    await controller.updateJobStatus('job_1', body);

    expect(paperImportDraftsService.updateImportJobStatus).toHaveBeenCalledWith(
      'job_1',
      body,
    );
  });

  it('PDF 추출 작업 결과 저장을 서비스에 위임한다', async () => {
    const body = { resultJsonPath: 'paper-import-jobs/job_1/result.json' };
    paperImportDraftsService.saveImportJobResult.mockResolvedValue({
      job: { id: 'job_1' },
    } as never);

    await controller.saveJobResult('job_1', body);

    expect(paperImportDraftsService.saveImportJobResult).toHaveBeenCalledWith(
      'job_1',
      body,
    );
  });

  it('PDF 추출 결과의 문제지 생성을 서비스에 위임한다', async () => {
    paperImportDraftsService.createPaperFromImportJob.mockResolvedValue({
      paper: { id: 'paper_1' },
    } as never);

    await controller.createPaperFromJob('job_1');

    expect(
      paperImportDraftsService.createPaperFromImportJob,
    ).toHaveBeenCalledWith('job_1');
  });
});
