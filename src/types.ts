export type ChartType = 'line' | 'scatter';

export type RawPointTuple = [number, number];

export interface RawPointObject {
  x: number;
  y: number;
}

export type RawPoint = RawPointTuple | RawPointObject;

export interface ChartAxis {
  label?: string;
  unit?: string;
}

export interface ChartJsonValue {
  version?: number;
  name?: string;
  x_axis?: ChartAxis;
  y_axis?: ChartAxis;
  points?: RawPoint[];
}

export interface NormalizedPoint {
  x: number;
  y: number;
}

export interface NormalizedChartData {
  version?: number;
  name?: string;
  xAxis: ChartAxis;
  yAxis: ChartAxis;
  points: NormalizedPoint[];
  skippedPoints: number;
}

export interface ChartInterfaceOptions {
  chartType: ChartType;
  showMarkers: boolean;
  height: number;
  smoothCurve: boolean;
  showTitle: boolean;
  showGrid: boolean;
  maxRenderedPoints: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface NormalizeResult extends ValidationResult {
  data: NormalizedChartData | null;
}
