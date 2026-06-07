'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import Link from 'next/link';
import posthog from 'posthog-js';
import type { ComponentProps, ReactNode } from 'react';

interface KakaoAuthButtonProps {
  href: string;
  children: ReactNode;
}

export function KakaoAuthButton({ href, children }: KakaoAuthButtonProps) {
  return (
    <Button
      asChild
      className="
        w-full bg-[#FEE500] text-[#181600]
        hover:bg-[#FADA0A]
      "
    >
      <Link href={href} onClick={() => posthog.capture('kakao_login_clicked')}>
        <KakaoIcon className="size-4" data-icon="inline-start" />
        {children}
      </Link>
    </Button>
  );
}

function KakaoIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 18 17"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M9 0C4.03 0 0 3.13 0 7c0 2.48 1.66 4.66 4.16 5.89l-.84 3.08c-.08.3.26.54.52.37l3.68-2.44c.47.06.96.1 1.48.1 4.97 0 9-3.13 9-7S13.97 0 9 0Z" />
    </svg>
  );
}
