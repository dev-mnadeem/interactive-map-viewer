import { describe, expect, it } from "vitest";

import type { LngLatLiteral } from "./conversion";
import { isDrawablePolygon, toGeoJsonPolygon } from "./polygon";

const ring = (...pairs: [number, number][]): LngLatLiteral[] =>
  pairs.map(([lng, lat]) => ({ lng, lat }));

describe("toGeoJsonPolygon", () => {
  it("writes positions in GeoJSON order, longitude first", () => {
    // The classic way to put a polygon in the wrong hemisphere: GeoJSON is
    // [longitude, latitude], which is the opposite of how latitude and
    // longitude are spoken.
    const polygon = toGeoJsonPolygon(ring([10, 50]));
    expect(polygon.coordinates[0][0]).toEqual([10, 50]);
  });

  it("closes the ring by repeating the first position last", () => {
    const polygon = toGeoJsonPolygon(ring([0, 0], [10, 0], [10, 10]));
    const positions = polygon.coordinates[0];

    expect(positions).toHaveLength(4);
    expect(positions[positions.length - 1]).toEqual(positions[0]);
  });

  it("returns an empty ring for no input rather than a ring holding undefined", () => {
    // Pushing `positions[0]` unguarded produced `[undefined]`, which Mapbox
    // rejects at draw time rather than at build time.
    const polygon = toGeoJsonPolygon([]);

    expect(polygon.coordinates[0]).toEqual([]);
    expect(polygon.coordinates[0]).not.toContain(undefined);
  });

  it("does not mutate its input", () => {
    const input = ring([0, 0], [10, 0], [10, 10]);
    toGeoJsonPolygon(input);
    expect(input).toHaveLength(3);
  });

  it("is a Polygon with exactly one ring", () => {
    const polygon = toGeoJsonPolygon(ring([0, 0], [1, 1], [2, 0]));
    expect(polygon.type).toBe("Polygon");
    expect(polygon.coordinates).toHaveLength(1);
  });
});

describe("isDrawablePolygon", () => {
  it("rejects anything that cannot enclose an area", () => {
    expect(isDrawablePolygon([])).toBe(false);
    expect(isDrawablePolygon(ring([0, 0]))).toBe(false);
    expect(isDrawablePolygon(ring([0, 0], [1, 1]))).toBe(false);
  });

  it("accepts three or more vertices", () => {
    expect(isDrawablePolygon(ring([0, 0], [1, 1], [2, 0]))).toBe(true);
    expect(isDrawablePolygon(ring([0, 0], [1, 1], [2, 0], [2, 2]))).toBe(true);
  });
});
