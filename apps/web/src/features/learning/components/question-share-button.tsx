'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { Share2 } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

export function QuestionShareButton({
  href,
  compact = false,
}: {
  href: string;
  compact?: boolean;
}) {
  const copyShareLink = async () => {
    const url = new URL(href, window.location.origin).toString();

    try {
      await navigator.clipboard.writeText(url);
      toast.success('공유 링크를 복사했습니다.');
    } catch {
      toast.error('공유 링크를 복사하지 못했습니다.');
    }
  };

  return (
    <Button
      type="button"
      variant={compact ? 'ghost' : 'outline'}
      size="sm"
      className={cn(compact && 'size-9 px-0')}
      onClick={copyShareLink}
    >
      <Share2 />
      <span className={cn(compact && 'sr-only')}>공유</span>
    </Button>
  );
}
