/* Headings are authored as plain strings where *text* marks the gold
   part and a newline forces a break. They render as HTML (React treats
   the content as opaque), because SplitText rearranges heading DOM into
   line wrappers — if React later tried to reconcile those children it
   would hit nodes that no longer exist and crash. */
const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function markup(s: string) {
  return escape(s)
    .replace(/\*(.+?)\*/g, '<span class="text-metal">$1</span>')
    .replace(/\n/g, "<br>");
}
