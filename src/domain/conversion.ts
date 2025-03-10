/**
 * The conversion at the centre of the exercise: a ruler measurement taken off a
 * 100 x 64 cm Mercator wall map, in centimetres from its top-left corner, to a
 * longitude and latitude -- and back again.
 *
 * This module is deliberately free of any map-rendering dependency. It is plain
 * arithmetic over plain objects, so it can be tested without a browser, a WebGL
 * context or a Mapbox token.
 */

/** A measurement on the paper map, in centimetres from the top-left corner. */
export type Point = {
  x: number;
  y: number;
};

/**
 * A geographic coordinate. Structurally compatible with Mapbox's `LngLat`
 * class, so a real `LngLat` can be passed wherever this is accepted -- but
 * nothing here depends on Mapbox.
 */
export type LngLatLiteral = {
  lng: number;
  lat: number;
};

/** The paper map this project measures, in centimetres. */
export const MAP_WIDTH_CM = 100;
export const MAP_HEIGHT_CM = 64;

/**
 * The latitude at the top edge of the map.
 *
 * Mercator never reaches the poles: the projection sends latitude 90 degrees to
 * infinite height, so a sheet of any finite size has to stop short. For this one
 * that is +/-85.0511 degrees.
 */
export const MAX_MERCATOR_LATITUDE = gudermannian(Math.PI);

/**
 * Converts a physical map measurement from the top-left corner of the map into
 * a longitude and latitude.
 *
 * There is no special case for the top and bottom edges. `y = 0` yields
 * +85.0511 degrees, which is where the map edge genuinely sits; returning +90
 * there instead would put a 4.95 degree jump into an otherwise continuous
 * function and place the top row of the sheet on the North Pole.
 */
export function convertPhysicalMapMeasurementToLngLat(
  point: Point,
): LngLatLiteral {
  return {
    lng: convertRange(point.x, [0, MAP_WIDTH_CM], [-180, 180]),
    lat: gudermannian(
      convertRange(point.y, [0, MAP_HEIGHT_CM], [Math.PI, -Math.PI]),
    ),
  };
}

/**
 * Converts a longitude and latitude back into a physical map measurement from
 * the top-left corner of the map.
 *
 * The poles are genuinely unrepresentable -- `inverseGudermannian(+/-90)`
 * diverges -- so there is no `y` to return for them. Clamping to the map edge
 * is more useful than emitting `Infinity`.
 */
export function convertLngLatToPhysicalMapMeasurement(
  lngLat: LngLatLiteral,
): Point {
  const x = convertRange(lngLat.lng, [-180, 180], [0, MAP_WIDTH_CM]);

  if (Math.abs(lngLat.lat) >= MAX_MERCATOR_LATITUDE) {
    return { x, y: lngLat.lat > 0 ? 0 : MAP_HEIGHT_CM };
  }

  return {
    x,
    y: convertRange(
      inverseGudermannian(lngLat.lat),
      [Math.PI, -Math.PI],
      [0, MAP_HEIGHT_CM],
    ),
  };
}

/**
 * Rescales `value` from range `from` onto range `to`.
 *
 * @example convertRange(5, [0, 10], [0, 100]) === 50
 */
function convertRange(
  value: number,
  from: [number, number],
  to: [number, number],
): number {
  return ((value - from[0]) * (to[1] - to[0])) / (from[1] - from[0]) + to[0];
}

/**
 * The Gudermannian function: Mercator's vertical axis to latitude, in degrees.
 * `y` is expected in [-PI, PI].
 */
function gudermannian(y: number): number {
  return Math.atan(Math.sinh(y)) * (180 / Math.PI);
}

/**
 * The inverse Gudermannian: latitude in degrees to Mercator's vertical axis.
 * Diverges at +/-90 degrees, which is why callers clamp before reaching it.
 */
function inverseGudermannian(latitudeDegrees: number): number {
  const sign = Math.sign(latitudeDegrees);
  const sine = Math.sin(latitudeDegrees * (Math.PI / 180) * sign);
  return sign * (Math.log((1 + sine) / (1 - sine)) / 2);
}
