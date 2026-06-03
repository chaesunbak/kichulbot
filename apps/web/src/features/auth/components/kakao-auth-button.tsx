import { Button } from '@kichulbot/ui/components/ui/button';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface KakaoAuthButtonProps {
  href: string;
  children: ReactNode;
}

export function KakaoAuthButton({ href, children }: KakaoAuthButtonProps) {
  return (
    <Button
      asChild
      className="
        w-full bg-[#FEE500] text-zinc-950
        hover:bg-[#FADA0A]
      "
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}
