import Image from 'next/image';

import constructionImage from '@/shared/assets/construction.png';

export function ConstructionSection() {
  return (
    <section
      className="
        flex min-h-60 flex-col items-center justify-center gap-4 rounded-2xl
        bg-muted px-6 py-10 text-center
      "
    >
      <Image
        src={constructionImage}
        alt="공사중"
        className="size-20 object-contain sm:size-30"
      />
      <p className="text-base font-semibold text-muted-foreground">
        기능을 추가중이에요
      </p>
    </section>
  );
}
