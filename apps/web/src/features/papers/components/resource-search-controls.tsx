'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import { Input } from '@kichulbot/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/ui/select';
import { Search, X } from 'lucide-react';
import { parseAsString, useQueryStates } from 'nuqs';
import posthog from 'posthog-js';
import type { SyntheticEvent } from 'react';
import { useMemo, useRef } from 'react';

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
  const queryInputRef = useRef<HTMLInputElement>(null);

  const visibleExams = useMemo(() => {
    if (!filters.categoryId) return exams;
    return exams.filter((exam) =>
      exam.categories.some((category) => category.id === filters.categoryId),
    );
  }, [exams, filters.categoryId]);

  function submitSearch(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get('q');
    const q = query?.toString().trim() || null;

    posthog.capture('resources_searched', {
      query: q,
      category_id: filters.categoryId || null,
      exam_id: filters.examId || null,
    });
    void setFilters({ q });
  }

  function updateCategory(categoryId: string) {
    const nextCategoryId = categoryId || null;
    posthog.capture('resources_searched', {
      query: filters.q || null,
      category_id: nextCategoryId,
      exam_id: null,
    });
    void setFilters({
      categoryId: nextCategoryId,
      examId: null,
    });
  }

  function updateExam(examId: string) {
    const nextExamId = examId || null;
    posthog.capture('resources_searched', {
      query: filters.q || null,
      category_id: filters.categoryId || null,
      exam_id: nextExamId,
    });
    void setFilters({ examId: nextExamId });
  }

  function clearFilters() {
    if (queryInputRef.current) {
      queryInputRef.current.value = '';
    }

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
          ref={queryInputRef}
          key={filters.q}
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="검색어를 입력해주세요"
          className="h-10"
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
          <SelectTrigger
            aria-label="분류 선택"
            className="
              h-10
              sm:w-36
            "
          >
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
          <SelectTrigger
            aria-label="시험 선택"
            className="
              h-10
              sm:w-40
            "
          >
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
