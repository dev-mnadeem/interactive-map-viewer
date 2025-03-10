import { geoArea } from "d3-geo";
import { describe, expect, it } from "vitest";

import type { LngLatLiteral } from "./conversion";
import {
  createOutlineProjection,
  invertOnGlobe,
  OUTLINE_HEIGHT,
  OUTLINE_WIDTH,
  toSphericalPolygon,
} from "./outlineProjection";
import { pointsOfInterest } from "./pointsOfInterest";

const projection = createOutlineProjection();

describe("createOutlineProjection", () => {
  it("puts null island at the centre of the drawing", () => {
    const [x, y] = projection([0, 0])!;
    expect(x).toBeCloseTo(OUTLINE_WIDTH / 2, 6);
    expect(y).toBeCloseTo(OUTLINE_HEIGHT / 2, 6);
  });

  it("keeps the whole globe inside the drawing", () => {
    for (const [lng, lat] of [
      [-180, 0],
      [180, 0],
      [0, 90],
      [0, -90],
    ]) {
      const [x, y] = projection([lng, lat])!;
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(OUTLINE_WIDTH);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(OUTLINE_HEIGHT);
    }
  });
});

describe("invertOnGlobe", () => {
  it("reads back each supplied measurement from where it is drawn", () => {
    for (const { label, lngLat } of pointsOfInterest) {
      const point = projection([lngLat.lng, lngLat.lat])!;
      const back = invertOnGlobe(projection, point);
      expect(back, label).not.toBeNull();
      expect(back!.lng).toBeCloseTo(lngLat.lng, 6);
      expect(back!.lat).toBeCloseTo(lngLat.lat, 6);
    }
  });

  it("ignores clicks in the corners, outside the globe", () => {
    expect(invertOnGlobe(projection, [2, 2])).toBeNull();
    expect(invertOnGlobe(projection, [OUTLINE_WIDTH - 2, OUTLINE_HEIGHT - 2])).toBeNull();
  });

  it("ignores clicks just beyond the left and right edges", () => {
    const [left] = projection([-180, 0])!;
    const [right] = projection([180, 0])!;
    expect(invertOnGlobe(projection, [left - 3, OUTLINE_HEIGHT / 2])).toBeNull();
    expect(invertOnGlobe(projection, [right + 3, OUTLINE_HEIGHT / 2])).toBeNull();
  });
});

describe("toSphericalPolygon", () => {
  const square: LngLatLiteral[] = [
    { lng: 0, lat: 0 },
    { lng: 10, lat: 0 },
    { lng: 10, lat: 10 },
    { lng: 0, lat: 10 },
  ];
  const tenDegreeSquare = (polygon: ReturnType<typeof toSphericalPolygon>) =>
    geoArea(polygon) < 0.05;

  it("encloses the small shape whichever way the ring was drawn", () => {
    expect(tenDegreeSquare(toSphericalPolygon(square))).toBe(true);
    expect(tenDegreeSquare(toSphericalPolygon([...square].reverse()))).toBe(true);
  });

  it("still closes the ring", () => {
    const ring = toSphericalPolygon(square).coordinates[0];
    expect(ring).toHaveLength(5);
    expect(ring[4]).toEqual(ring[0]);
  });
});
