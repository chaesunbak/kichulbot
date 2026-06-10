import type { PixelCrop } from 'react-image-crop';

const CROPPED_IMAGE_TYPE = 'image/webp';
const CROPPED_IMAGE_EXTENSION = 'webp';
const CROPPED_IMAGE_QUALITY = 0.92;

export async function createCroppedImageFile({
  image,
  crop,
  fileName,
}: {
  image: HTMLImageElement;
  crop: PixelCrop;
  fileName: string;
}) {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const cropWidth = Math.max(1, Math.round(crop.width * scaleX));
  const cropHeight = Math.max(1, Math.round(crop.height * scaleY));

  canvas.width = cropWidth;
  canvas.height = cropHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('이미지를 자를 수 없습니다.');
  }

  context.drawImage(
    image,
    Math.round(crop.x * scaleX),
    Math.round(crop.y * scaleY),
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob(
        (nextBlob) => {
          if (!nextBlob) {
            reject(new Error('잘라낸 이미지를 만들지 못했습니다.'));
            return;
          }
          resolve(nextBlob);
        },
        CROPPED_IMAGE_TYPE,
        CROPPED_IMAGE_QUALITY,
      );
    } catch (error) {
      reject(error);
    }
  });

  return new File([blob], toCroppedFileName(fileName), {
    type: CROPPED_IMAGE_TYPE,
  });
}

function toCroppedFileName(fileName: string) {
  const normalizedFileName = fileName.trim() || 'question-image';
  const extensionIndex = normalizedFileName.lastIndexOf('.');
  const name =
    extensionIndex > 0
      ? normalizedFileName.slice(0, extensionIndex)
      : normalizedFileName;

  return `${name}-cropped.${CROPPED_IMAGE_EXTENSION}`;
}
