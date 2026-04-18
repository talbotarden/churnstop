// Renders a JSON-LD payload as a <script type="application/ld+json"> tag.
// Used for all schema.org structured data. Accepts a single object or an
// array; single objects are normalized to an array so call sites can splat
// or pass either shape without branching.

export function JsonLd({
  schema,
  id,
}: {
  schema: object | object[];
  id?: string;
}) {
  const payload = Array.isArray(schema) ? schema : [schema];
  return (
    <script
      type="application/ld+json"
      id={id}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload.length === 1 ? payload[0] : payload),
      }}
    />
  );
}
