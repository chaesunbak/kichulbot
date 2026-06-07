import type { UploadedMemoryFile } from '../../infrastructure/storage/storage.service';
import { PaperImportDraftsController } from './paper-import-drafts.controller';
import type { PaperImportDraftsService } from './paper-import-drafts.service';

const questionPdf = {
  fieldname: 'questionPdf',
  originalname: 'questions.pdf',
  mimetype: 'application/pdf',
  size: 1024,
  buffer: Buffer.from('question-pdf'),
} satisfies UploadedMemoryFile;

const answerPdf = {
  fieldname: 'answerPdf',
  originalname: 'answers.pdf',
  mimetype: 'application/pdf',
  size: 1024,
  buffer: Buffer.from('answer-pdf'),
} satisfies UploadedMemoryFile;

const extraPdf = {
  fieldname: 'answerPdf',
  originalname: 'answers-extra.pdf',
  mimetype: 'application/pdf',
  size: 1024,
  buffer: Buffer.from('answer-pdf-extra'),
} satisfies UploadedMemoryFile;

const unexpectedPdf = {
  fieldname: 'commentaryPdf',
  originalname: 'commentary.pdf',
  mimetype: 'application/pdf',
  size: 1024,
  buffer: Buffer.from('commentary-pdf'),
} satisfies UploadedMemoryFile;

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

    await controller.createDraft([questionPdf, answerPdf], {
      layout: 'korean-history',
      variant: 'odd',
    });

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

    await controller.createDraft([], {});

    expect(paperImportDraftsService.createDraft).toHaveBeenCalledWith({
      questionPdf: undefined,
      answerPdf: undefined,
      options: {},
    });
  });

  it('지원하지 않는 업로드 필드가 있으면 초안 생성을 거부한다', () => {
    expect(() =>
      controller.createDraft([questionPdf, unexpectedPdf], {}),
    ).toThrow('지원하지 않는 업로드 필드입니다.');

    expect(paperImportDraftsService.createDraft).not.toHaveBeenCalled();
  });

  it('같은 종류의 PDF가 2개 이상 업로드되면 초안 생성을 거부한다', () => {
    expect(() =>
      controller.createDraft([questionPdf, answerPdf, extraPdf], {}),
    ).toThrow('답지 PDF는 1개만 업로드할 수 있습니다.');

    expect(paperImportDraftsService.createDraft).not.toHaveBeenCalled();
  });
});
