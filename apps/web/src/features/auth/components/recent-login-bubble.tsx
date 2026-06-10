export function RecentLoginBubble() {
  return (
    <span
      className="
        pointer-events-none absolute -top-4 right-5 z-10 inline-flex h-8
        items-center rounded-full border bg-background px-3 text-xs
        font-semibold text-foreground
        after:absolute after:-bottom-1.5 after:left-7 after:size-3
        after:rotate-45 after:border-r after:border-b after:border-slate-200 after:bg-background
      "
    >
      최근 로그인
    </span>
  );
}
