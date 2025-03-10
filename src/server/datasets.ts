/**
 * The extensibility seam.
 *
 * Every dataset the API serves is declared here, once. Serving another of the
 * 197 outlines under `world-geojson/` means adding an entry and a three-line
 * route that names it -- not another copy of the file-streaming code.
 */
export type Dataset = {
  /** Path relative to the project root. */
  readonly path: string;
  /** What the file holds, for anyone adding to this list. */
  readonly description: string;
  /**
   * How long a browser or CDN may cache the response, in seconds.
   *
   * These files are generated build inputs that never change for a given
   * deploy, so they are safe to cache hard. Without this the 600 KB country
   * outlines were re-downloaded on every page load.
   */
  readonly maxAgeSeconds: number;
};

const ONE_DAY = 60 * 60 * 24;

export const datasets = {
  brazilCoastline: {
    path: "public/partial-brazil.json",
    description:
      "Brazil's coastline as [x, y] centimetre measurements on the paper map",
    maxAgeSeconds: ONE_DAY,
  },
  countryCoordinatePolygons: {
    path: "public/countries_coords.json",
    description:
      "Every country outline in longitude/latitude, merged by scripts in world-geojson/",
    maxAgeSeconds: ONE_DAY,
  },
  countryPhysicalPolygons: {
    path: "public/countries_physical.json",
    description:
      "Every country outline as centimetre measurements on the paper map",
    maxAgeSeconds: ONE_DAY,
  },
} as const satisfies Record<string, Dataset>;

export type DatasetName = keyof typeof datasets;
