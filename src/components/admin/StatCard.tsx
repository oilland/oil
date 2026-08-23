export function StatCard({
  icon,
  label,
  value,
  sub,
  tone = 'brand'
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: 'brand' | 'accent' | 'green' | 'red';
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    accent: 'bg-accent-50 text-accent-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600'
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-xl font-black text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span>
      </div>
    </div>
  );
}
