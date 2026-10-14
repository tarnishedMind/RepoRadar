/**
 * Shared layout for generated Open Graph images (1200×630).
 * Rendered by next/og (Satori), which supports a subset of CSS: flexbox only,
 * inline styles, no Tailwind classes.
 */
export const ogSize = { width: 1200, height: 630 };

export function OgCard({
  eyebrow,
  title,
  description,
  avatarUrl,
  stats = [],
}: {
  eyebrow: string;
  title: string;
  description?: string | null;
  avatarUrl?: string;
  stats?: { label: string; value: string }[];
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(135deg, #0a0a0a 0%, #18181b 60%, #1e293b 100%)",
        color: "#fafafa",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- Satori needs a plain <img>
          <img src={avatarUrl} width={140} height={140} style={{ borderRadius: 999 }} alt="" />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
          <div style={{ fontSize: 32, color: "#a1a1aa" }}>{eyebrow}</div>
          <div style={{ fontSize: title.length > 28 ? 56 : 72, fontWeight: 700, lineHeight: 1.1 }}>
            {title}
          </div>
        </div>
      </div>
      {description && (
        <div
          style={{
            fontSize: 32,
            color: "#d4d4d8",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 56 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 44, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 22, color: "#a1a1aa", textTransform: "uppercase" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: "#38bdf8" }}>RepoRadar</div>
      </div>
    </div>
  );
}
