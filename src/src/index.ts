import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
  id: 'json-apex-chart',
  name: 'JSON Apex Chart',
  icon: 'show_chart',
  description: 'Render JSON points as an ApexCharts chart.',
  component: InterfaceComponent,
  types: ['json'],
  group: 'standard',
  options: [
    {
      field: 'chartType',
      name: 'Chart Type',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Line', value: 'line' },
            { text: 'Scatter', value: 'scatter' },
          ],
        },
      },
      schema: {
        default_value: 'line',
      },
    },
    {
      field: 'showMarkers',
      name: 'Show Markers',
      type: 'boolean',
      meta: {
        width: 'half',
        interface: 'boolean',
      },
      schema: {
        default_value: false,
      },
    },
    {
      field: 'height',
      name: 'Height',
      type: 'integer',
      meta: {
        width: 'half',
        interface: 'input',
        options: {
          min: 160,
          step: 20,
        },
      },
      schema: {
        default_value: 320,
      },
    },
    {
      field: 'smoothCurve',
      name: 'Smooth Curve',
      type: 'boolean',
      meta: {
        width: 'half',
        interface: 'boolean',
      },
      schema: {
        default_value: true,
      },
    },
    {
      field: 'showTitle',
      name: 'Show Title',
      type: 'boolean',
      meta: {
        width: 'half',
        interface: 'boolean',
      },
      schema: {
        default_value: true,
      },
    },
    {
      field: 'showGrid',
      name: 'Show Grid',
      type: 'boolean',
      meta: {
        width: 'half',
        interface: 'boolean',
      },
      schema: {
        default_value: true,
      },
    },
    {
      field: 'maxRenderedPoints',
      name: 'Max Rendered Points',
      type: 'integer',
      meta: {
        width: 'half',
        interface: 'input',
        options: {
          min: 2,
          step: 100,
        },
      },
      schema: {
        default_value: 5000,
      },
    },
  ],
});
