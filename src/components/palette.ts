/**
 * Map colours shared by both basemaps. Mapbox paint properties take plain
 * strings rather than CSS custom properties, so they live here instead of in
 * the stylesheet; globals.css repeats the three that the key swatches use.
 */
export const palette = {
  pin: "#c2410c",
  brazil: "#3f7d4e",
  brazilStroke: "#24502f",
  polygon: "#1d5b8f",
  polygonStroke: "#123d61",
} as const;
