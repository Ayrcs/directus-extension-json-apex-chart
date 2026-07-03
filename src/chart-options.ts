import type { ApexOptions } from 'apexcharts';
import type { ChartInterfaceOptions, NormalizedChartData, NormalizedPoint } from './types';

function axisTitle(label?: string, unit?: string): string | undefined {
  if (label && unit) return `${label} (${unit})`;
  return label ?? unit;
}

export function buildChartOptions(
  data: NormalizedChartData,
  renderedPoints: NormalizedPoint[],
  options: ChartInterfaceOptions,
): ApexOptions {
  const pointCount = data.points.length;

  return {
    chart: {
      type: options.chartType,
      height: options.height,
      redrawOnParentResize: true,
      redrawOnWindowResize: true,
      animations: {
        enabled: pointCount <= 1000,
      },
      toolbar: {
        show: true,
      },
      zoom: {
        enabled: true,
      },
    },
    series: [
      {
        name: data.name || 'Series',
        data: renderedPoints.map((point) => ({
          x: point.x,
          y: point.y,
        })),
      },
    ],
    title: {
      text: options.showTitle ? data.name : undefined,
      align: 'left',
      style: {
        fontSize: '14px',
        fontWeight: 600,
      },
    },
    stroke: {
      curve: options.smoothCurve ? 'smooth' : 'straight',
      width: options.chartType === 'scatter' ? 0 : 2,
    },
    markers: {
      size: options.showMarkers || options.chartType === 'scatter' ? 4 : 0,
    },
    grid: {
      show: options.showGrid,
    },
    xaxis: {
      type: 'numeric',
      title: {
        text: axisTitle(data.xAxis.label, data.xAxis.unit),
      },
    },
    yaxis: {
      title: {
        text: axisTitle(data.yAxis.label, data.yAxis.unit),
      },
    },
    noData: {
      text: 'No chart data',
    },
    tooltip: {
      shared: false,
      x: {
        formatter: (value) => String(value),
      },
    },
  };
}
