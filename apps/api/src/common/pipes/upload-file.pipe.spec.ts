import { assertPdfUploadFile, IMAGE_FILE_PIPE } from './upload-file.pipe';

describe('upload file pipe', () => {
  it('이미지 파일이 없어도 선택 업로드를 통과시킨다', async () => {
    await expect(IMAGE_FILE_PIPE.transform(undefined)).resolves.toBeUndefined();
  });

  it('최대 크기를 초과한 이미지는 업로드를 거부한다', async () => {
    await expect(
      IMAGE_FILE_PIPE.transform({
        originalname: 'question.png',
        mimetype: 'image/png',
        size: 5 * 1024 * 1024 + 1,
        buffer: Buffer.alloc(0),
      }),
    ).rejects.toBeInstanceOf(Error);
  });

  it('최대 크기를 초과한 PDF는 업로드를 거부한다', () => {
    expect(() =>
      assertPdfUploadFile(
        {
          originalname: 'questions.pdf',
          mimetype: 'application/pdf',
          size: 30 * 1024 * 1024 + 1,
          buffer: Buffer.alloc(0),
        },
        '문제 PDF',
      ),
    ).toThrow(Error);
  });

  it('확장자가 PDF여도 MIME 타입이 다르면 업로드를 거부한다', () => {
    expect(() =>
      assertPdfUploadFile(
        {
          originalname: 'questions.pdf',
          mimetype: 'image/png',
          size: 1024,
          buffer: Buffer.alloc(0),
        },
        '문제 PDF',
      ),
    ).toThrow('문제 PDF는 PDF 파일만 업로드할 수 있습니다.');
  });
});
