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
import { useNavigate } from 'react-router';

import type { Exam } from '@/shared/types';

import {
  useCreatePaperImportDraftMutation,
  useCreatePaperWithQuestionsMutation,
} from '../mutations';
import { importPaperSchema } from '../schemas';
import type { ImportPaperQuestionValues, ImportPaperValues } from '../types';
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
  const navigate = useNavigate();
  const form = useForm<ImportPaperValues>({
    resolver: standardSchemaResolver(importPaperSchema),
    defaultValues: importPaperDefaults,
  });

  const values = useWatch({ control: form.control });
  const selectedExam = exams.find((exam) => exam.id === values.examId);

  const createMutation = useCreatePaperWithQuestionsMutation({
    token,
    onSuccess: (paperId) => navigate(`/papers/${paperId}`),
  });

  const draftMutation = useCreatePaperImportDraftMutation({
    token,
    onSuccess: (draft) => {
      if (!selectedExam) return;
      const currentValues = form.getValues();

      const nextValues: ImportPaperValues = {
        ...currentValues,
        title: currentValues.title || draft.paperSuggestion.title || '',
        questionCount:
          draft.paperSuggestion.questionCount || currentValues.questionCount,
        isPublished: false,
      };
      const nextQuestions: ImportPaperQuestionValues[] = draft.questions.map(
        (question) => ({
          ...question,
          excluded: false,
        }),
      );

      form.reset({
        ...nextValues,
        questionPdf: currentValues.questionPdf,
        answerPdf: currentValues.answerPdf,
      });
      createMutation.mutate({
        values: nextValues,
        exam: selectedExam,
        questions: nextQuestions,
      });
    },
  });

  const disabled =
    draftMutation.isPending || createMutation.isPending || !selectedExam;

  const loading = draftMutation.isPending || createMutation.isPending;
  const submit = form.handleSubmit((submitValues) =>
    draftMutation.mutate({
      questionPdf: submitValues.questionPdf,
      answerPdf: submitValues.answerPdf,
      layout: submitValues.layout,
      variant: submitValues.variant,
      examId: submitValues.examId,
    }),
  );

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
            PDF 추출 후 비공개 문제지 생성
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
