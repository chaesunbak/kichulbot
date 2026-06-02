import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { FileText, Sparkles } from 'lucide-react';
import * as React from 'react';
import { useNavigate } from 'react-router';

import type { Exam } from '@/shared/types';

import {
  useCreatePaperImportDraftMutation,
  useCreatePaperWithQuestionsMutation,
} from '../mutations';
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
};

export function ImportPaperForm({
  token,
  exams,
}: {
  token: string;
  exams: Exam[];
}) {
  const navigate = useNavigate();
  const [values, setValues] =
    React.useState<ImportPaperValues>(importPaperDefaults);
  const [questionPdf, setQuestionPdf] = React.useState<File | null>(null);
  const [answerPdf, setAnswerPdf] = React.useState<File | null>(null);
  const [warnings, setWarnings] = React.useState<string[]>([]);

  const selectedExam = exams.find((exam) => exam.id === values.examId);

  const createMutation = useCreatePaperWithQuestionsMutation({
    token,
    onSuccess: (paperId) => navigate(`/papers/${paperId}`),
  });

  const draftMutation = useCreatePaperImportDraftMutation({
    token,
    onSuccess: (draft) => {
      if (!selectedExam) return;

      const nextValues: ImportPaperValues = {
        ...values,
        title: values.title || draft.paperSuggestion.title || '',
        questionCount:
          draft.paperSuggestion.questionCount || values.questionCount,
        isPublished: false,
      };
      const nextQuestions: ImportPaperQuestionValues[] = draft.questions.map(
        (question) => ({
          ...question,
          excluded: false,
        }),
      );

      setWarnings(draft.warnings);
      setValues(nextValues);
      createMutation.mutate({
        values: nextValues,
        exam: selectedExam,
        questions: nextQuestions,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" />
          PDF로 문제지 생성
        </CardTitle>
        <CardDescription>
          PDF 추출 결과로 비공개 문제지를 만들고 상세 화면에서 검토합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ImportPaperFields
          values={values}
          exams={exams}
          selectedExam={selectedExam}
          onChange={setValues}
          onQuestionPdfChange={setQuestionPdf}
          onAnswerPdfChange={setAnswerPdf}
        />

        <Button
          className="w-full"
          type="button"
          disabled={
            draftMutation.isPending || createMutation.isPending || !selectedExam
          }
          onClick={() =>
            draftMutation.mutate({
              questionPdf,
              answerPdf,
              layout: values.layout,
              variant: values.variant,
            })
          }
        >
          <FileText className="size-4" />
          PDF 추출 후 비공개 문제지 생성
        </Button>

        {warnings.length > 0 && (
          <div className="
            rounded-md border border-amber-300 bg-amber-50 p-3 text-xs
            text-amber-900
          ">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          생성된 문제지는 비공개 상태로 열리며, 상세 화면에서 문항을 검토하고
          수정할 수 있습니다.
        </p>
      </CardContent>
    </Card>
  );
}
