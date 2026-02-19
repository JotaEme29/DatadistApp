export interface ConsumptionPoint {
  date: string;
  time: string;
  consumptionKWh: number;
}

export interface AlertItem {
  level: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
}

export interface OpportunityItem {
  priority: 'Alta' | 'Media' | 'Baja';
  title: string;
  detail: string;
  estimatedSavingsPercent: number;
}

export interface AnalysisResult {
  totalConsumption: number;
  averageDaily: number;
  averageHourly: number;
  peakHour: number;
  peakHourAverage: number;
  maxConsumption: number;
  baseLoad: number;
  loadFactor: number;
  weekendShare: number;
  nightShare: number;
  daytimeShare: number;
  eveningShare: number;
  monthlyTrendPct: number | null;
  anomaliesCount: number;
  activeDays: number;
  recommendation: string;
  alerts: AlertItem[];
  opportunities: OpportunityItem[];
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getHour(time: string): number {
  const value = Number.parseInt(time.split(':')[0] || '', 10);
  return Number.isFinite(value) ? Math.max(0, Math.min(23, value)) : 0;
}

function quantile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function analyzeConsumption(data: ConsumptionPoint[]): AnalysisResult {
  if (!data || data.length === 0) {
    return {
      totalConsumption: 0,
      averageDaily: 0,
      averageHourly: 0,
      peakHour: 0,
      peakHourAverage: 0,
      maxConsumption: 0,
      baseLoad: 0,
      loadFactor: 0,
      weekendShare: 0,
      nightShare: 0,
      daytimeShare: 0,
      eveningShare: 0,
      monthlyTrendPct: null,
      anomaliesCount: 0,
      activeDays: 0,
      recommendation: 'No hay datos suficientes para generar un estudio.',
      alerts: [],
      opportunities: [],
    };
  }

  const hourlyTotals = Array(24).fill(0) as number[];
  const hourlyCounts = Array(24).fill(0) as number[];
  const dailyTotals = new Map<string, number>();
  const monthlyTotals = new Map<string, number>();
  const hourlyValues: number[] = [];
  let totalConsumption = 0;
  let maxConsumption = 0;
  let weekendConsumption = 0;
  let nightConsumption = 0;
  let daytimeConsumption = 0;
  let eveningConsumption = 0;

  for (const point of data) {
    const kwh = toNumber(point.consumptionKWh);
    const hour = getHour(point.time);
    const date = point.date;
    const month = date.slice(0, 7);
    const dayDate = new Date(`${date}T00:00:00`);
    const day = dayDate.getDay();

    totalConsumption += kwh;
    maxConsumption = Math.max(maxConsumption, kwh);
    hourlyTotals[hour] += kwh;
    hourlyCounts[hour] += 1;
    hourlyValues.push(kwh);
    dailyTotals.set(date, (dailyTotals.get(date) || 0) + kwh);
    monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + kwh);

    if (day === 0 || day === 6) weekendConsumption += kwh;
    if (hour <= 7) nightConsumption += kwh;
    if (hour >= 8 && hour <= 17) daytimeConsumption += kwh;
    if (hour >= 18) eveningConsumption += kwh;
  }

  const activeDays = dailyTotals.size;
  const averageDaily = activeDays > 0 ? totalConsumption / activeDays : 0;
  const averageHourly = data.length > 0 ? totalConsumption / data.length : 0;

  let peakHour = 0;
  let peakHourAverage = 0;
  for (let hour = 0; hour < 24; hour++) {
    const average = hourlyCounts[hour] > 0 ? hourlyTotals[hour] / hourlyCounts[hour] : 0;
    if (average > peakHourAverage) {
      peakHourAverage = average;
      peakHour = hour;
    }
  }

  const baseLoad = quantile(hourlyValues, 0.1);
  const loadFactor = maxConsumption > 0 ? averageHourly / maxConsumption : 0;
  const weekendShare = totalConsumption > 0 ? weekendConsumption / totalConsumption : 0;
  const nightShare = totalConsumption > 0 ? nightConsumption / totalConsumption : 0;
  const daytimeShare = totalConsumption > 0 ? daytimeConsumption / totalConsumption : 0;
  const eveningShare = totalConsumption > 0 ? eveningConsumption / totalConsumption : 0;

  const sortedMonths = [...monthlyTotals.entries()].sort(([a], [b]) => a.localeCompare(b));
  let monthlyTrendPct: number | null = null;
  if (sortedMonths.length >= 2) {
    const previous = sortedMonths[sortedMonths.length - 2][1];
    const current = sortedMonths[sortedMonths.length - 1][1];
    monthlyTrendPct = previous > 0 ? ((current - previous) / previous) * 100 : null;
  }

  const dailyValues = [...dailyTotals.values()];
  const meanDaily = dailyValues.reduce((acc, value) => acc + value, 0) / dailyValues.length;
  const variance =
    dailyValues.reduce((acc, value) => acc + Math.pow(value - meanDaily, 2), 0) / dailyValues.length;
  const stdDev = Math.sqrt(variance);
  const anomalyThreshold = meanDaily + stdDev * 1.8;
  const anomaliesCount = dailyValues.filter((value) => value > anomalyThreshold).length;

  const alerts: AlertItem[] = [];
  if (loadFactor < 0.3) {
    alerts.push({
      level: 'high',
      title: 'Curva de carga muy irregular',
      detail: 'Hay picos altos frente al consumo medio. Conviene desplazar parte de la demanda.',
    });
  }
  if (nightShare > 0.35) {
    alerts.push({
      level: 'medium',
      title: 'Consumo nocturno elevado',
      detail: 'Más del 35% del consumo ocurre entre 00:00 y 07:59.',
    });
  }
  if (monthlyTrendPct !== null && monthlyTrendPct > 10) {
    alerts.push({
      level: 'high',
      title: 'Tendencia mensual al alza',
      detail: `El último mes sube ${monthlyTrendPct.toFixed(1)}% frente al anterior.`,
    });
  }
  if (anomaliesCount > 0) {
    alerts.push({
      level: 'medium',
      title: 'Días anómalos detectados',
      detail: `Se detectaron ${anomaliesCount} días con consumo claramente fuera de patrón.`,
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      level: 'low',
      title: 'Perfil estable',
      detail: 'No se detectaron desviaciones críticas en el periodo analizado.',
    });
  }

  const opportunities: OpportunityItem[] = [];
  if (nightShare > 0.3) {
    opportunities.push({
      priority: 'Alta',
      title: 'Optimizar carga en horario nocturno',
      detail: 'Revisar consumos base nocturnos y automatizar apagados fuera de uso.',
      estimatedSavingsPercent: 8,
    });
  }
  if (loadFactor < 0.35) {
    opportunities.push({
      priority: 'Media',
      title: 'Aplanar picos de demanda',
      detail: 'Escalonar equipos intensivos para reducir máximos puntuales.',
      estimatedSavingsPercent: 6,
    });
  }
  if (monthlyTrendPct !== null && monthlyTrendPct > 0) {
    opportunities.push({
      priority: 'Media',
      title: 'Corregir tendencia de crecimiento',
      detail: 'Aplicar control de encendidos y seguimiento semanal de desviaciones.',
      estimatedSavingsPercent: 5,
    });
  }
  if (opportunities.length === 0) {
    opportunities.push({
      priority: 'Baja',
      title: 'Mantener control operativo',
      detail: 'Continuar seguimiento semanal para sostener estabilidad de consumo.',
      estimatedSavingsPercent: 3,
    });
  }

  let recommendation = 'El perfil es estable. Mantén control semanal y revisa desvíos puntuales.';
  if (alerts.some((alert) => alert.level === 'high')) {
    recommendation = 'Prioriza la reducción de picos y la revisión de consumos nocturnos para recortar coste.';
  } else if (nightShare > 0.3) {
    recommendation = 'Existe margen claro en horario nocturno: revisa cargas base y consumos fantasma.';
  } else if (peakHour >= 18 && peakHour <= 22) {
    recommendation = 'El pico está en franja de tarde-noche; desplazar cargas puede mejorar coste energético.';
  }

  return {
    totalConsumption: Number(totalConsumption.toFixed(2)),
    averageDaily: Number(averageDaily.toFixed(2)),
    averageHourly: Number(averageHourly.toFixed(3)),
    peakHour,
    peakHourAverage: Number(peakHourAverage.toFixed(3)),
    maxConsumption: Number(maxConsumption.toFixed(3)),
    baseLoad: Number(baseLoad.toFixed(3)),
    loadFactor: Number(loadFactor.toFixed(3)),
    weekendShare: Number((weekendShare * 100).toFixed(1)),
    nightShare: Number((nightShare * 100).toFixed(1)),
    daytimeShare: Number((daytimeShare * 100).toFixed(1)),
    eveningShare: Number((eveningShare * 100).toFixed(1)),
    monthlyTrendPct: monthlyTrendPct === null ? null : Number(monthlyTrendPct.toFixed(1)),
    anomaliesCount,
    activeDays,
    recommendation,
    alerts,
    opportunities,
  };
}
