import type { LngLatLiteral, Point } from "./conversion";

/**
 * The four points of interest the exercise supplies, and the answers it
 * publishes for them.
 *
 * These measurements were previously written out twice -- once in the map page
 * and once in the test file -- which meant a correction to one copy would have
 * silently left the other checking the wrong thing. They live here once.
 *
 * `public/map-measurement.jpg` is the supplied illustration of how `TopOfAfrica`
 * was measured: 52.69693 cm across, 24.84317 cm down.
 */
export type PointOfInterestName =
  | "TopOfAfrica"
  | "BottomOfAfrica"
  | "TopOfGreenland"
  | "BottomOfGreenland";

/** Centimetres from the top-left corner of the 100 x 64 cm paper map. */
export const pointOfInterestMeasurements: Record<PointOfInterestName, Point> = {
  TopOfAfrica: { x: 52.69693, y: 24.84317 },
  BottomOfAfrica: { x: 55.5135, y: 38.59828 },
  TopOfGreenland: { x: 39.76147, y: 2.66733 },
  BottomOfGreenland: { x: 37.861265, y: 18.61392 },
};

/**
 * The longitude and latitude the exercise says each measurement should convert
 * to. This is an answer key, not an input: nothing in the app reads it, and the
 * test suite is the only consumer.
 */
export const pointOfInterestAnswers: Record<PointOfInterestName, LngLatLiteral> =
  {
    TopOfAfrica: { lng: 9.70893415398347, lat: 37.3028518427388 },
    BottomOfAfrica: { lng: 19.848608538081823, lat: -34.762562361125816 },
    TopOfGreenland: { lng: -36.858719070719985, lat: 83.57243227575361 },
    BottomOfGreenland: { lng: -43.69944428498619, lat: 59.92017890458983 },
  };

export const pointOfInterestNames = Object.keys(
  pointOfInterestMeasurements,
) as PointOfInterestName[];
