'use client';

import { Button } from '@kichulbot/ui/components/button';
import { Input } from '@kichulbot/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/select';
import { Search, X } from 'lucide-react';
import { parseAsString, useQueryStates } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import type { Category, Exam } from '@/features/exams/types';

const filterParsers = {
  q: parseAsString.withDefault(''),
  categoryId: parseAsString.withDefault(''),
  examId: parseAsString.withDefault(''),
};

const ALL_OPTION_VALUE = 'all';

interface ResourceSearchControlsProps {
  categories: Category[];
  exams: Exam[];
}

export function ResourceSearchControls({
  categories,
  exams,
}: ResourceSearchControlsProps) {
  const [filters, setFilters] = useQueryStates(filterParsers, {
    history: 'push',
    shallow: false,
  });
  const [draftQuery, setDraftQuery] = useState(filters.q);

  useEffect(() => {
    setDraftQuery(filters.q);
  }, [filters.q]);

  const visibleExams = useMemo(() => {
    if (!filters.categoryId) return exams;
    return exams.filter((exam) =>
      exam.categories.some((category) => category.id === filters.categoryId),
    );
  }, [exams, filters.categoryId]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void setFilters({ q: draftQuery.trim() || null });
  }

  function updateCategory(categoryId: string) {
    void setFilters({
      categoryId: categoryId || null,
      examId: null,
    });
  }

  function updateExam(examId: string) {
    void setFilters({ examId: examId || null });
  }

  function clearFilters() {
    setDraftQuery('');
    void setFilters({ q: null, categoryId: null, examId: null });
  }

  return (
    <div
      className="
        grid gap-3 p-3
        sm:grid-cols-[1fr_auto_auto] sm:items-center
      "
    >
      <form onSubmit={submitSearch} className="flex min-w-0 gap-2">
        <Input
          type="search"
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
          placeholder="시험지명 또는 시험명 검색"
          className="h-10 "
        />
        <Button type="submit" size="icon" aria-label="검색">
          <Search className="size-4" />
        </Button>
      </form>

      <div
        className="
          grid grid-cols-2 gap-2
          sm:flex sm:items-center
        "
      >
        <Select
          value={filters.categoryId || ALL_OPTION_VALUE}
          onValueChange={(value) =>
            updateCategory(value === ALL_OPTION_VALUE ? '' : value)
          }
        >
          <SelectTrigger aria-label="분류 선택" className="h-10  sm:w-36">
            <SelectValue placeholder="전체 분류" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPTION_VALUE}>전체 분류</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.examId || ALL_OPTION_VALUE}
          onValueChange={(value) =>
            updateExam(value === ALL_OPTION_VALUE ? '' : value)
          }
        >
          <SelectTrigger aria-label="시험 선택" className="h-10 sm:w-40">
            <SelectValue placeholder="전체 시험" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPTION_VALUE}>전체 시험</SelectItem>
            {visibleExams.map((exam) => (
              <SelectItem key={exam.id} value={exam.id}>
                {exam.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={clearFilters}
        className="h-10"
      >
        <X className="size-4" />
        초기화
      </Button>
    </div>
  );
}
