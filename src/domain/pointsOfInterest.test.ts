import { describe, expect, it } from "vitest";

import { MAP_HEIGHT_CM, MAP_WIDTH_CM } from "./conversion";
import {
  pointOfInterestAnswers,
  pointOfInterestMeasurements,
  pointOfInterestNames,
} from "./pointsOfInterest";

describe("the supplied exercise data", () => {
  it("pairs every measurement with a published answer", () => {
    expect(Object.keys(pointOfInterestAnswers).sort()).toEqual(
      [...pointOfInterestNames].sort(),
    );
  });

  it("keeps every measurement on the sheet", () => {
    for (const name of pointOfInterestNames) {
      const { x, y } = pointOfInterestMeasurements[name];
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(MAP_WIDTH_CM);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(MAP_HEIGHT_CM);
    }
  });

  it("publishes answers that are valid coordinates", () => {
    for (const name of pointOfInterestNames) {
      const { lng, lat } = pointOfInterestAnswers[name];
      expect(Math.abs(lng)).toBeLessThanOrEqual(180);
      expect(Math.abs(lat)).toBeLessThanOrEqual(90);
    }
  });

  it("puts the tops north of the bottoms", () => {
    // A lng/lat transposition, or a y axis pointing the wrong way, shows up
    // here before it shows up as a pin in the wrong ocean.
    expect(pointOfInterestAnswers.TopOfAfrica.lat).toBeGreaterThan(
      pointOfInterestAnswers.BottomOfAfrica.lat,
    );
    expect(pointOfInterestAnswers.TopOfGreenland.lat).toBeGreaterThan(
      pointOfInterestAnswers.BottomOfGreenland.lat,
    );
    expect(pointOfInterestMeasurements.TopOfAfrica.y).toBeLessThan(
      pointOfInterestMeasurements.BottomOfAfrica.y,
    );
  });
});
