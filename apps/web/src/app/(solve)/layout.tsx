export default function SolveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        flex h-dvh w-full items-center justify-center overflow-hidden
        bg-background p-2
      "
    >
      {children}
    </div>
  );
}
