import type {
  AdminTagGroupResponse,
  AdminTagResponse,
} from '@kichulbot/api-contract/tags';
import {
  Field,
  FieldError,
  FieldLabel,
} from '@kichulbot/ui/components/ui/field';
import { Input } from '@kichulbot/ui/components/ui/input';
import { useEffect } from 'react';
import {
  type Control,
  Controller,
  useFieldArray,
  useWatch,
} from 'react-hook-form';

import type { ExamForm } from '@/features/reference-data/types';
import { NumberField, SelectField } from '@/shared/components/form-fields';

interface MockExamFieldsProps {
  tagGroups: AdminTagGroupResponse[];
  eraTags: AdminTagResponse[];
  control: Control<ExamForm>;
}

export function MockExamFields({
  tagGroups,
  eraTags,
  control,
}: MockExamFieldsProps) {
  const { fields } = useSyncMockExamBlueprintItems({ control, eraTags });

  return (
    <Field>
      <FieldLabel>모의고사 설정</FieldLabel>
      <div className="grid gap-3 rounded-md border p-3">
        <NumberField
          control={control}
          name="mockExamQuestionCount"
          label="총 문항수"
          min={1}
          max={100}
          placeholder="20"
        />
        <SelectField
          control={control}
          name="eraTagGroupId"
          label="시대 태그 그룹"
          placeholder="태그 그룹 선택"
          emptyOption={{ value: 'none', label: '설정 안 함' }}
          items={tagGroups.map((tagGroup) => ({
            value: tagGroup.id,
            label: tagGroup.name,
          }))}
        />
        <div className="grid gap-2">
          <div className="grid grid-cols-[1fr_5rem_5rem] gap-2 text-xs text-muted-foreground">
            <span>태그</span>
            <span>최소</span>
            <span>최대</span>
          </div>
          {fields.map((field, index) => {
            const tag = eraTags.find((item) => item.id === field.tagId);
            if (!tag) return null;

            return (
              <div
                key={field.id}
                className="grid grid-cols-[1fr_5rem_5rem] items-start gap-2"
              >
                <span className="pt-2 text-sm">{tag.name}</span>
                <BlueprintCountField
                  control={control}
                  name={`mockExamBlueprintItems.${index}.minQuestionCount`}
                  label={`${tag.name} 최소 문항수`}
                />
                <BlueprintCountField
                  control={control}
                  name={`mockExamBlueprintItems.${index}.maxQuestionCount`}
                  label={`${tag.name} 최대 문항수`}
                />
              </div>
            );
          })}
          {eraTags.length === 0 && (
            <p className="text-sm text-muted-foreground">
              시대 태그 그룹을 선택하면 태그별 출제 범위를 입력할 수 있습니다.
            </p>
          )}
        </div>
      </div>
    </Field>
  );
}

function useSyncMockExamBlueprintItems({
  control,
  eraTags,
}: {
  control: Control<ExamForm>;
  eraTags: AdminTagResponse[];
}) {
  const { fields, replace } = useFieldArray({
    control,
    name: 'mockExamBlueprintItems',
  });
  const blueprintItems =
    useWatch({ control, name: 'mockExamBlueprintItems' }) ?? [];

  useEffect(() => {
    const nextItems = eraTags.map((tag, index) => {
      const item = blueprintItems.find((value) => value.tagId === tag.id);

      return {
        tagId: tag.id,
        minQuestionCount: item?.minQuestionCount ?? 0,
        maxQuestionCount: item?.maxQuestionCount ?? 0,
        sortOrder: index,
      };
    });
    const isSame =
      blueprintItems.length === nextItems.length &&
      nextItems.every((item, index) => {
        const currentItem = blueprintItems[index];
        return (
          currentItem?.tagId === item.tagId &&
          currentItem.minQuestionCount === item.minQuestionCount &&
          currentItem.maxQuestionCount === item.maxQuestionCount &&
          currentItem.sortOrder === item.sortOrder
        );
      });

    if (!isSame) replace(nextItems);
  }, [blueprintItems, eraTags, replace]);

  return { fields };
}

function BlueprintCountField({
  control,
  name,
  label,
}: {
  control: Control<ExamForm>;
  name:
    | `mockExamBlueprintItems.${number}.minQuestionCount`
    | `mockExamBlueprintItems.${number}.maxQuestionCount`;
  label: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className="gap-1">
          <Input
            id={field.name}
            name={field.name}
            type="number"
            min={0}
            max={100}
            value={field.value ?? ''}
            onBlur={field.onBlur}
            ref={field.ref}
            aria-label={label}
            aria-invalid={fieldState.invalid}
            onChange={(event) =>
              field.onChange(Number(event.target.value || 0))
            }
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
