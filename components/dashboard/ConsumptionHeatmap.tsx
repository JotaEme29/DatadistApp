'use client';

import React from 'react';

interface ConsumptionData {
  date: string;
  time: string;
  consumptionKWh: number;
}

interface ConsumptionHeatmapProps {
  data: ConsumptionData[];
}

export default function ConsumptionHeatmap({ data }: ConsumptionHeatmapProps) {
  const matrix = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => ({ total: 0, count: 0, avg: 0 }))
  );

  for (const row of data) {
    const day = new Date(`${row.date}T00:00:00`).getDay();
    const hour = Number.parseInt((row.time || '').slice(0, 2), 10);
    if (!Number.isFinite(day) || !Number.isFinite(hour) || day < 0 || day > 6 || hour < 0 || hour > 23) continue;
    const value = Number(row.consumptionKWh) || 0;
    matrix[day][hour].total += value;
    matrix[day][hour].count += 1;
  }

  let maxAvg = 0;
  for (const dayRow of matrix) {
    for (const cell of dayRow) {
      cell.avg = cell.count > 0 ? cell.total / cell.count : 0;
      maxAvg = Math.max(maxAvg, cell.avg);
    }
  }

  const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const hours = Array.from({ length: 24 }, (_, index) => index);

  function intensityClass(avg: number): string {
    if (avg === 0) return 'bg-slate-100';
    const ratio = maxAvg > 0 ? avg / maxAvg : 0;
    if (ratio < 0.2) return 'bg-cyan-100';
    if (ratio < 0.4) return 'bg-cyan-200';
    if (ratio < 0.6) return 'bg-cyan-400';
    if (ratio < 0.8) return 'bg-cyan-600';
    return 'bg-cyan-800';
  }

  return (
    <section className="rounded-3xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200 p-4 overflow-x-auto">
      <h3 className="text-sm font-semibold text-slate-900">Mapa de Carga Semanal</h3>
      <p className="mt-1 text-[11px] text-slate-500">
        Intensidad media por dia y hora. Permite detectar picos recurrentes y consumo base.
      </p>

      <div className="mt-3 min-w-[860px]">
        <div className="grid grid-cols-[auto_repeat(24,1fr)] gap-1">
          <div className="h-6" />
          {hours.map((hour) => (
            <div key={`h-${hour}`} className="text-[9px] text-slate-500 text-center">
              {hour}
            </div>
          ))}

          {days.map((dayName, dayIndex) => (
            <React.Fragment key={dayName}>
              <div className="text-[11px] text-slate-600 font-medium py-1 pr-2">{dayName}</div>
              {matrix[dayIndex].map((cell, hourIndex) => (
                <div
                  key={`${dayIndex}-${hourIndex}`}
                  className={`group relative h-6 rounded ${intensityClass(cell.avg)} transition-transform hover:scale-[1.02]`}
                >
                  <div className="pointer-events-none absolute left-1/2 top-0 z-10 hidden -translate-x-1/2 -translate-y-[110%] rounded-md bg-slate-900 px-2 py-1 text-[10px] text-white shadow-md group-hover:block whitespace-nowrap">
                    {dayName} {hourIndex}:00 - {cell.avg.toFixed(3)} kWh
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-slate-500">
        <span>Bajo</span>
        <div className="h-2 w-24 rounded bg-gradient-to-r from-cyan-100 via-cyan-400 to-cyan-800" />
        <span>Alto</span>
      </div>
    </section>
  );
}
