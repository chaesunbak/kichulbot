export function QuestionTextBlock({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <pre
        className="
          mt-2 max-h-72 overflow-auto rounded-md border bg-muted/20 px-3 py-2
          font-sans text-sm/6 whitespace-pre-wrap
        "
      >
        {text}
      </pre>
    </div>
  );
}
