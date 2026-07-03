import type { ChartAxis, ChartJsonValue, NormalizedPoint, NormalizeResult, RawPoint } from './types';
import { isFiniteNumber, validateChartValue } from './validation';

function parseJsonString(value: string): { value: unknown; error: string | null } {
  try {
    return {
      value: JSON.parse(value),
      error: null,
    };
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : 'Invalid JSON string.',
    };
  }
}

export function coerceChartValue(value: unknown): { value: unknown; error: string | null } {
  if (typeof value !== 'string') {
    return { value, error: null };
  }

  const trimmedValue = value.trim();

  if (trimmedValue === '') {
    return { value: '', error: null };
  }

  return parseJsonString(trimmedValue);
}

function normalizeAxis(axis: ChartAxis | undefined): ChartAxis {
  return {
    label: axis?.label,
    unit: axis?.unit,
  };
}

function normalizePoint(point: RawPoint): NormalizedPoint | null {
  if (Array.isArray(point)) {
    const [x, y] = point;
    return isFiniteNumber(x) && isFiniteNumber(y) ? { x, y } : null;
  }

  if (typeof point === 'object' && point !== null) {
    return isFiniteNumber(point.x) && isFiniteNumber(point.y) ? { x: point.x, y: point.y } : null;
  }

  return null;
}

export function normalizeChartValue(value: unknown): NormalizeResult {
  const coerced = coerceChartValue(value);

  if (coerced.error) {
    return {
      valid: false,
      errors: [`Value must be valid JSON. ${coerced.error}`],
      data: null,
    };
  }

  const validation = validateChartValue(coerced.value);

  if (!validation.valid) {
    return {
      ...validation,
      data: null,
    };
  }

  const chartValue = coerced.value as ChartJsonValue;
  const points = chartValue.points ?? [];
  const normalizedPoints: NormalizedPoint[] = [];
  let skippedPoints = 0;

  for (const point of points) {
    const normalizedPoint = normalizePoint(point);

    if (normalizedPoint) {
      normalizedPoints.push(normalizedPoint);
    } else {
      skippedPoints += 1;
    }
  }

  const errors = [...validation.errors];

  if (normalizedPoints.length === 0) {
    errors.push('points must contain at least one valid [x, y] pair.');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0
      ? {
          version: chartValue.version,
          name: chartValue.name,
          xAxis: normalizeAxis(chartValue.x_axis),
          yAxis: normalizeAxis(chartValue.y_axis),
          points: normalizedPoints,
          skippedPoints,
        }
      : null,
  };
}

export function downsamplePoints(points: NormalizedPoint[], maxRenderedPoints: number): NormalizedPoint[] {
  const safeMax = Math.max(2, Math.floor(maxRenderedPoints));

  if (points.length <= safeMax) {
    return points;
  }

  const lastIndex = points.length - 1;
  const step = lastIndex / (safeMax - 1);
  const sampled: NormalizedPoint[] = [];

  for (let index = 0; index < safeMax; index += 1) {
    sampled.push(points[Math.round(index * step)]);
  }

  return sampled;
}
