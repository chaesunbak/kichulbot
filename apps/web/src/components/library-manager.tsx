'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import {
  NativeSelect,
  NativeSelectOption,
} from '@kichulbot/ui/components/native-select';
import type { Bookshelf } from '@/lib/learning';

export function LibraryManager({
  initialBookshelves,
}: {
  initialBookshelves: Bookshelf[];
}) {
  const [bookshelves, setBookshelves] = useState(initialBookshelves);
  const [selectedId, setSelectedId] = useState(initialBookshelves[0]?.id ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const selected = bookshelves.find((bookshelf) => bookshelf.id === selectedId);

  const createBookshelf = async () => {
    const name = window.prompt('새 책장 이름을 입력해 주세요.');
    if (!name?.trim()) return;
    const response = await fetch('/api/library/bookshelves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) return setMessage('책장을 만들지 못했습니다.');
    const body = (await response.json()) as { bookshelf: Bookshelf };
    setBookshelves((current) => [...current, body.bookshelf]);
    setSelectedId(body.bookshelf.id);
    setMessage('새 책장을 만들었습니다.');
  };

  const renameBookshelf = async () => {
    if (!selected) return;
    const name = window.prompt(
      '변경할 책장 이름을 입력해 주세요.',
      selected.name,
    );
    if (!name?.trim() || name.trim() === selected.name) return;
    const response = await fetch(`/api/library/bookshelves/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) return setMessage('책장 이름을 바꾸지 못했습니다.');
    const body = (await response.json()) as { bookshelf: Bookshelf };
    setBookshelves((current) =>
      current.map((bookshelf) =>
        bookshelf.id === body.bookshelf.id ? body.bookshelf : bookshelf,
      ),
    );
    setMessage('책장 이름을 바꿨습니다.');
  };

  const deleteBookshelf = async () => {
    if (!selected) return;
    if (!window.confirm(`"${selected.name}" 책장을 삭제할까요?`)) return;
    const response = await fetch(`/api/library/bookshelves/${selected.id}`, {
      method: 'DELETE',
    });
    if (!response.ok) return setMessage('책장을 삭제하지 못했습니다.');
    const next = bookshelves.filter(
      (bookshelf) => bookshelf.id !== selected.id,
    );
    setBookshelves(next);
    setSelectedId(next[0]?.id ?? '');
    setMessage('책장을 삭제했습니다.');
  };

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {bookshelves.length > 0 && (
          <NativeSelect
            className="min-w-52"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            aria-label="책장 선택"
          >
            {bookshelves.map((bookshelf) => (
              <NativeSelectOption key={bookshelf.id} value={bookshelf.id}>
                {bookshelf.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={createBookshelf}
        >
          <Plus />새 책장
        </Button>
        {selected && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={renameBookshelf}
            >
              <Pencil />
              이름 변경
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={deleteBookshelf}
            >
              <Trash2 />
              삭제
            </Button>
          </>
        )}
      </div>
      {message && <p className="mt-3 text-sm text-zinc-500">{message}</p>}
      {!selected ? (
        <p className="mt-6 text-sm text-zinc-500">
          책장이 없습니다. 새 책장을 만들어 문제지를 정리해 보세요.
        </p>
      ) : selected.papers.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          이 책장에 추가한 문제지가 없습니다.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {selected.papers.map(({ paper }) => (
            <li key={paper.id}>
              <Link
                href={`/library/${selected.id}/papers/${paper.id}`}
                className="block"
              >
                <Card className="transition hover:bg-zinc-50">
                  <CardHeader>
                    <CardTitle>{paper.title}</CardTitle>
                    <CardDescription>
                      {paper.exam.name} · {paper.subject.name} · {paper.year}
                      학년도 · {paper.questionCount}문항
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
