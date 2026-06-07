import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthUser } from '@/features/auth/types';
import MainHeader from '@/shared/components/main-header';

const pathname = vi.hoisted(() => ({ value: '/' }));

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.value,
}));

beforeEach(() => {
  pathname.value = '/';
});

const user = {
  id: 'user-1',
  email: 'user@example.com',
  nickname: '홍길동',
  authType: 'EMAIL',
  linkedProviders: [],
  role: 'USER',
} satisfies AuthUser;

describe('MainHeader', () => {
  it('로그인하지 않은 사용자는 로그인 링크를 보여준다', () => {
    const html = renderToStaticMarkup(<MainHeader user={null} />);

    expect(html).toContain('기출봇');
    expect(html).toContain('href="/login"');
    expect(html).toContain('로그인');
  });

  it('로그인한 사용자는 마이페이지 링크와 계정 이름을 보여준다', () => {
    const html = renderToStaticMarkup(<MainHeader user={user} />);

    expect(html).toContain('href="/my"');
    expect(html).toContain('홍길동');
    expect(html).not.toContain('href="/login"');
  });

  it('닉네임이 없으면 이메일을 계정 이름으로 사용한다', () => {
    const html = renderToStaticMarkup(
      <MainHeader user={{ ...user, nickname: null }} />,
    );

    expect(html).toContain('user@example.com');
  });
});
