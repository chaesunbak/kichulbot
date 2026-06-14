import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kichulbot/ui/components/ui/dialog';
import { RotateCcw, Scissors } from 'lucide-react';
import { type SyntheticEvent, useEffect, useRef, useState } from 'react';
import ReactCrop, {
  convertToPixelCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop';
import { toast } from 'sonner';

import { createCroppedImageFile } from '../lib/crop-image';

const FULL_IMAGE_CROP: Crop = {
  unit: '%',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

interface QuestionImageCropDialogProps {
  imageUrl: string;
  fileName: string;
  isOpen: boolean;
  onApply: (file: File) => void;
  onClose: () => void;
  onExit: () => void;
}

export function QuestionImageCropDialog({
  imageUrl,
  fileName,
  isOpen,
  onApply,
  onClose,
  onExit,
}: QuestionImageCropDialogProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>(FULL_IMAGE_CROP);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (isOpen) return;

    const timeoutId = window.setTimeout(onExit, 120);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, onExit]);

  useEffect(() => {
    if (!isOpen) return;

    setCrop(FULL_IMAGE_CROP);
    setCompletedCrop(null);
  }, [imageUrl, isOpen]);

  function resetCrop() {
    const image = imageRef.current;
    setCrop(FULL_IMAGE_CROP);
    if (!image) return;

    setCompletedCrop(
      convertToPixelCrop(FULL_IMAGE_CROP, image.width, image.height),
    );
  }

  function loadImage(event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    imageRef.current = image;
    setCrop(FULL_IMAGE_CROP);
    setCompletedCrop(
      convertToPixelCrop(FULL_IMAGE_CROP, image.width, image.height),
    );
  }

  async function applyCrop() {
    const image = imageRef.current;
    const nextCrop = completedCrop;
    if (!image || !nextCrop?.width || !nextCrop.height) {
      toast.error('자를 영역을 선택해 주세요.');
      return;
    }

    setIsApplying(true);
    try {
      const file = await createCroppedImageFile({
        image,
        crop: nextCrop,
        fileName,
      });
      onApply(file);
      onClose();
    } catch {
      toast.error(
        '이미지를 자르지 못했습니다. 이미지 도메인의 CORS 허용 오리진을 확인해 주세요.',
      );
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-6xl gap-4 overflow-hidden rounded-md shadow-none">
        <DialogHeader>
          <DialogTitle>문제 이미지 자르기</DialogTitle>
          <DialogDescription>
            저장 전에 사용할 영역을 선택합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-auto rounded-md border bg-muted/20 p-2">
          <ReactCrop
            crop={crop}
            keepSelection
            minHeight={24}
            minWidth={24}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(nextCrop) => setCompletedCrop(nextCrop)}
          >
            <img
              className="max-h-[68vh] max-w-full object-contain"
              crossOrigin="anonymous"
              src={imageUrl}
              alt="자를 문제 이미지"
              onLoad={loadImage}
            />
          </ReactCrop>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isApplying}
            onClick={resetCrop}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            초기화
          </Button>
          <Button type="button" disabled={isApplying} onClick={applyCrop}>
            <Scissors className="size-4" aria-hidden="true" />
            {isApplying ? '적용 중' : '적용'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
