function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** HTML stays HTML; plain text (newlines) becomes real paragraphs. */
export function toRichHtml(raw: string) {
  const t = raw.replace(/\r\n/g, '\n').trim();
  if (!t) return '';
  if (/<\/?[a-z][\s\S]*>/i.test(t)) {
    if (!/<p\b/i.test(t) && /<br\s*\/?>/i.test(t)) {
      return t
        .split(/<br\s*\/?>\s*<br\s*\/?>/i)
        .map((block) => `<p>${block.trim()}</p>`)
        .join('');
    }
    return t;
  }
  return t
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block.trim()).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

export function RichText({
  html,
  className = ''
}: {
  html: string | null | undefined;
  className?: string;
}) {
  if (!html?.trim()) return null;
  return <div className={`rich-text ${className}`.trim()} dangerouslySetInnerHTML={{ __html: toRichHtml(html) }} />;
}
