import * as React from 'react';
import { toast } from 'sonner';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export function useQuestionImage() {
  const [image, setImage] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [inputKey, setInputKey] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const reset = React.useCallback(() => {
    setImage(null);
    setIsDragging(false);
    setInputKey((key) => key + 1);
  }, []);

  const select = React.useCallback(
    (nextImage: File) => {
      if (!ACCEPTED_IMAGE_TYPES.has(nextImage.type)) {
        toast.error('png, jpg, jpeg, webp 이미지만 업로드할 수 있습니다.');
        reset();
        return;
      }
      if (nextImage.size > MAX_IMAGE_SIZE) {
        toast.error('이미지는 5MB 이하로 업로드해 주세요.');
        reset();
        return;
      }
      setImage(nextImage);
    },
    [reset],
  );

  return {
    image,
    previewUrl,
    inputKey,
    isDragging,
    setIsDragging,
    reset,
    select,
  };
}
