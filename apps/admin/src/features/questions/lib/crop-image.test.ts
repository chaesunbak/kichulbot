import type { PixelCrop } from 'react-image-crop';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCroppedImageFile } from './crop-image';

describe('createCroppedImageFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('선택한 영역을 원본 이미지 비율로 잘라 webp 파일로 만든다', async () => {
    const drawImage = vi.fn();
    const canvas = createCanvasMock({
      context: { drawImage },
      blob: new Blob(['cropped'], { type: 'image/webp' }),
    });
    vi.stubGlobal('document', {
      createElement: vi.fn(() => canvas),
    });

    const file = await createCroppedImageFile({
      image: {
        naturalWidth: 800,
        naturalHeight: 600,
        width: 400,
        height: 300,
      } as HTMLImageElement,
      crop: { x: 10, y: 20, width: 120, height: 80 } as PixelCrop,
      fileName: 'question.png',
    });

    expect(canvas.width).toBe(240);
    expect(canvas.height).toBe(160);
    expect(drawImage).toHaveBeenCalledWith(
      expect.anything(),
      20,
      40,
      240,
      160,
      0,
      0,
      240,
      160,
    );
    expect(canvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/webp',
      0.92,
    );
    expect(file.name).toBe('question-cropped.webp');
    expect(file.type).toBe('image/webp');
  });

  it('캔버스 컨텍스트를 만들 수 없으면 예외를 던진다', async () => {
    vi.stubGlobal('document', {
      createElement: vi.fn(() =>
        createCanvasMock({
          context: null,
          blob: new Blob(['cropped'], { type: 'image/webp' }),
        }),
      ),
    });

    await expect(
      createCroppedImageFile({
        image: {
          naturalWidth: 100,
          naturalHeight: 100,
          width: 100,
          height: 100,
        } as HTMLImageElement,
        crop: { x: 0, y: 0, width: 10, height: 10 } as PixelCrop,
        fileName: 'question.png',
      }),
    ).rejects.toThrow('이미지를 자를 수 없습니다.');
  });
});

function createCanvasMock({
  context,
  blob,
}: {
  context: Pick<CanvasRenderingContext2D, 'drawImage'> | null;
  blob: Blob | null;
}) {
  return {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
    toBlob: vi.fn((callback: BlobCallback) => {
      callback(blob);
    }),
  };
}
