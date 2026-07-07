# Directus JSON Apex Chart Interface

Directus v12 interface extension for a `json` field. It renders JSON point data with ApexCharts and includes a manual JSON editor that emits Directus `input` events only when the text is valid JSON.

![Chart](https://raw.githubusercontent.com/Ayrcs/directus-extension-json-apex-chart/refs/heads/main/docs/chart.jpeg)

![JSON Editor](https://raw.githubusercontent.com/Ayrcs/directus-extension-json-apex-chart/refs/heads/main/docs/json.jpeg)

![Interface settings](https://raw.githubusercontent.com/Ayrcs/directus-extension-json-apex-chart/refs/heads/main/docs/settings.jpeg)

## Install

```bash
npm install
npm run build
```

Copy or mount the built extension according to your Directus extension setup. The package declares one app extension:

- Type: `interface`
- Interface ID: `json-apex-chart`
- Supported field type: `json`

## Recommended Directus Field

- Database type: `json`
- Interface: `JSON Apex Chart`
- No relation
- Stored directly on the item

## JSON Format

Recommended format:

```json
{
  "version": 1,
  "name": "Curve name",
  "x_axis": {
    "label": "X axis",
    "unit": "s"
  },
  "y_axis": {
    "label": "Y axis",
    "unit": "V"
  },
  "points": [
    [0, 0],
    [1, 2.5]
  ]
}
```

The interface also accepts point objects when reading:

```json
{
  "points": [
    { "x": 0, "y": 0 },
    { "x": 1, "y": 2.5 }
  ]
}
```

The chart view does not rewrite the stored JSON. The editor emits the parsed object only after valid JSON changes.

## Interface Options

- `chartType`: `line` or `scatter`, default `line`
- `showMarkers`: default `false`
- `height`: default `320`
- `smoothCurve`: default `true`
- `showTitle`: default `true`
- `showGrid`: default `true`
- `maxRenderedPoints`: default `5000`

If the point count exceeds `maxRenderedPoints`, the interface downsamples the rendered chart only. The stored JSON is not changed.

## Limitations

- Validation is intentionally minimal and client-side.
- Points must contain finite numeric `x` and `y` values.
- `name`, axis labels, and units are optional strings.
- No backend endpoint, module, layout, panel, flow, or external storage is included.

## Report issues
Please report any issues on the [GitHub project](https://github.com/Ayrcs/directus-extension-json-apex-chart])
