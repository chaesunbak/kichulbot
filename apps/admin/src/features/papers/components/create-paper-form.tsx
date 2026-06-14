import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { FieldGroup } from '@kichulbot/ui/components/ui/field';
import { Plus } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';

import {
  NumberField,
  SelectField,
  TextField,
} from '@/shared/components/form-fields';
import type { Exam } from '@/shared/types';

import { useCreatePaperMutation } from '../queries/mutations';
import { paperSchema } from '../schemas';
import type { PaperValues } from '../types';

const defaults: PaperValues = {
  title: '',
  year: new Date().getFullYear(),
  month: null,
  grade: null,
  round: null,
  examId: '',
  questionCount: 20,
  isPublished: 'false',
};

export function CreatePaperForm({
  token,
  exams,
}: {
  token: string;
  exams: Exam[];
}) {
  const form = useForm<PaperValues>({
    resolver: standardSchemaResolver(paperSchema),
    defaultValues: defaults,
  });
  const mutation = useCreatePaperMutation(token);
  const examId = useWatch({ control: form.control, name: 'examId' });
  const selectedExam = exams.find((exam) => exam.id === examId);
  const submit = form.handleSubmit((values) => {
    if (!selectedExam) return;
    mutation.mutate(
      { values, exam: selectedExam },
      {
        onSuccess: () =>
          form.reset({
            ...defaults,
            year: values.year,
            examId: values.examId,
          }),
      },
    );
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="size-4" />
          문제지 등록
        </CardTitle>
        <CardDescription>
          시험 종류에 맞는 시행 정보와 문항 수를 저장합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={submit}>
          <FieldGroup>
            <TextField
              control={form.control}
              name="title"
              label="문제지 제목"
              placeholder="2025학년도 수능 한국사"
            />
            <div
              className="
                grid gap-4
                sm:grid-cols-2
              "
            >
              <NumberField
                control={form.control}
                name="year"
                label="시행 연도"
              />
              <NumberField
                control={form.control}
                name="questionCount"
                label="문항 수"
              />
            </div>
            <SelectField
              control={form.control}
              name="examId"
              label="시험"
              placeholder="시험 선택"
              items={exams.map((exam) => ({
                value: exam.id,
                label: exam.name,
              }))}
            />
            {selectedExam?.usesMonth && (
              <NumberField
                control={form.control}
                name="month"
                label="시행 월"
                placeholder="3"
                required
              />
            )}
            {selectedExam?.usesGrade && (
              <NumberField
                control={form.control}
                name="grade"
                label="대상 학년"
                placeholder="1"
                required
              />
            )}
            {selectedExam?.usesRound && (
              <NumberField
                control={form.control}
                name="round"
                label="시험 회차"
                placeholder="75"
                required
              />
            )}
            <SelectField
              control={form.control}
              name="isPublished"
              label="공개 상태"
              description="공개 문제지는 사용자 목록에 노출됩니다."
              items={[
                { value: 'false', label: '비공개' },
                { value: 'true', label: '공개' },
              ]}
            />
          </FieldGroup>
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            <Plus className="size-4" />
            문제지 생성
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
