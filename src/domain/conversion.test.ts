import { describe, expect, it } from "vitest";

import {
  convertLngLatToPhysicalMapMeasurement,
  convertPhysicalMapMeasurementToLngLat,
  MAP_HEIGHT_CM as MAP_HEIGHT,
  MAP_WIDTH_CM as MAP_WIDTH,
  MAX_MERCATOR_LATITUDE,
  type Point,
} from "./conversion";
import {
  pointOfInterestAnswers,
  pointOfInterestMeasurements as physical,
  pointOfInterestNames,
} from "./pointsOfInterest";

describe("the supplied points of interest", () => {
  // pointsOfInterest.ts ships the expected answers. Nothing in the project
  // ever checked the conversion against them.
  it.each(pointOfInterestNames)(
    "converts %s to its published longitude and latitude",
    (name) => {
      const got = convertPhysicalMapMeasurementToLngLat(physical[name]);
      const { lng, lat } = pointOfInterestAnswers[name];
      // 1e-4 deg is ~11 m; the published constants are rounded, so the
      // residual is theirs, not the conversion's.
      expect(got.lng).toBeCloseTo(lng, 4);
      expect(got.lat).toBeCloseTo(lat, 4);
    },
  );
});

describe("round tripping", () => {
  it("returns the original measurement for points across the whole map", () => {
    for (let x = 0; x <= MAP_WIDTH; x += 6.25) {
      for (let y = 0; y <= MAP_HEIGHT; y += 4) {
        const back = convertLngLatToPhysicalMapMeasurement(
          convertPhysicalMapMeasurementToLngLat({ x, y }),
        );
        expect(back.x).toBeCloseTo(x, 9);
        expect(back.y).toBeCloseTo(y, 9);
      }
    }
  });

  it("returns the original coordinate for longitudes and latitudes in range", () => {
    for (let lng = -180; lng <= 180; lng += 22.5) {
      for (let lat = -85; lat <= 85; lat += 8.5) {
        const back = convertPhysicalMapMeasurementToLngLat(
          convertLngLatToPhysicalMapMeasurement({ lng, lat }),
        );
        expect(back.lng).toBeCloseTo(lng, 9);
        expect(back.lat).toBeCloseTo(lat, 9);
      }
    }
  });
});

describe("anchors", () => {
  it("puts the centre of the map at null island", () => {
    const c = convertPhysicalMapMeasurementToLngLat({
      x: MAP_WIDTH / 2,
      y: MAP_HEIGHT / 2,
    });
    expect(c.lng).toBeCloseTo(0, 10);
    expect(c.lat).toBeCloseTo(0, 10);
  });

  it("puts the map edges at the Mercator limit, not at the poles", () => {
    const top = convertPhysicalMapMeasurementToLngLat({ x: 0, y: 0 });
    const bottom = convertPhysicalMapMeasurementToLngLat({ x: MAP_WIDTH, y: MAP_HEIGHT });
    expect(top.lat).toBeCloseTo(85.0511, 3);
    expect(bottom.lat).toBeCloseTo(-85.0511, 3);
    expect(top.lng).toBeCloseTo(-180, 10);
    expect(bottom.lng).toBeCloseTo(180, 10);
  });
});

describe("continuity", () => {
  // The original special-cased y === 0 and y === mapHeight to +/-90, putting a
  // 4.95 degree cliff at each edge of an otherwise smooth function.
  it("has no jump at the top and bottom edges", () => {
    const atTop = convertPhysicalMapMeasurementToLngLat({ x: 50, y: 0 }).lat;
    const nearTop = convertPhysicalMapMeasurementToLngLat({ x: 50, y: 1e-6 }).lat;
    expect(Math.abs(atTop - nearTop)).toBeLessThan(1e-4);

    const atBottom = convertPhysicalMapMeasurementToLngLat({ x: 50, y: MAP_HEIGHT }).lat;
    const nearBottom = convertPhysicalMapMeasurementToLngLat({
      x: 50,
      y: MAP_HEIGHT - 1e-6,
    }).lat;
    expect(Math.abs(atBottom - nearBottom)).toBeLessThan(1e-4);
  });

  it("decreases latitude monotonically as y increases", () => {
    let previous = Infinity;
    for (let y = 0; y <= MAP_HEIGHT; y += 0.5) {
      const { lat } = convertPhysicalMapMeasurementToLngLat({ x: 50, y });
      expect(lat).toBeLessThan(previous);
      previous = lat;
    }
  });
});

describe("the poles", () => {
  // Mercator cannot represent them: the inverse Gudermannian diverges.
  it("clamps to the map edge instead of returning Infinity", () => {
    const north = convertLngLatToPhysicalMapMeasurement({ lng: 0, lat: 90 });
    const south = convertLngLatToPhysicalMapMeasurement({ lng: 0, lat: -90 });
    expect(Number.isFinite(north.y)).toBe(true);
    expect(Number.isFinite(south.y)).toBe(true);
    expect(north.y).toBe(0);
    expect(south.y).toBe(MAP_HEIGHT);
  });

  it("exposes the limit it clamps at", () => {
    expect(MAX_MERCATOR_LATITUDE).toBeCloseTo(85.0511, 3);
  });
});

describe("the distortion the exercise is about", () => {
  const heightOnPaper = (top: Point, bottom: Point) => bottom.y - top.y;
  const spanInDegrees = (top: Point, bottom: Point) =>
    convertPhysicalMapMeasurementToLngLat(top).lat -
    convertPhysicalMapMeasurementToLngLat(bottom).lat;

  it("draws Greenland taller than Africa on paper", () => {
    const greenland = heightOnPaper(physical.TopOfGreenland, physical.BottomOfGreenland);
    const africa = heightOnPaper(physical.TopOfAfrica, physical.BottomOfAfrica);
    expect(greenland).toBeGreaterThan(africa);
  });

  it("but Africa spans about three times the latitude", () => {
    const greenland = spanInDegrees(physical.TopOfGreenland, physical.BottomOfGreenland);
    const africa = spanInDegrees(physical.TopOfAfrica, physical.BottomOfAfrica);
    expect(africa / greenland).toBeGreaterThan(2.9);
    expect(africa / greenland).toBeLessThan(3.1);
  });
});
