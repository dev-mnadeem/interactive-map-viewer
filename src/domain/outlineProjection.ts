import { geoArea, geoEqualEarth, type GeoProjection } from "d3-geo";
import type { Polygon } from "geojson";

import type { LngLatLiteral } from "./conversion";
import { toGeoJsonPolygon } from "./polygon";

/** The token-free map's drawing surface, in SVG user units. Equal Earth is about 2.05:1. */
export const OUTLINE_WIDTH = 960;
export const OUTLINE_HEIGHT = 470;
const PADDING = 4;

/** The Equal Earth projection, fitted so the whole globe fills the drawing surface. */
export function createOutlineProjection(): GeoProjection {
  return geoEqualEarth().fitExtent(
    [
      [PADDING, PADDING],
      [OUTLINE_WIDTH - PADDING, OUTLINE_HEIGHT - PADDING],
    ],
    { type: "Sphere" },
  );
}

/**
 * The geographic coordinate under an SVG point, or `null` for the corners
 * outside the globe.
 *
 * Equal Earth's inverse does not reject those points itself: past the edge it
 * returns longitudes beyond +/-180 or a latitude that does not project back to
 * where the user clicked. Round-tripping catches both.
 */
export function invertOnGlobe(
  projection: GeoProjection,
  [x, y]: [number, number],
): LngLatLiteral | null {
  const inverted = projection.invert?.([x, y]);
  if (!inverted || !inverted.every(Number.isFinite)) return null;

  const [lng, lat] = inverted;
  if (Math.abs(lng) > 180 || Math.abs(lat) > 90) return null;

  const back = projection([lng, lat]);
  if (!back || Math.hypot(back[0] - x, back[1] - y) > 0.5) return null;

  return { lng, lat };
}

/**
 * A GeoJSON polygon wound the way d3-geo expects.
 *
 * d3 draws polygons on the sphere, where a ring encloses whichever side is
 * on its right, and so reads a counter-clockwise ring as "the whole world
 * except this shape". A click-built polygon or a traced coastline can wind
 * either way. Real shapes here are always smaller than a hemisphere, so a
 * polygon covering more than half the sphere is reversed.
 */
export function toSphericalPolygon(lngLats: LngLatLiteral[]): Polygon {
  const polygon = toGeoJsonPolygon(lngLats);
  if (geoArea(polygon) <= 2 * Math.PI) return polygon;
  return { type: "Polygon", coordinates: [[...polygon.coordinates[0]].reverse()] };
}
