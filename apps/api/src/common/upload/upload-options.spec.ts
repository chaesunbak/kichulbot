import { IMAGE_FILE_PIPE, PDF_FILES_PIPE } from './upload-options';

describe('upload options', () => {
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

  it('PDF 파일 배열이 비어도 선택 업로드를 통과시킨다', async () => {
    await expect(PDF_FILES_PIPE.transform([])).resolves.toEqual([]);
  });

  it('최대 크기를 초과한 PDF는 업로드를 거부한다', async () => {
    await expect(
      PDF_FILES_PIPE.transform([
        {
          originalname: 'questions.pdf',
          mimetype: 'application/pdf',
          size: 30 * 1024 * 1024 + 1,
          buffer: Buffer.alloc(0),
        },
      ]),
    ).rejects.toBeInstanceOf(Error);
  });
});
