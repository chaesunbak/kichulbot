import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { Exam } from '@/shared/types';

import { useCreatePaperImportDraftMutation } from '../mutations';
import { importPaperSchema } from '../schemas';
import type { ImportPaperValues } from '../types';
import { ImportPaperFields } from './import-paper-fields';

const importPaperDefaults: ImportPaperValues = {
  title: '',
  year: new Date().getFullYear(),
  examId: '',
  questionCount: 50,
  isPublished: false,
  layout: 'korean-history',
  variant: 'odd',
  questionPdf: null,
  answerPdf: null,
};

export function ImportPaperForm({
  token,
  exams,
}: {
  token: string;
  exams: Exam[];
}) {
  const form = useForm<ImportPaperValues>({
    resolver: standardSchemaResolver(importPaperSchema),
    defaultValues: importPaperDefaults,
  });

  const values = useWatch({ control: form.control });
  const selectedExam = exams.find((exam) => exam.id === values.examId);
  const [fieldsResetKey, resetFields] = React.useReducer((key) => key + 1, 0);

  const draftMutation = useCreatePaperImportDraftMutation({ token });

  const disabled = draftMutation.isPending || !selectedExam;

  const loading = draftMutation.isPending;
  const submit = form.handleSubmit((submitValues) => {
    if (!selectedExam) {
      return;
    }

    draftMutation.mutate(
      {
        questionPdf: submitValues.questionPdf,
        answerPdf: submitValues.answerPdf,
        values: submitValues,
        exam: selectedExam,
        layout: submitValues.layout,
        variant: submitValues.variant,
      },
      {
        onSuccess: () => {
          form.reset(importPaperDefaults);
          resetFields();
        },
      },
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" />
          PDF로 문제지 생성
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={submit}>
          <ImportPaperFields
            key={fieldsResetKey}
            control={form.control}
            exams={exams}
            selectedExam={selectedExam}
          />

          <Button className="w-full" type="submit" disabled={disabled}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
            PDF 가져오기 작업 시작
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
