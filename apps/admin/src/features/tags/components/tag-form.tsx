import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Badge } from '@kichulbot/ui/components/ui/badge';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import {
  Field,
  FieldError,
  FieldLabel,
} from '@kichulbot/ui/components/ui/field';
import { Input } from '@kichulbot/ui/components/ui/input';
import { Plus, X } from 'lucide-react';
import { forwardRef, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import {
  NumberField,
  SelectField,
  TextField,
} from '@/shared/components/form-fields';
import type { AdminTag,AdminTagGroup } from '@/shared/types';
import { type Taxonomy } from '@/shared/types';

import { getTagFormValues, uniqueKeywords } from '../lib/form-values';
import { tagFormSchema } from '../schemas';
import type { TagForm } from '../types';

export interface TagFormPanelProps {
  selectedExam: Taxonomy | null;
  tagGroups: AdminTagGroup[];
  editingTag: AdminTag | null;
  isSubmitting: boolean;
  onSubmit: (values: TagForm) => void;
  onCancel: () => void;
}

export function TagFormPanel({
  selectedExam,
  tagGroups,
  editingTag,
  isSubmitting,
  onSubmit,
  onCancel,
}: TagFormPanelProps) {
  const form = useForm<TagForm>({
    resolver: standardSchemaResolver(tagFormSchema),
    defaultValues: getTagFormValues(editingTag, selectedExam?.id ?? ''),
  });
  const { reset } = form;

  useEffect(() => {
    reset(getTagFormValues(editingTag, selectedExam?.id ?? ''));
  }, [editingTag, reset, selectedExam?.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="size-4" aria-hidden="true" />
          {editingTag ? '태그 수정' : '태그 추가'}
        </CardTitle>
        <CardDescription>
          {selectedExam
            ? `${selectedExam.name} 문항 편집에 노출할 태그를 관리합니다.`
            : '태그를 추가하려면 먼저 시험을 선택해 주세요.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <TextField
            control={form.control}
            name="name"
            label="태그 이름"
            placeholder="조선"
          />
          <Controller
            name="keywords"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>추천 키워드</FieldLabel>
                <KeywordInput
                  id={field.name}
                  keywords={field.value}
                  aria-invalid={fieldState.invalid}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  onChange={field.onChange}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <SelectField
            control={form.control}
            name="tagGroupId"
            label="태그 그룹"
            placeholder="그룹 선택"
            emptyOption={{ value: 'none', label: '그룹 없음' }}
            items={tagGroups.map((tagGroup) => ({
              value: tagGroup.id,
              label: tagGroup.name,
            }))}
            disabled={!selectedExam}
          />
          <NumberField
            control={form.control}
            name="sortOrder"
            label="정렬 순서"
            min={0}
            emptyValue={0}
          />
          <div className="flex gap-2">
            {editingTag && (
              <Button type="button" variant="outline" onClick={onCancel}>
                취소
              </Button>
            )}
            <Button className="flex-1" type="submit" disabled={isSubmitting}>
              {editingTag ? '수정 저장' : '태그 추가'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface KeywordInputProps {
  id: string;
  keywords: string[];
  'aria-invalid'?: boolean;
  onBlur: () => void;
  onChange: (keywords: string[]) => void;
}

const KeywordInput = forwardRef<HTMLInputElement, KeywordInputProps>(
  function KeywordInput(
    { id, keywords, 'aria-invalid': ariaInvalid, onBlur, onChange },
    ref,
  ) {
    const [draftKeyword, setDraftKeyword] = useState('');

    function addKeyword() {
      const keyword = draftKeyword.trim();
      if (!keyword) return;
      onChange(uniqueKeywords([...keywords, keyword]));
      setDraftKeyword('');
    }

    function removeKeyword(keyword: string) {
      onChange(keywords.filter((item) => item !== keyword));
    }

    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            id={id}
            value={draftKeyword}
            aria-invalid={ariaInvalid}
            placeholder="광종"
            onBlur={onBlur}
            ref={ref}
            onChange={(event) => setDraftKeyword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              event.preventDefault();
              addKeyword();
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="추천 키워드 추가"
            onClick={addKeyword}
          >
            <Plus className="size-4" />
          </Button>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="h-7 gap-1">
                {keyword}
                <button
                  type="button"
                  className="rounded-sm text-muted-foreground hover:text-foreground"
                  aria-label={`${keyword} 키워드 제거`}
                  onClick={() => removeKeyword(keyword)}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  },
);
