'use client';

import { AlertTriangle, BellRing, Lightbulb } from 'lucide-react';
import { AnalysisResult } from '@/lib/analysis';

interface AnalysisDashboardProps {
  analysis: AnalysisResult;
}

function alertStyles(level: 'high' | 'medium' | 'low') {
  if (level === 'high') return 'border-red-200 bg-red-50 text-red-900';
  if (level === 'medium') return 'border-amber-200 bg-amber-50 text-amber-900';
  return 'border-emerald-200 bg-emerald-50 text-emerald-900';
}

function metricTone(value: number, thresholds: [number, number]) {
  if (value >= thresholds[1]) return 'text-rose-700';
  if (value >= thresholds[0]) return 'text-amber-700';
  return 'text-emerald-700';
}

export default function AnalysisDashboard({ analysis }: AnalysisDashboardProps) {
  const trendLabel =
    analysis.monthlyTrendPct === null
      ? 'Sin comparativa'
      : `${analysis.monthlyTrendPct > 0 ? '+' : ''}${analysis.monthlyTrendPct}%`;

  return (
    <section className="space-y-4">
      <article className="rounded-3xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200 p-4 md:p-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Consumo total</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{analysis.totalConsumption} kWh</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Promedio diario</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{analysis.averageDaily} kWh</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Factor de carga</p>
            <p className={`mt-1 text-lg font-semibold ${metricTone(analysis.loadFactor, [0.3, 0.45])}`}>
              {analysis.loadFactor}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Pico horario</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {analysis.peakHour}:00 <span className="text-xs font-medium text-slate-500">({analysis.peakHourAverage} kWh)</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Tendencia mensual</p>
            <p
              className={`mt-1 text-lg font-semibold ${
                analysis.monthlyTrendPct === null
                  ? 'text-slate-700'
                  : analysis.monthlyTrendPct > 0
                    ? 'text-rose-700'
                    : 'text-emerald-700'
              }`}
            >
              {trendLabel}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Distribucion diaria del consumo</span>
            <span>Noche / Dia / Tarde</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full flex">
              <div className="bg-indigo-500" style={{ width: `${analysis.nightShare}%` }} />
              <div className="bg-cyan-500" style={{ width: `${analysis.daytimeShare}%` }} />
              <div className="bg-emerald-500" style={{ width: `${analysis.eveningShare}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-600">
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-indigo-500" />Noche {analysis.nightShare}%</span>
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-cyan-500" />Dia {analysis.daytimeShare}%</span>
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" />Tarde {analysis.eveningShare}%</span>
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-slate-400" />Fin semana {analysis.weekendShare}%</span>
          </div>
        </div>
      </article>

      <article className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-4 text-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-200">
          <Lightbulb className="h-4 w-4" />
          Resumen ejecutivo
        </div>
        <p className="mt-2 text-xs leading-relaxed">{analysis.recommendation}</p>
      </article>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <article className="rounded-3xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200 p-4">
          <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <BellRing className="h-4 w-4 text-amber-600" />
            Alertas de operacion
          </h3>
          <div className="mt-2.5 space-y-2">
            {analysis.alerts.map((alert, index) => (
              <div key={`${alert.title}-${index}`} className={`rounded-2xl border p-3 ${alertStyles(alert.level)}`}>
                <p className="text-xs font-semibold">{alert.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed">{alert.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200 p-4">
          <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <AlertTriangle className="h-4 w-4 text-cyan-700" />
            Oportunidades de ahorro
          </h3>
          <div className="mt-2.5 space-y-2">
            {analysis.opportunities.map((opportunity, index) => (
              <div key={`${opportunity.title}-${index}`} className="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-900">{opportunity.title}</p>
                  <span className="text-[11px] font-semibold text-cyan-800">{opportunity.priority}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-700">{opportunity.detail}</p>
                <p className="mt-2 text-[11px] font-medium text-cyan-800">
                  Ahorro estimado: {opportunity.estimatedSavingsPercent}%
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
