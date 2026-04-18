export function StatBlock({
  value,
  label,
  source,
}: {
  value: string;
  label: string;
  source?: string;
}) {
  return (
    <div className="py-2">
      <div className="font-mono text-3xl md:text-4xl tracking-tight text-[var(--fg)]">{value}</div>
      <div className="mt-2 text-sm text-[var(--fg)] max-w-[28ch]">{label}</div>
      {source ? <div className="mt-1.5 text-xs text-muted-2">{source}</div> : null}
    </div>
  );
}
