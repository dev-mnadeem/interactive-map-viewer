import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { convertLngLatToPhysicalMapMeasurement } from "../domain/conversion";
import { datasets } from "./datasets";

// Both files are written by world-geojson/get_all_polygons.py, whose Python
// copy of the conversion has to agree with src/domain/conversion.ts.
type Outlines = Record<string, [number, number][]>;

const read = (relativePath: string): Outlines =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), relativePath), "utf8"));

const coords = read(datasets.countryCoordinatePolygons.path);
const physical = read(datasets.countryPhysicalPolygons.path);

const latitudeSpan = (ring: [number, number][]) => {
  const lats = ring.map(([, lat]) => lat);
  return Math.max(...lats) - Math.min(...lats);
};

describe("the merged country outlines", () => {
  it("cover the same countries, vertex for vertex", () => {
    expect(Object.keys(physical).sort()).toEqual(Object.keys(coords).sort());
    for (const name of Object.keys(coords)) {
      expect(physical[name], name).toHaveLength(coords[name].length);
    }
  });

  it("hold paper measurements that match the TypeScript conversion", () => {
    for (const [name, ring] of Object.entries(coords)) {
      ring.forEach(([lng, lat], index) => {
        const expected = convertLngLatToPhysicalMapMeasurement({ lng, lat });
        const [x, y] = physical[name][index];
        expect(x, `${name}[${index}].x`).toBeCloseTo(expected.x, 9);
        expect(y, `${name}[${index}].y`).toBeCloseTo(expected.y, 9);
      });
    }
  });

  it("keep each country's mainland rather than its first island", () => {
    // Mainland Chile runs from about 17.5 S to 56 S. The generator used to
    // compare polygons by ring count and kept a small offshore island instead.
    expect(latitudeSpan(coords.chile)).toBeGreaterThan(30);
    expect(latitudeSpan(coords.japan)).toBeGreaterThan(5);
  });

  it("leave out the countries the exercise draws itself", () => {
    for (const name of ["brazil", "france", "usa", "spain"]) {
      expect(coords).not.toHaveProperty(name);
    }
  });
});
