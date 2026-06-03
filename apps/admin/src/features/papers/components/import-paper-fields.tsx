import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@kichulbot/ui/components/ui/field';
import { Input } from '@kichulbot/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/ui/select';

import type { Exam } from '@/shared/types';

import type { ImportPaperValues } from '../types';
import { ImportPaperNumberField } from './import-paper-number-field';

export function ImportPaperFields({
  values,
  exams,
  selectedExam,
  onChange,
  onQuestionPdfChange,
  onAnswerPdfChange,
}: {
  values: ImportPaperValues;
  exams: Exam[];
  selectedExam?: Exam;
  onChange: (values: ImportPaperValues) => void;
  onQuestionPdfChange: (file: File | null) => void;
  onAnswerPdfChange: (file: File | null) => void;
}) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel>문제지 제목</FieldLabel>
        <Input
          value={values.title}
          placeholder="78회 한국사 심화"
          onChange={(event) =>
            onChange({ ...values, title: event.target.value })
          }
        />
      </Field>
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <ImportPaperNumberField
          label="시행 연도"
          value={values.year}
          onChange={(year) =>
            onChange({ ...values, year: year ?? values.year })
          }
        />
        <ImportPaperNumberField
          label="문항 수"
          value={values.questionCount}
          onChange={(questionCount) =>
            onChange({
              ...values,
              questionCount: questionCount ?? values.questionCount,
            })
          }
        />
      </div>
      <Field>
        <FieldLabel>시험</FieldLabel>
        <Select
          value={values.examId}
          onValueChange={(examId) => onChange({ ...values, examId })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="시험 선택" />
          </SelectTrigger>
          <SelectContent>
            {exams.map((exam) => (
              <SelectItem key={exam.id} value={exam.id}>
                {exam.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {selectedExam?.usesMonth && (
        <ImportPaperNumberField
          label="시행 월"
          value={values.month}
          onChange={(month) => onChange({ ...values, month })}
        />
      )}
      {selectedExam?.usesGrade && (
        <ImportPaperNumberField
          label="대상 학년"
          value={values.grade}
          onChange={(grade) => onChange({ ...values, grade })}
        />
      )}
      {selectedExam?.usesRound && (
        <ImportPaperNumberField
          label="시험 회차"
          value={values.round}
          onChange={(round) => onChange({ ...values, round })}
        />
      )}
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <Field>
          <FieldLabel>문제지 형식</FieldLabel>
          <Select
            value={values.layout}
            onValueChange={(layout) => onChange({ ...values, layout })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="korean-history">한능검 심화</SelectItem>
              <SelectItem value="csat">수능 2단형</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>홀짝</FieldLabel>
          <Select
            value={values.variant}
            onValueChange={(variant) => onChange({ ...values, variant })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="odd">홀수형</SelectItem>
              <SelectItem value="even">짝수형</SelectItem>
              <SelectItem value="both">둘 다</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field>
        <FieldLabel>문제 PDF</FieldLabel>
        <Input
          type="file"
          accept="application/pdf"
          onChange={(event) =>
            onQuestionPdfChange(event.target.files?.[0] ?? null)
          }
        />
      </Field>
      <Field>
        <FieldLabel>답지 PDF</FieldLabel>
        <Input
          type="file"
          accept="application/pdf"
          onChange={(event) =>
            onAnswerPdfChange(event.target.files?.[0] ?? null)
          }
        />
      </Field>
    </FieldGroup>
  );
}
