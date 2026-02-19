'use client';

import {
  CartesianGrid,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ConsumptionData {
  time: string;
  consumptionKWh: number;
}

interface ConsumptionChartProps {
  data: ConsumptionData[];
  title?: string;
}

export default function ConsumptionChart({ data, title = 'Curva de Carga Horaria (Promedio vs Pico)' }: ConsumptionChartProps) {
  const hourly = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    slot: `${hour.toString().padStart(2, '0')}:00`,
    total: 0,
    count: 0,
    max: 0,
  }));

  for (const row of data) {
    const hour = Number.parseInt((row.time || '').slice(0, 2), 10);
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) continue;
    const kwh = Number(row.consumptionKWh) || 0;
    hourly[hour].total += kwh;
    hourly[hour].count += 1;
    hourly[hour].max = Math.max(hourly[hour].max, kwh);
  }

  const chartData = hourly.map((point) => ({
    slot: point.slot,
    avg: point.count > 0 ? Number((point.total / point.count).toFixed(3)) : 0,
    max: Number(point.max.toFixed(3)),
  }));

  return (
    <section className="rounded-3xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-[11px] text-slate-500">
        Azul: promedio horario. Rojo: pico horario.
      </p>
      <div className="mt-3 h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="slot" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 11 }}
              formatter={(value: number | string | undefined, name: string | undefined) => {
                const numericValue = typeof value === 'number' ? value : Number(value || 0);
                return [`${numericValue.toFixed(3)} kWh`, name || 'Serie'];
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="avg" name="Promedio horario" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
            <Line
              type="monotone"
              dataKey="max"
              name="Pico horario"
              stroke="#E11D48"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
