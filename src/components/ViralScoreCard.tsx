export function ViralScoreCard({ score, label, reasons }: { score: number; label: string; reasons: string[] }) {
  const getBackgroundColor = (s: number) => {
    if (s >= 80) return "#E53935";
    if (s >= 50) return "#FB8C00";
    return "#757575";
  };
  const color = getBackgroundColor(score);
  return (
    <div className="p-4 border border-border rounded-xl bg-card">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: color }}>
          {score}/100
        </div>
        <div>
          <div className="font-bold text-base">{label}</div>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground list-disc pl-4">
        {reasons.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
    </div>
  )
}
