import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MainHeader from '@/shared/components/main-header';

const pathname = vi.hoisted(() => ({ value: '/' }));

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.value,
}));

beforeEach(() => {
  pathname.value = '/';
});

describe('MainHeader', () => {
  it('로그인하지 않은 사용자는 로그인 링크를 보여준다', () => {
    const html = renderToStaticMarkup(<MainHeader isAuthenticated={false} />);

    expect(html).toContain('기출봇');
    expect(html).toContain('href="/login"');
    expect(html).toContain('로그인');
  });

  it('로그인한 사용자는 마이페이지 링크를 보여준다', () => {
    pathname.value = '/my';

    const html = renderToStaticMarkup(<MainHeader isAuthenticated />);

    expect(html).toContain('href="/my"');
    expect(html).toContain('내 계정');
    expect(html).not.toContain('href="/login"');
  });
});
