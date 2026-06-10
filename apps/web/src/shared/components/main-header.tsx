import Link from 'next/link';

import { DesktopNavigation } from '@/shared/components/main-navigation';

interface Props {
  isAuthenticated: boolean;
}

export default function MainHeader({ isAuthenticated }: Props) {
  return (
    <header
      className="
        sticky top-0 z-40 hidden bg-card/75 px-4 backdrop-blur-sm
        md:block
      "
    >
      <div
        className="
          mx-auto flex h-16 max-w-5xl items-center justify-between gap-6
        "
      >
        <Link href="/" className="shrink-0 text-lg font-bold text-foreground">
          기출봇
        </Link>
        <DesktopNavigation />
        {isAuthenticated ? (
          <Link
            href="/my"
            aria-label="마이페이지"
            className="
              flex shrink-0 items-center gap-2 text-sm font-medium
              text-muted-foreground
              transition-colors
              hover:text-foreground
            "
          >
            <span
              className="
                hidden
                lg:inline
              "
            >
              내 계정
            </span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="
              shrink-0 text-sm font-medium text-muted-foreground
              transition-colors
              hover:text-foreground
            "
          >
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
