import { Card, CardContent } from '@kichulbot/ui/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

export interface FeatureSectionItem {
  href: string;
  label: string;
  iconSrc: string;
}

interface FeatureSectionProps {
  items: FeatureSectionItem[];
}

export function FeatureSection({ items }: FeatureSectionProps) {
  return (
    <Card>
      <CardContent>
        <ul
          className="
            grid grid-cols-3 gap-4 py-2
            sm:flex sm:scrollbar-none sm:gap-3 sm:overflow-x-auto sm:py-0
            sm:pb-1 sm:[-ms-overflow-style:none]
            [&::-webkit-scrollbar]:hidden
          "
          aria-label="학습 기능 바로가기"
        >
          {items.map((item) => (
            <li key={item.label} className="min-w-0 sm:shrink-0">
              <FeatureItem item={item} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

const FeatureItem = ({ item }: { item: FeatureSectionItem }) => {
  return (
    <Link
      href={item.href}
      className="
        flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl
        sm:aspect-square sm:size-35 sm:items-start sm:justify-end sm:rounded-2xl
        sm:bg-muted sm:p-4
      "
      aria-label={`${item.label}로 이동`}
    >
      <span className="grid size-8 place-items-center rounded-xl bg-muted sm:size-auto sm:bg-transparent">
        <Image
          src={item.iconSrc}
          alt=""
          width={56}
          height={56}
          unoptimized
          className="
            size-8 object-contain
            sm:size-8
          "
        />
      </span>
      <span
        className="
          w-full truncate text-center text-sm font-bold text-zinc-500
          sm:text-left sm:text-base sm:text-zinc-950
        "
      >
        {item.label}
      </span>
    </Link>
  );
};
