'use client';

import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface ConsumptionPoint {
  date: string;
  time: string;
  consumptionKWh: number;
}

interface AdvancedAnalyticsEchartsProps {
  data: ConsumptionPoint[];
  presentationIndex?: number;
}

function toDateTime(date: string, time: string): Date {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return new Date(`${date}T${normalizedTime}`);
}

function hourLabel(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

const BAND_LABELS = {
  night: 'Noche (00:00-06:59)',
  morning: 'Mañana (07:00-12:59)',
  afternoon: 'Tarde (13:00-19:59)',
  lateNight: 'Noche tardía (20:00-23:59)',
} as const;

function getTimeBand(hour: number): keyof typeof BAND_LABELS {
  if (hour <= 6) return 'night';
  if (hour <= 12) return 'morning';
  if (hour <= 19) return 'afternoon';
  return 'lateNight';
}

export default function AdvancedAnalyticsEcharts({ data, presentationIndex }: AdvancedAnalyticsEchartsProps) {
  const rows = data
    .map((item) => ({
      date: item.date,
      time: item.time,
      value: Number(item.consumptionKWh) || 0,
      ts: toDateTime(item.date, item.time).getTime(),
    }))
    .filter((item) => Number.isFinite(item.ts))
    .sort((a, b) => a.ts - b.ts);

  const monthlyMap = new Map<string, number>();
  const dailyMap = new Map<string, number>();
  const hourlyTotals = Array(24).fill(0) as number[];
  const hourlyCounts = Array(24).fill(0) as number[];
  const bands = new Map<keyof typeof BAND_LABELS, number>([
    ['night', 0],
    ['morning', 0],
    ['afternoon', 0],
    ['lateNight', 0],
  ]);

  for (const row of rows) {
    const month = row.date.slice(0, 7);
    monthlyMap.set(month, (monthlyMap.get(month) || 0) + row.value);
    dailyMap.set(row.date, (dailyMap.get(row.date) || 0) + row.value);

    const hour = Number.parseInt(row.time.slice(0, 2), 10);
    if (Number.isFinite(hour) && hour >= 0 && hour <= 23) {
      hourlyTotals[hour] += row.value;
      hourlyCounts[hour] += 1;
      const band = getTimeBand(hour);
      bands.set(band, (bands.get(band) || 0) + row.value);
    }
  }

  const monthly = [...monthlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, kwh]) => ({ month, kwh: Number(kwh.toFixed(2)) }));

  const daily = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, kwh]) => ({ date, kwh: Number(kwh.toFixed(2)) }));

  const meanDaily = daily.length > 0 ? daily.reduce((acc, item) => acc + item.kwh, 0) / daily.length : 0;
  const variance =
    daily.length > 0 ? daily.reduce((acc, item) => acc + Math.pow(item.kwh - meanDaily, 2), 0) / daily.length : 0;
  const std = Math.sqrt(variance);
  const unusualThreshold = meanDaily + std * 1.8;
  const unusualDays = daily.filter((item) => item.kwh > unusualThreshold);

  const hourlyAvg = hourlyTotals.map((totalHour, hour) =>
    hourlyCounts[hour] > 0 ? totalHour / hourlyCounts[hour] : 0
  );
  const topHours = hourlyAvg
    .map((value, hour) => ({ hour, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .sort((a, b) => a.value - b.value);

  const weekdayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const weekdayDailyTotals = Array(7).fill(0) as number[];
  const weekdayDailyCounts = Array(7).fill(0) as number[];
  for (const item of daily) {
    const weekday = new Date(`${item.date}T00:00:00`).getDay();
    if (!Number.isFinite(weekday) || weekday < 0 || weekday > 6) continue;
    weekdayDailyTotals[weekday] += item.kwh;
    weekdayDailyCounts[weekday] += 1;
  }
  const weekdayAvg = weekdayDailyTotals.map((value, index) =>
    weekdayDailyCounts[index] > 0 ? Number((value / weekdayDailyCounts[index]).toFixed(2)) : 0
  );

  const bandData = [...bands.entries()].map(([key, value]) => ({
    name: BAND_LABELS[key],
    value: Number(value.toFixed(2)),
  }));

  const topHour = topHours[topHours.length - 1];
  const topBand = [...bands.entries()].sort((a, b) => b[1] - a[1])[0];
  const lastMonth = monthly[monthly.length - 1];
  const prevMonth = monthly[monthly.length - 2];
  const monthlyDeltaPct =
    lastMonth && prevMonth && prevMonth.kwh > 0
      ? Number((((lastMonth.kwh - prevMonth.kwh) / prevMonth.kwh) * 100).toFixed(1))
      : null;

  const baseTooltip = {
    backgroundColor: '#0f172a',
    borderWidth: 0,
    textStyle: { color: '#e2e8f0', fontSize: 11 },
  };
  const svgOpts = { renderer: 'svg' as const };

  const bandOption: EChartsOption = {
    tooltip: { ...baseTooltip, trigger: 'item', formatter: '{b}: {c} kWh ({d}%)' },
    legend: { bottom: 0, textStyle: { color: '#64748b', fontSize: 10 } },
    series: [
      {
        type: 'pie',
        radius: ['48%', '70%'],
        center: ['50%', '45%'],
        label: { show: true, fontSize: 10, formatter: '{b}\n{d}%' },
        data: bandData,
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      },
    ],
  };

  const monthOption: EChartsOption = {
    tooltip: { ...baseTooltip, trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: monthly.map((item) => item.month),
      axisLabel: { color: '#64748b', fontSize: 10 },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
    },
    yAxis: {
      type: 'value',
      name: 'kWh/dia',
      nameTextStyle: { color: '#64748b', fontSize: 10 },
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
    },
    series: [
      {
        type: 'line',
        data: monthly.map((item) => item.kwh),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.5, color: '#0ea5e9' },
        areaStyle: { color: 'rgba(14,165,233,0.15)' },
      },
    ],
  };

  const weekdayOption: EChartsOption = {
    tooltip: { ...baseTooltip, trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: weekdayNames,
      axisLabel: { color: '#64748b', fontSize: 10 },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
    },
    series: [
      {
        type: 'bar',
        data: weekdayAvg,
        barWidth: 26,
        itemStyle: { color: '#22c55e', borderRadius: [6, 6, 0, 0] },
      },
    ],
  };

  const topHoursOption: EChartsOption = {
    tooltip: { ...baseTooltip, trigger: 'axis' },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'category',
      data: topHours.map((item) => hourLabel(item.hour)),
      axisLabel: { color: '#64748b', fontSize: 10 },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
    },
    series: [
      {
        type: 'bar',
        data: topHours.map((item) => Number(item.value.toFixed(3))),
        barWidth: 14,
        itemStyle: { color: '#f97316', borderRadius: [0, 7, 7, 0] },
      },
    ],
  };

  const dailyOption: EChartsOption = {
    tooltip: { ...baseTooltip, trigger: 'axis' },
    legend: { top: 0, textStyle: { color: '#64748b', fontSize: 10 } },
    grid: { left: 34, right: 16, top: 28, bottom: 24 },
    xAxis: {
      type: 'category',
      data: daily.map((item) => item.date),
      axisLabel: { color: '#64748b', fontSize: 9, interval: 'auto' },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
    },
    series: [
      {
        name: 'Consumo diario',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color: '#2563eb' },
        data: daily.map((item) => item.kwh),
      },
      {
        name: 'Dias atipicos',
        type: 'scatter',
        symbolSize: 8,
        itemStyle: { color: '#ef4444' },
        data: unusualDays.map((item) => [item.date, item.kwh]),
      },
    ],
  };

  const chartCards = [
    {
      title: '¿En qué momento del día consume más?',
      subtitle: 'Distribución del consumo por franja horaria.',
      option: bandOption,
      height: 280,
    },
    {
      title: '¿Cómo evoluciona su consumo mes a mes?',
      subtitle: 'Evolución mensual para ver crecimiento o reducción.',
      option: monthOption,
      height: 280,
    },
    {
      title: '¿Qué días suele consumir más?',
      subtitle: 'Promedio de kWh por día de semana (unidad: kWh/dia).',
      option: weekdayOption,
      height: 280,
    },
    {
      title: 'Top 5 horas de mayor consumo',
      subtitle: 'Horas que más pesan en su comportamiento energético.',
      option: topHoursOption,
      height: 280,
    },
    {
      title: 'Días atípicos que conviene revisar con el cliente',
      subtitle: 'La línea muestra consumo diario; puntos rojos marcan días fuera de patrón.',
      option: dailyOption,
      height: 290,
    },
  ] as const;

  if (typeof presentationIndex === 'number') {
    const clamped = Math.max(0, Math.min(chartCards.length - 1, presentationIndex));
    const card = chartCards[clamped];
    return (
      <article className="rounded-3xl bg-white/90 backdrop-blur-sm ring-1 ring-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
        <p className="mt-1 text-[11px] text-slate-500">{card.subtitle}</p>
        <ReactECharts option={card.option} style={{ height: card.height }} opts={svgOpts} notMerge lazyUpdate />
      </article>
    );
  }

  return (
    <section className="space-y-4">
      <article className="rounded-3xl bg-white/85 backdrop-blur-sm ring-1 ring-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Resumen para explicar al cliente</h3>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
          <p className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
            <span className="font-semibold text-slate-800">Franja principal:</span>{' '}
            <span className="text-slate-600">{topBand ? BAND_LABELS[topBand[0]] : 'N/D'}.</span>
          </p>
          <p className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
            <span className="font-semibold text-slate-800">Hora más exigente:</span>{' '}
            <span className="text-slate-600">{topHour ? hourLabel(topHour.hour) : 'N/D'}.</span>
          </p>
          <p className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
            <span className="font-semibold text-slate-800">Tendencia del último mes:</span>{' '}
            <span className={monthlyDeltaPct !== null && monthlyDeltaPct > 0 ? 'text-rose-700' : 'text-emerald-700'}>
              {monthlyDeltaPct === null ? 'sin referencia' : `${monthlyDeltaPct > 0 ? '+' : ''}${monthlyDeltaPct}%`}
            </span>
            .
          </p>
        </div>
      </article>

      <article className="rounded-2xl bg-cyan-50/70 border border-cyan-100 p-3">
        <p className="text-[11px] text-cyan-900">
          Las franjas mostradas usan rangos horarios explícitos. Si añadimos <span className="font-semibold">tipo de tarifa</span> y
          <span className="font-semibold"> potencia contratada</span>, esta vista puede pasar a periodos regulatorios reales
          (por ejemplo, punta/llano/valle) para una explicación comercial aún más precisa.
        </p>
      </article>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <article className="rounded-3xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-700">{chartCards[0].title}</h3>
          <p className="mt-1 text-[11px] text-slate-500">{chartCards[0].subtitle}</p>
          <ReactECharts option={chartCards[0].option} style={{ height: chartCards[0].height }} opts={svgOpts} notMerge lazyUpdate />
        </article>

        <article className="rounded-3xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-700">{chartCards[1].title}</h3>
          <p className="mt-1 text-[11px] text-slate-500">{chartCards[1].subtitle}</p>
          <ReactECharts option={chartCards[1].option} style={{ height: chartCards[1].height }} opts={svgOpts} notMerge lazyUpdate />
        </article>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <article className="rounded-3xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-700">{chartCards[2].title}</h3>
          <p className="mt-1 text-[11px] text-slate-500">{chartCards[2].subtitle}</p>
          <ReactECharts option={chartCards[2].option} style={{ height: chartCards[2].height }} opts={svgOpts} notMerge lazyUpdate />
        </article>

        <article className="rounded-3xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-700">{chartCards[3].title}</h3>
          <p className="mt-1 text-[11px] text-slate-500">{chartCards[3].subtitle}</p>
          <ReactECharts option={chartCards[3].option} style={{ height: chartCards[3].height }} opts={svgOpts} notMerge lazyUpdate />
        </article>
      </div>

      <article className="rounded-3xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200 p-4">
        <h3 className="text-xs font-semibold text-slate-700">{chartCards[4].title}</h3>
        <p className="mt-1 text-[11px] text-slate-500">{chartCards[4].subtitle}</p>
        <ReactECharts option={chartCards[4].option} style={{ height: chartCards[4].height }} opts={svgOpts} notMerge lazyUpdate />
      </article>
    </section>
  );
}
