// Security fix: this data is NOT always trusted -- callers embed listing
// title/description (seller-authored, e.g. app/[category]/[slug]/page.tsx's
// productJsonLd/breadcrumbJsonLd), so it can contain "</script>". JSON.stringify
// doesn't escape <, >, or / -- a title like `x</script><script>evil()</script>`
// would close this tag early and get the HTML parser to execute the rest as a
// real script, for every visitor who views that listing. Escaping the three
// characters that matter for breaking out of a <script> context (as their
// \uXXXX equivalents, which JSON.parse resolves back to the original
// characters, so the structured data itself is unaffected) closes that
// without touching what any consumer of the JSON-LD actually sees.
function escapeForScriptTag(json: string): string {
  return json.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeForScriptTag(JSON.stringify(data)) }}
    />
  );
}
