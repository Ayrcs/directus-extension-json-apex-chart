<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { buildChartOptions } from './chart-options';
import { coerceChartValue, downsamplePoints, normalizeChartValue } from './normalize';
import type { ChartInterfaceOptions, ChartType } from './types';
import type ApexCharts from 'apexcharts';

const props = withDefaults(defineProps<{
  value?: unknown;
  disabled?: boolean;
  nonEditable?: boolean;
  chartType?: ChartType;
  showMarkers?: boolean;
  height?: number;
  smoothCurve?: boolean;
  showTitle?: boolean;
  showGrid?: boolean;
  maxRenderedPoints?: number;
}>(), {
  disabled: false,
  nonEditable: false,
  chartType: 'line',
  showMarkers: false,
  height: 320,
  smoothCurve: true,
  showTitle: true,
  showGrid: true,
  maxRenderedPoints: 5000,
});

const emit = defineEmits<{
  input: [value: unknown];
}>();

const mode = ref<'chart' | 'json'>('chart');
const chartElement = ref<HTMLElement | null>(null);
const chartInstance = shallowRef<ApexCharts | null>(null);
const editorText = ref('');
const parseError = ref('');
let apexChartsConstructor: typeof ApexCharts | null = null;
let resizeObserver: ResizeObserver | null = null;
let renderFrame: number | null = null;
let renderRun = 0;

const isReadonly = computed(() => props.disabled || props.nonEditable);
const isEmpty = computed(() => props.value === null || props.value === undefined || props.value === '');

const interfaceOptions = computed<ChartInterfaceOptions>(() => ({
  chartType: props.chartType,
  showMarkers: props.showMarkers,
  height: Math.max(160, Number(props.height) || 320),
  smoothCurve: props.smoothCurve,
  showTitle: props.showTitle,
  showGrid: props.showGrid,
  maxRenderedPoints: Math.max(2, Number(props.maxRenderedPoints) || 5000),
}));

const normalized = computed(() => (isEmpty.value ? null : normalizeChartValue(props.value)));

const renderedPoints = computed(() => {
  if (!normalized.value?.data) return [];
  return downsamplePoints(normalized.value.data.points, interfaceOptions.value.maxRenderedPoints);
});

const isSampled = computed(() => {
  const data = normalized.value?.data;
  return Boolean(data && renderedPoints.value.length < data.points.length);
});

const chartSignature = computed(() => {
  const data = normalized.value?.data;
  if (!data) return 'empty';

  const pointHash = renderedPoints.value.reduce((hash, point, index) => {
    const x = Math.round(point.x * 1_000_000);
    const y = Math.round(point.y * 1_000_000);
    return (hash + (index + 1) * (x * 31 + y * 17)) % 1_000_000_007;
  }, 0);

  return JSON.stringify({
    name: data.name,
    total: data.points.length,
    rendered: renderedPoints.value.length,
    pointHash,
    options: interfaceOptions.value,
  });
});

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return JSON.stringify(exampleValue(), null, 2);
  }

  const coerced = coerceChartValue(value);

  if (coerced.error) {
    return String(value);
  }

  return JSON.stringify(coerced.value, null, 2);
}

function exampleValue() {
  return {
    version: 1,
    name: 'Curve name',
    x_axis: {
      label: 'X axis',
      unit: 's',
    },
    y_axis: {
      label: 'Y axis',
      unit: 'V',
    },
    points: [
      [0, 0],
      [1, 2.5],
    ],
  };
}

async function destroyChart(): Promise<void> {
  if (!chartInstance.value) return;

  chartInstance.value.destroy();
  chartInstance.value = null;
}

function isChartElementReady(): boolean {
  if (!chartElement.value || !chartElement.value.isConnected) return false;

  const bounds = chartElement.value.getBoundingClientRect();
  return bounds.width > 0 && bounds.height > 0;
}

async function waitForVisibleChartElement(runId: number): Promise<boolean> {
  await nextTick();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (runId !== renderRun || mode.value !== 'chart') return false;
    if (isChartElementReady()) return true;

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }

  return isChartElementReady();
}

async function renderChart(): Promise<void> {
  const runId = ++renderRun;

  if (mode.value !== 'chart' || !chartElement.value || !normalized.value?.valid || !normalized.value.data) {
    await destroyChart();
    return;
  }

  const chartOptions = buildChartOptions(normalized.value.data, renderedPoints.value, interfaceOptions.value);
  const isReady = await waitForVisibleChartElement(runId);

  if (!isReady || !chartElement.value || runId !== renderRun) {
    scheduleRender();
    return;
  }

  apexChartsConstructor ??= (await import('apexcharts')).default;

  if (runId !== renderRun || !chartElement.value) return;

  if (!chartInstance.value) {
    chartInstance.value = new apexChartsConstructor(chartElement.value, chartOptions);
    await chartInstance.value.render();
    return;
  }

  await chartInstance.value.updateOptions(chartOptions, false, true, false);
  await chartInstance.value.updateSeries(chartOptions.series ?? [], false);
}

function scheduleRender(): void {
  if (renderFrame !== null) {
    cancelAnimationFrame(renderFrame);
  }

  renderFrame = requestAnimationFrame(() => {
    renderFrame = null;
    void renderChart();
  });
}

function setMode(nextMode: 'chart' | 'json'): void {
  if (nextMode === 'chart' && parseError.value) {
    return;
  }

  mode.value = nextMode;

  if (nextMode === 'json') {
    editorText.value = formatValue(props.value);
    parseError.value = '';
  }
}

function handleEditorInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement;
  editorText.value = target.value;

  try {
    const parsed = JSON.parse(target.value);
    parseError.value = '';
    emit('input', parsed);
  } catch (error) {
    parseError.value = error instanceof Error ? error.message : 'Invalid JSON.';
  }
}

function useExample(): void {
  const value = exampleValue();
  editorText.value = JSON.stringify(value, null, 2);
  parseError.value = '';
  emit('input', value);
  mode.value = 'chart';
  scheduleRender();
}

watch(
  () => props.value,
  (value) => {
    if (mode.value === 'json' && !parseError.value) {
      editorText.value = formatValue(value);
    }
  },
  { immediate: true },
);

watch(
  [mode, chartSignature],
  () => {
    scheduleRender();
  },
  { immediate: true, flush: 'post' },
);

watch(
  chartElement,
  (element) => {
    resizeObserver?.disconnect();
    resizeObserver = null;

    if (!element) return;

    resizeObserver = new ResizeObserver(() => {
      if (mode.value === 'chart' && normalized.value?.valid) {
        scheduleRender();
      }
    });

    resizeObserver.observe(element);
    scheduleRender();
  },
  { flush: 'post' },
);

onMounted(() => {
  scheduleRender();
});

onBeforeUnmount(() => {
  renderRun += 1;
  if (renderFrame !== null) {
    cancelAnimationFrame(renderFrame);
    renderFrame = null;
  }

  resizeObserver?.disconnect();
  resizeObserver = null;

  void destroyChart();
});
</script>

<template>
  <div class="json-chart-interface" :class="{ 'is-readonly': isReadonly }">
    <div class="json-chart-toolbar">
      <v-button
        small
        secondary
        :disabled="mode === 'chart' || Boolean(parseError)"
        @click="setMode('chart')"
      >
        Chart
      </v-button>
      <v-button
        small
        secondary
        :disabled="mode === 'json'"
        @click="setMode('json')"
      >
        JSON
      </v-button>
    </div>

    <div v-if="mode === 'chart'" class="json-chart-panel">
      <div v-if="isEmpty" class="json-chart-state">
        <p>No chart JSON yet.</p>
        <v-button v-if="!isReadonly" small @click="useExample">Use Example JSON</v-button>
      </div>

      <div v-else-if="normalized && !normalized.valid" class="json-chart-state is-error">
        <p>{{ normalized.errors[0] }}</p>
        <v-button small secondary @click="setMode('json')">Edit JSON</v-button>
      </div>

      <template v-else>
        <div ref="chartElement" class="json-chart-canvas" :style="{ minHeight: `${interfaceOptions.height}px` }" />
        <div v-if="isSampled || normalized?.data?.skippedPoints" class="json-chart-note">
          <span v-if="isSampled">
            Showing {{ renderedPoints.length }} of {{ normalized?.data?.points.length }} points.
          </span>
          <span v-if="normalized?.data?.skippedPoints">
            Skipped {{ normalized.data.skippedPoints }} invalid points.
          </span>
        </div>
      </template>
    </div>

    <div v-else class="json-chart-editor">
      <textarea
        class="json-chart-textarea"
        spellcheck="false"
        :disabled="isReadonly"
        :value="editorText"
        @input="handleEditorInput"
      />
      <div v-if="parseError" class="json-chart-note is-error">{{ parseError }}</div>
    </div>
  </div>
</template>

<style scoped>
.json-chart-interface {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.json-chart-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.json-chart-panel,
.json-chart-editor {
  width: 100%;
}

.json-chart-canvas {
  width: 100%;
}

.json-chart-state {
  display: flex;
  min-height: 160px;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
  color: var(--theme--foreground-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color);
  border-radius: var(--theme--border-radius);
  background: var(--theme--background-subdued);
}

.json-chart-state p {
  margin: 0;
}

.json-chart-textarea {
  width: 100%;
  min-height: 320px;
  padding: 12px;
  color: var(--theme--foreground);
  font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  resize: vertical;
  border: var(--theme--border-width) solid var(--theme--border-color);
  border-radius: var(--theme--border-radius);
  background: var(--theme--background);
}

.json-chart-textarea:disabled {
  color: var(--theme--foreground-subdued);
  background: var(--theme--background-subdued);
  cursor: not-allowed;
}

.json-chart-note {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  color: var(--theme--foreground-subdued);
  font-size: 12px;
}

.is-error {
  color: var(--theme--danger);
}

.is-readonly .json-chart-toolbar {
  opacity: 0.85;
}
</style>
