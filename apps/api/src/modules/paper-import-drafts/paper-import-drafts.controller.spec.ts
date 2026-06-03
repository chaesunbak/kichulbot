import type { UploadedImageFile } from '../../infrastructure/storage/storage.service';
import { PaperImportDraftsController } from './paper-import-drafts.controller';
import type { PaperImportDraftsService } from './paper-import-drafts.service';

const questionPdf = {
  originalname: 'questions.pdf',
  mimetype: 'application/pdf',
  size: 1024,
  buffer: Buffer.from('question-pdf'),
} satisfies UploadedImageFile;

const answerPdf = {
  originalname: 'answers.pdf',
  mimetype: 'application/pdf',
  size: 1024,
  buffer: Buffer.from('answer-pdf'),
} satisfies UploadedImageFile;

describe('PaperImportDraftsController', () => {
  let controller: PaperImportDraftsController;
  let paperImportDraftsService: jest.Mocked<PaperImportDraftsService>;

  beforeEach(() => {
    paperImportDraftsService = {
      createDraft: jest.fn(),
    } as unknown as jest.Mocked<PaperImportDraftsService>;

    controller = new PaperImportDraftsController(paperImportDraftsService);
  });

  it('업로드 파일 배열의 첫 번째 PDF와 옵션을 초안 생성 서비스에 전달한다', async () => {
    paperImportDraftsService.createDraft.mockResolvedValue({
      questions: [],
      warnings: [],
    } as never);

    await controller.createDraft(
      {
        questionPdf: [questionPdf, { ...questionPdf, originalname: 'extra.pdf' }],
        answerPdf: [answerPdf],
      },
      { layout: 'korean-history', variant: 'odd' },
    );

    expect(paperImportDraftsService.createDraft).toHaveBeenCalledWith({
      questionPdf,
      answerPdf,
      options: { layout: 'korean-history', variant: 'odd' },
    });
  });

  it('업로드되지 않은 PDF는 undefined로 전달한다', async () => {
    paperImportDraftsService.createDraft.mockResolvedValue({
      questions: [],
      warnings: [],
    } as never);

    await controller.createDraft({}, {});

    expect(paperImportDraftsService.createDraft).toHaveBeenCalledWith({
      questionPdf: undefined,
      answerPdf: undefined,
      options: {},
    });
  });
});
