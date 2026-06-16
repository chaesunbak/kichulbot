import type { UploadedMemoryFile } from '../../../infrastructure/storage/storage.service';
import { PAPER_IMPORT_DRAFT_FILES_PIPE } from './paper-import-draft-files.pipe';

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

const extraAnswerPdf = {
  fieldname: 'answerPdf',
  originalname: 'answers-extra.pdf',
  mimetype: 'application/pdf',
  size: 1024,
  buffer: Buffer.from('answer-pdf-extra'),
} satisfies UploadedMemoryFile;

const imageFile = {
  fieldname: 'questionPdf',
  originalname: 'questions.png',
  mimetype: 'image/png',
  size: 1024,
  buffer: Buffer.from('question-image'),
} satisfies UploadedMemoryFile;

describe('PaperImportDraftFilesPipe', () => {
  it('필드별 PDF 배열을 초안 생성 입력 형태로 변환한다', () => {
    expect(
      PAPER_IMPORT_DRAFT_FILES_PIPE.transform({
        questionPdf: [questionPdf],
        answerPdf: [answerPdf],
      }),
    ).toEqual({
      questionPdf,
      answerPdf,
    });
  });

  it('업로드되지 않은 PDF는 undefined로 변환한다', () => {
    expect(PAPER_IMPORT_DRAFT_FILES_PIPE.transform({})).toEqual({
      questionPdf: undefined,
      answerPdf: undefined,
    });
  });

  it('지원하지 않는 업로드 필드가 있으면 거부한다', () => {
    expect(() =>
      PAPER_IMPORT_DRAFT_FILES_PIPE.transform({
        commentaryPdf: [answerPdf],
      } as never),
    ).toThrow('지원하지 않는 업로드 필드입니다.');
  });

  it('같은 종류의 PDF가 2개 이상 업로드되면 거부한다', () => {
    expect(() =>
      PAPER_IMPORT_DRAFT_FILES_PIPE.transform({
        questionPdf: [questionPdf],
        answerPdf: [answerPdf, extraAnswerPdf],
      }),
    ).toThrow('답지 PDF는 1개만 업로드할 수 있습니다.');
  });

  it('PDF가 아닌 파일은 거부한다', () => {
    expect(() =>
      PAPER_IMPORT_DRAFT_FILES_PIPE.transform({
        questionPdf: [imageFile],
      }),
    ).toThrow('문제 PDF는 PDF 파일만 업로드할 수 있습니다.');
  });
});
