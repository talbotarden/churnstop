// Static visual mock of the ChurnStop admin dashboard MRR card.
// Pure SVG sparkline so it ships without any client JS.
export function DashboardMock() {
  // Twelve weekly data points. Trend up and to the right, modest noise.
  const points = [410, 560, 720, 690, 880, 1010, 1120, 1290, 1240, 1480, 1690, 1847];
  const w = 360;
  const h = 84;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const stepX = w / (points.length - 1);
  const path = points
    .map((p, i) => {
      const x = i * stepX;
      const y = h - ((p - min) / (max - min)) * (h - 8) - 4;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  const areaPath = `${path} L ${w} ${h} L 0 ${h} Z`;

  return (
    <div className="rounded-xl border border-strong bg-[var(--bg)] shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-soft">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="text-[13px] font-medium">ChurnStop dashboard</span>
        </div>
        <span className="text-[11px] uppercase tracking-wider text-muted-2">Live</span>
      </div>

      <div className="p-5">
        <div className="text-[11px] uppercase tracking-wider text-muted">MRR preserved this month</div>
        <div className="mt-1 flex items-baseline gap-3">
          <div className="font-mono text-[44px] leading-none tracking-tight">$1,847</div>
          <div className="text-sm text-accent font-medium">+18.2%</div>
        </div>
        <div className="mt-1 text-xs text-muted">From 23 of 71 cancel attempts saved (32.4%)</div>

        <svg viewBox={`0 0 ${w} ${h}`} className="mt-5 w-full" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="cs-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0B6E4F" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0B6E4F" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#cs-area)" />
          <path d={path} fill="none" stroke="#0B6E4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-soft text-[12px]">
          <Stat label="Save rate" value="32.4%" />
          <Stat label="Top offer" value="Pause 30d" />
          <Stat label="Top reason" value="Too busy" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-2 uppercase tracking-wider text-[10px]">{label}</div>
      <div className="mt-0.5 font-medium text-[13px]">{value}</div>
    </div>
  );
}
