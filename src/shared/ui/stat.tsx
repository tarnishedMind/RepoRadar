export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </span>
    </div>
  );
}
