import { markup } from "@/lib/markup";

/* Shared section header: a split-line title (see lib/markup for the
   *gold* syntax) and an optional lede. Animation comes from the
   global data-reveal system in Experience. */
export default function SectionHead({
  title,
  lede,
  className = "",
}: {
  title: string;
  lede?: string;
  className?: string;
}) {
  return (
    <header className={`sh ${className}`}>
      <h2 className="sh-title" data-reveal="lines" dangerouslySetInnerHTML={{ __html: markup(title) }} />
      {lede && (
        <p className="sh-lede" data-reveal="fade">
          {lede}
        </p>
      )}
    </header>
  );
}
