import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DesktopNavigation,
  MobileBottomNavigation,
} from '@/shared/components/main-navigation';

const pathname = vi.hoisted(() => ({ value: '/' }));

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.value,
}));

beforeEach(() => {
  pathname.value = '/';
});

describe('DesktopNavigation', () => {
  it('현재 경로의 상위 메뉴에 aria-current를 표시한다', () => {
    pathname.value = '/resources/paper-1';

    const html = renderToStaticMarkup(<DesktopNavigation />);

    expect(html).toContain('aria-label="주 메뉴"');
    expect(html).toContain('href="/resources"');
    expect(html).toContain('자료실');
    expect(html).toContain('aria-current="page"');
    expect(html).toMatch(
      /<a(?=[^>]+href="\/resources")(?=[^>]+aria-current="page")[^>]*>자료실<\/a>/,
    );
  });

  it('비슷한 접두어 경로는 활성 메뉴로 처리하지 않는다', () => {
    pathname.value = '/resources-extra';

    const html = renderToStaticMarkup(<DesktopNavigation />);

    expect(html).not.toMatch(
      /<a[^>]+href="\/resources"[^>]+aria-current="page"[^>]*>자료실<\/a>/,
    );
  });
});

describe('MobileBottomNavigation', () => {
  it('모바일 하단 메뉴를 모두 렌더링하고 현재 경로만 활성화한다', () => {
    pathname.value = '/library/folder-1';

    const html = renderToStaticMarkup(<MobileBottomNavigation />);

    expect(html).toContain('홈');
    expect(html).toContain('자료실');
    expect(html).toContain('내 서재');
    expect(html).toContain('복습');
    expect(html).toContain('마이페이지');
    expect(html).toMatch(
      /<a(?=[^>]+href="\/library")(?=[^>]+aria-current="page")[^>]*>/,
    );
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  });
});
