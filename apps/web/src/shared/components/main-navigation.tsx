import type { NavigationIconName } from './active-navigation-link';
import { ActiveNavigationLink } from './active-navigation-link';

interface NavigationItem {
  href: string;
  label: string;
  icon: NavigationIconName;
}

const navigationItems: NavigationItem[] = [
  { href: '/', label: '홈', icon: 'house' },
  { href: '/resources', label: '자료실', icon: 'book-open' },
  { href: '/library', label: '내 서재', icon: 'library-big' },
  { href: '/recap', label: '복습', icon: 'rotate-ccw' },
  { href: '/my', label: '마이페이지', icon: 'user-round' },
] as const;

export function DesktopNavigation() {
  return (
    <nav
      className="
        flex items-center gap-1
        md:flex
      "
      aria-label="주 메뉴"
    >
      {navigationItems.map(({ href, label }) => (
        <ActiveNavigationLink
          key={href}
          href={href}
          label={label}
          variant="desktop"
        />
      ))}
    </nav>
  );
}

export function MobileBottomNavigation() {
  return (
    <nav
      className="
        fixed inset-x-0 bottom-0 z-50 border-t bg-card/95
        pb-[env(safe-area-inset-bottom)] backdrop-blur-sm
        md:hidden
      "
      aria-label="주 메뉴"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {navigationItems.map(({ href, label, icon }) => (
          <ActiveNavigationLink
            key={href}
            href={href}
            icon={icon}
            label={label}
            variant="mobile"
          />
        ))}
      </div>
    </nav>
  );
}
