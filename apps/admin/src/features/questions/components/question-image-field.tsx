import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@kichulbot/ui/components/field';
import { Input } from '@kichulbot/ui/components/input';
import { Upload } from 'lucide-react';
import type * as React from 'react';

import { cn } from '@/shared/lib/utils';

interface QuestionImageFieldProps {
  existingImageUrl?: string | null;
  image: File | null;
  inputKey: number;
  isDragging: boolean;
  previewUrl: string | null;
  setIsDragging: (isDragging: boolean) => void;
  select: (image: File) => void;
  reset: () => void;
}

export function QuestionImageField({
  existingImageUrl,
  inputKey,
  isDragging,
  previewUrl,
  setIsDragging,
  select,
  reset,
}: QuestionImageFieldProps) {
  function change(event: React.ChangeEvent<HTMLInputElement>) {
    const image = event.target.files?.[0];
    if (image) select(image);
    else reset();
  }
  function drop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    const image = event.dataTransfer.files[0];
    if (image) select(image);
  }
  return (
    <Field>
      <FieldLabel htmlFor="question-image">문제 이미지</FieldLabel>
      <Input
        key={inputKey}
        id="question-image"
        className="sr-only"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={change}
      />
      <label
        className={cn(
          `
            flex min-h-44 cursor-pointer flex-col items-center justify-center
            gap-2 overflow-hidden rounded-md border border-dashed bg-muted/30
            p-4 text-center text-sm text-muted-foreground transition-colors
            hover:border-primary/60 hover:bg-primary/5
          `,
          isDragging && 'border-primary bg-primary/10 text-foreground',
        )}
        htmlFor="question-image"
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !event.currentTarget.contains(event.relatedTarget)
          )
            setIsDragging(false);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={drop}
      >
        {previewUrl || existingImageUrl ? (
          <>
            <img
              className="max-h-64 w-full object-contain"
              src={previewUrl ?? existingImageUrl ?? ''}
              alt="문제 이미지 미리보기"
            />
            <span>이미지를 바꾸려면 클릭하거나 새 파일을 놓아주세요.</span>
          </>
        ) : (
          <>
            <Upload className="size-6" />
            <span>이미지를 끌어다 놓거나 클릭해서 선택해 주세요.</span>
          </>
        )}
      </label>
      <FieldDescription>
        {existingImageUrl
          ? '새 이미지를 선택하면 기존 이미지를 교체합니다.'
          : 'png, jpg, jpeg, webp 형식의 5MB 이하 이미지를 업로드해 주세요.'}
      </FieldDescription>
    </Field>
  );
}
