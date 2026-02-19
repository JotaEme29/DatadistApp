'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import AnalysisDashboard from '@/components/dashboard/AnalysisDashboard';
import AdvancedAnalyticsEcharts from '@/components/dashboard/AdvancedAnalyticsEcharts';
import ConsumptionChart from '@/components/dashboard/ConsumptionChart';
import ConsumptionHeatmap from '@/components/dashboard/ConsumptionHeatmap';
import SyncButton from '@/components/dashboard/SyncButton';
import { analyzeConsumption, ConsumptionPoint } from '@/lib/analysis';

interface SupplyRow {
  cups: string;
  address: string;
}

interface ConsumptionApiRow {
  date: string;
  time: string;
  consumption_kwh: number;
  obtain_method: string;
}

export default function Dashboard() {
  const [supplies, setSupplies] = useState<SupplyRow[]>([]);
  const [selectedCups, setSelectedCups] = useState<string>('');
  const [consumptionData, setConsumptionData] = useState<ConsumptionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConsumption, setLoadingConsumption] = useState(false);
  const [error, setError] = useState<string>('');
  const [presentationMode, setPresentationMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const analysis = useMemo(() => analyzeConsumption(consumptionData), [consumptionData]);

  async function fetchSupplies(): Promise<SupplyRow[]> {
    const response = await fetch('/api/supplies');
    if (!response.ok) throw new Error('No fue posible cargar los suministros.');
    const rows = (await response.json()) as SupplyRow[];
    return Array.isArray(rows) ? rows : [];
  }

  async function fetchConsumption(cups: string) {
    setLoadingConsumption(true);
    try {
      const now = new Date();
      const start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      const params = new URLSearchParams({
        cups,
        startDate: start.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      });

      const response = await fetch(`/api/consumption?${params.toString()}`);
      if (!response.ok) throw new Error('No fue posible cargar consumo.');
      const rows = (await response.json()) as ConsumptionApiRow[];
      const mapped = rows.map((row) => ({
        date: row.date,
        time: row.time,
        consumptionKWh: Number(row.consumption_kwh) || 0,
      }));
      setConsumptionData(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido cargando consumo.';
      setError(message);
    } finally {
      setLoadingConsumption(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    async function init() {
      setLoading(true);
      try {
        const rows = await fetchSupplies();
        if (!mounted) return;
        setSupplies(rows);
        if (rows.length === 0) {
          setError('No hay suministros cargados. Ejecuta la sincronizacion inicial.');
          return;
        }
        const nextCups = rows[0].cups;
        setSelectedCups(nextCups);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido.';
        if (mounted) setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCups) return;
    fetchConsumption(selectedCups);
  }, [selectedCups]);

  useEffect(() => {
    if (!presentationMode) {
      setCurrentSlide(0);
    }
  }, [presentationMode]);

  const slideCount = 9;

  function renderPresentationSlide() {
    if (currentSlide === 0) {
      return (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Paso 1: Resumen ejecutivo para abrir la conversación con el cliente.
          </p>
          <AnalysisDashboard analysis={analysis} />
        </div>
      );
    }
    if (currentSlide === 1) {
      return (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Paso 2: Curva de carga para explicar consumo típico vs picos.
          </p>
          <ConsumptionChart data={consumptionData} />
        </div>
      );
    }
    if (currentSlide === 2) {
      return (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Paso 3: Mapa de calor para ubicar horas y días de mayor carga.
          </p>
          <ConsumptionHeatmap data={consumptionData} />
        </div>
      );
    }
    if (currentSlide >= 3 && currentSlide <= 7) {
      return (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Paso {currentSlide + 1}: Visual comercial enfocada para conversación con cliente.
          </p>
          <AdvancedAnalyticsEcharts data={consumptionData} presentationIndex={currentSlide - 3} />
        </div>
      );
    }

    return (
      <article className="rounded-3xl bg-white/85 backdrop-blur-sm ring-1 ring-slate-200 p-5">
        <h3 className="text-base font-semibold text-slate-900">Cierre comercial recomendado</h3>
        <div className="mt-3 space-y-2">
          {analysis.opportunities.map((opportunity, index) => (
            <div key={`${opportunity.title}-${index}`} className="rounded-xl border border-cyan-100 bg-cyan-50/80 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-900">{opportunity.title}</p>
                <span className="text-[11px] font-semibold text-cyan-800">{opportunity.priority}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-700">{opportunity.detail}</p>
              <p className="mt-1 text-[11px] font-medium text-cyan-800">
                Ahorro estimado: {opportunity.estimatedSavingsPercent}%
              </p>
            </div>
          ))}
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-gradient-to-r from-cyan-50/90 via-white/90 to-emerald-50/90 ring-1 ring-slate-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Estudio de Consumo Energetico</h2>
            <p className="mt-1 text-xs text-slate-600">
              Analisis operativo con alertas, tendencia y oportunidades de ahorro basadas en datos horarios.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SyncButton
              onSyncComplete={async () => {
                const rows = await fetchSupplies();
                setSupplies(rows);
                if (rows.length > 0) {
                  const exists = rows.some((row) => row.cups === selectedCups);
                  const next = exists ? selectedCups : rows[0].cups;
                  setSelectedCups(next);
                  await fetchConsumption(next);
                }
              }}
            />
            {supplies.length > 0 && (
              <select
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-cyan-500"
                value={selectedCups}
                onChange={(event) => setSelectedCups(event.target.value)}
              >
                {supplies.map((supply) => (
                  <option key={supply.cups} value={supply.cups}>
                    {supply.address} ({supply.cups})
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setPresentationMode((value) => !value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {presentationMode ? 'Salir Presentación' : 'Modo Presentación'}
            </button>
          </div>
        </div>
      </section>

      {error && supplies.length === 0 ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </section>
      ) : (
        <section className="space-y-4">
          {loading || loadingConsumption ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              Cargando analisis...
            </div>
          ) : null}

          {presentationMode ? (
            <section className="space-y-3">
              <div className="rounded-2xl bg-white/85 backdrop-blur-sm ring-1 ring-slate-200 p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  Presentación comercial: paso {currentSlide + 1} de {slideCount}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentSlide((value) => Math.max(0, value - 1))}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 disabled:opacity-40"
                    disabled={currentSlide === 0}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentSlide((value) => Math.min(slideCount - 1, value + 1))}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 disabled:opacity-40"
                    disabled={currentSlide === slideCount - 1}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
              {renderPresentationSlide()}
            </section>
          ) : (
            <>
              <AnalysisDashboard analysis={analysis} />
              <AdvancedAnalyticsEcharts data={consumptionData} />
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Vista técnica complementaria</h3>
                <ConsumptionChart data={consumptionData} />
                <ConsumptionHeatmap data={consumptionData} />
              </section>
            </>
          )}
        </section>
      )}
    </div>
  );
}
