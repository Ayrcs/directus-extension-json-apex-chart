import type { ChartJsonValue, ValidationResult } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function validateAxis(value: unknown, path: string, errors: string[]): void {
  if (value === undefined) return;

  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return;
  }

  if (!isOptionalString(value.label)) {
    errors.push(`${path}.label must be a string.`);
  }

  if (!isOptionalString(value.unit)) {
    errors.push(`${path}.unit must be a string.`);
  }
}

export function validateChartValue(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return {
      valid: false,
      errors: ['Value must be a JSON object.'],
    };
  }

  const chartValue = value as ChartJsonValue;

  if (!Array.isArray(chartValue.points)) {
    errors.push('points must be an array.');
  }

  if (!isOptionalString(chartValue.name)) {
    errors.push('name must be a string.');
  }

  validateAxis(chartValue.x_axis, 'x_axis', errors);
  validateAxis(chartValue.y_axis, 'y_axis', errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
