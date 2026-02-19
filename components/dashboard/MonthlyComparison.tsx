'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ConsumptionData {
  date: string;
  consumptionKWh: number;
}

interface MonthlyComparisonProps {
  data: ConsumptionData[];
}

export default function MonthlyComparison({ data }: MonthlyComparisonProps) {
  const monthly = new Map<string, number>();
  for (const row of data) {
    const month = row.date.slice(0, 7);
    monthly.set(month, (monthly.get(month) || 0) + (Number(row.consumptionKWh) || 0));
  }

  const chartData = [...monthly.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, kwh], index, arr) => {
      const prev = index > 0 ? arr[index - 1][1] : null;
      const deltaPct = prev && prev > 0 ? ((kwh - prev) / prev) * 100 : null;
      return {
        month,
        kwh: Number(kwh.toFixed(2)),
        deltaPct: deltaPct === null ? null : Number(deltaPct.toFixed(1)),
        positive: deltaPct !== null && deltaPct > 0,
      };
    });

  const latest = chartData[chartData.length - 1];

  return (
    <section className="rounded-3xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Comparativa Mensual</h3>
          <p className="mt-1 text-[11px] text-slate-500">Evolucion mensual con variacion frente al mes previo.</p>
        </div>
        {latest && (
          <div
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
              latest.deltaPct === null
                ? 'bg-slate-100 text-slate-700'
                : latest.positive
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {latest.deltaPct === null ? 'Sin referencia' : `${latest.deltaPct > 0 ? '+' : ''}${latest.deltaPct}%`}
          </div>
        )}
      </div>

      <div className="mt-3 h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 11 }}
              formatter={(value: number | string | undefined, key: string | undefined) => {
                const numericValue = typeof value === 'number' ? value : Number(value || 0);
                if (key === 'kwh') return [`${numericValue.toFixed(2)} kWh`, 'Consumo'];
                return [`${numericValue.toFixed(1)}%`, 'Variacion'];
              }}
            />
            <Bar dataKey="kwh" radius={[6, 6, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={`bar-${entry.month}`} fill={entry.positive ? '#FB7185' : '#0EA5E9'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
