import { FieldGroup } from '@kichulbot/ui/components/ui/field';
import type { Control } from 'react-hook-form';

import {
  FileField,
  NumberField,
  SelectField,
  TextField,
} from '@/shared/components/form-fields';
import type { Exam } from '@/shared/types';

import type { ImportPaperValues } from '../types';

interface ImportPaperFieldsProps {
  control: Control<ImportPaperValues>;
  exams: Exam[];
  selectedExam?: Exam;
}

export function ImportPaperFields({
  control,
  exams,
  selectedExam,
}: ImportPaperFieldsProps) {
  return (
    <FieldGroup>
      <TextField
        control={control}
        name="title"
        label="문제지 제목"
        placeholder="78회 한국사 심화"
      />
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <NumberField control={control} name="year" label="시행 연도" />
        <NumberField control={control} name="questionCount" label="문항 수" />
      </div>
      <SelectField
        control={control}
        name="examId"
        label="시험"
        placeholder="시험 선택"
        items={exams.map((exam) => ({
          value: exam.id,
          label: exam.name,
        }))}
      />
      {selectedExam?.usesMonth && (
        <NumberField control={control} name="month" label="시행 월" />
      )}
      {selectedExam?.usesGrade && (
        <NumberField control={control} name="grade" label="대상 학년" />
      )}
      {selectedExam?.usesRound && (
        <NumberField control={control} name="round" label="시험 회차" />
      )}
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <SelectField
          control={control}
          name="layout"
          label="문제지 형식"
          items={[
            { value: 'korean-history', label: '한능검 심화' },
            { value: 'csat', label: '수능 2단형' },
          ]}
        />
        <SelectField
          control={control}
          name="variant"
          label="홀짝"
          items={[
            { value: 'odd', label: '홀수형' },
            { value: 'even', label: '짝수형' },
            { value: 'both', label: '둘 다' },
          ]}
        />
      </div>
      <FileField
        control={control}
        name="questionPdf"
        label="문제 PDF"
        accept="application/pdf"
      />
      <FileField
        control={control}
        name="answerPdf"
        label="답지 PDF"
        accept="application/pdf"
      />
    </FieldGroup>
  );
}
