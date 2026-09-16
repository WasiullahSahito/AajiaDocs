import sanitizeHtml from "sanitize-html";

/**
 * Documents are stored as HTML and rendered for *other* users once shared,
 * so everything written to the DB passes through this allowlist. It mirrors
 * the nodes/marks the editor supports; anything else is dropped.
 */
const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s",
  "h1", "h2", "h3", "ul", "ol", "li", "blockquote", "code", "pre", "hr",
];

export function sanitizeDocHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},
    transformTags: { h4: "h3", h5: "h3", h6: "h3" },
  }).trim();
}
