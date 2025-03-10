import type { Polygon as GeoJSONPolygon } from "geojson";

import type { LngLatLiteral } from "./conversion";

/** A GeoJSON polygon needs at least three distinct vertices to enclose an area. */
export const MINIMUM_RING_VERTICES = 3;

/**
 * Builds a GeoJSON polygon from an ordered list of coordinates.
 *
 * The GeoJSON specification requires a linear ring to be closed -- the last
 * position must repeat the first -- so the ring is closed here. An empty input
 * is returned as an empty ring rather than one containing `undefined`, which is
 * what pushing `pointArray[0]` unguarded used to produce.
 */
export function toGeoJsonPolygon(lngLats: LngLatLiteral[]): GeoJSONPolygon {
  const ring = lngLats.map(({ lng, lat }) => [lng, lat]);

  if (ring.length > 0) {
    ring.push(ring[0]);
  }

  return { type: "Polygon", coordinates: [ring] };
}

/** Whether `lngLats` has enough vertices to be drawn as a filled polygon. */
export function isDrawablePolygon(lngLats: LngLatLiteral[]): boolean {
  return lngLats.length >= MINIMUM_RING_VERTICES;
}
