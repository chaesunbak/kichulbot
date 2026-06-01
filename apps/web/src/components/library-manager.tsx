'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@kichulbot/ui/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/select';
import {
  BookshelfGrid,
  BookshelfSection,
} from '@/components/bookshelf-section';
import { PaperCoverCard } from '@/components/paper-cover-card';
import type { Bookshelf } from '@/lib/learning.types';

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
    const response = await fetch('/api/me/paper-lists', {
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
    const response = await fetch(`/api/me/paper-lists/${selected.id}`, {
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
    const response = await fetch(`/api/me/paper-lists/${selected.id}`, {
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
      <div className="mt-7 flex flex-wrap items-center gap-2">
        {bookshelves.length > 0 && (
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger aria-label="책장 선택" className="min-w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {bookshelves.map((bookshelf) => (
                <SelectItem key={bookshelf.id} value={bookshelf.id}>
                  {bookshelf.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <p className="mt-6 rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm ">
          책장이 없습니다. 새 책장을 만들어 문제지를 정리해 보세요.
        </p>
      ) : selected.papers.length === 0 ? (
        <section className="mt-5 rounded-3xl border px-4 py-10 text-center ">
          <h2 className="mt-3 font-semibold text-zinc-800">{selected.name}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            이 책장에 추가한 문제지가 없습니다.
          </p>
        </section>
      ) : (
        <BookshelfSection
          title={selected.name}
          countLabel={`${selected.papers.length}권`}
        >
          <BookshelfGrid>
            {selected.papers.map(({ paper }) => (
              <li key={paper.id} className="min-w-0 px-1 pb-5">
                <Link
                  href={`/library/${selected.id}/papers/${paper.id}`}
                  className="block min-w-0 rounded-lg"
                  aria-label={`${paper.title} 자세히 보기`}
                >
                  <PaperCoverCard paper={paper} />
                </Link>
              </li>
            ))}
          </BookshelfGrid>
        </BookshelfSection>
      )}
    </>
  );
}
