const timeFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

/** Shows when a cached (ISR) result was generated. Rendered on the server only. */
export function UpdatedAt({ iso }: { iso: string }) {
  return (
    <p className="text-xs text-zinc-500">
      Generated <time dateTime={iso}>{timeFormat.format(new Date(iso))} UTC</time>
    </p>
  );
}
