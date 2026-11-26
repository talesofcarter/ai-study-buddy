const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface HighlightProps {
  text: string;
  query: string;
}

export function Highlight({ text, query }: HighlightProps) {
  const terms = query.split(" ").filter((term) => term.length > 0);
  if (terms.length === 0) return <>{text}</>;

  // A capture group makes split() keep the matches, at odd indices.
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, position) =>
        position % 2 === 1 ? (
          <mark
            key={`${position}-${part}`}
            className="highlight bg-transparent text-inherit"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
