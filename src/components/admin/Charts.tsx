import { formatPriceCompact } from '@/lib/format';

/** Lightweight dependency-free SVG line/area chart */
export function LineChart({ data, labels }: { data: number[]; labels: string[] }) {
  const w = 640;
  const h = 220;
  const pad = 10;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = data.length > 1 ? w / (data.length - 1) : w;
  const pts = data.map((v, i) => [
    i * stepX,
    h - pad - ((v - min) / range) * (h - 2 * pad)
  ]);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${w},${h} L0,${h} Z`;

  return (
    <div dir="ltr">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 220 }}>
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f8270" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#0f8270" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke="#e2e8f0" strokeWidth="1" />
        ))}
        <path d={area} fill="url(#lineFill)" />
        <path d={path} fill="none" stroke="#0f8270" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#fff" stroke="#0f8270" strokeWidth="2" />
        ))}
      </svg>
      {labels.length > 0 && (
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>{labels[0]}</span>
          {labels.length > 2 && <span>{labels[Math.floor(labels.length / 2)]}</span>}
          <span>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}

/** Dependency-free horizontal bar chart */
export function HBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3.5">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">{d.label}</span>
            <span className="font-bold text-slate-800">{formatPriceCompact(d.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-l from-brand-700 to-brand-400"
              style={{ width: `${Math.max((d.value / max) * 100, 3)}%` }}
            />
          </div>
        </div>
      ))}
      {data.length === 0 && <p className="py-6 text-center text-sm text-slate-400">داده‌ای موجود نیست</p>}
    </div>
  );
}
