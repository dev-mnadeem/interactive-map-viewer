import {
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { geoGraticule10, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import countries110m from "world-atlas/countries-110m.json";

import type { LngLatLiteral } from "../domain/conversion";
import {
  createOutlineProjection,
  invertOnGlobe,
  OUTLINE_HEIGHT,
  OUTLINE_WIDTH,
  toSphericalPolygon,
} from "../domain/outlineProjection";
import { isDrawablePolygon } from "../domain/polygon";
import { pointsOfInterest } from "../domain/pointsOfInterest";
import styles from "../styles/OutlineMap.module.css";
import { palette } from "./palette";

type Props = {
  vertices: LngLatLiteral[];
  brazil: LngLatLiteral[];
  onMapClick: (lngLat: LngLatLiteral) => void;
  onVertexMove: (index: number, lngLat: LngLatLiteral) => void;
};

// Natural Earth 1:110m, as TopoJSON. Public domain; see README.
const world = countries110m as unknown as Topology<{
  countries: GeometryCollection;
  land: GeometryCollection;
}>;

const projection = createOutlineProjection();
const path = geoPath(projection);

// The basemap never changes, so its SVG path strings are computed once.
const basemap = {
  sphere: path({ type: "Sphere" }) ?? "",
  graticule: path(geoGraticule10()) ?? "",
  land: path(feature(world, world.objects.land)) ?? "",
  borders:
    path(mesh(world, world.objects.countries, (a, b) => a !== b)) ?? "",
};

/** Converts a pointer position to the SVG's own coordinate system. */
function toSvgPoint(
  svg: SVGSVGElement,
  event: PointerEvent | MouseEvent,
): [number, number] | null {
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
    matrix.inverse(),
  );
  return [point.x, point.y];
}

/**
 * The map used when no Mapbox token is configured.
 *
 * It draws the same Equal Earth view as the Mapbox basemap, but from bundled
 * Natural Earth outlines in plain SVG, so it needs no token, no WebGL and no
 * network. Clicking and dragging behave as they do on the Mapbox map.
 */
export default function OutlineMap({
  vertices,
  brazil,
  onMapClick,
  onVertexMove,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  const brazilPath = useMemo(
    () => (isDrawablePolygon(brazil) ? path(toSphericalPolygon(brazil)) ?? "" : ""),
    [brazil],
  );
  const polygonPath = useMemo(
    () =>
      isDrawablePolygon(vertices) ? path(toSphericalPolygon(vertices)) ?? "" : "",
    [vertices],
  );

  const lngLatAt = (event: PointerEvent | MouseEvent) => {
    const svg = svgRef.current;
    const point = svg && toSvgPoint(svg, event);
    return point ? invertOnGlobe(projection, point) : null;
  };

  const handleClick = (event: MouseEvent<SVGSVGElement>) => {
    const lngLat = lngLatAt(event);
    if (lngLat) onMapClick(lngLat);
  };

  const handleDrag = (index: number) => (event: PointerEvent<SVGCircleElement>) => {
    if (dragging !== index) return;
    const lngLat = lngLatAt(event);
    if (lngLat) onVertexMove(index, lngLat);
  };

  return (
    <figure className={styles.figure}>
      <svg
        ref={svgRef}
        className={styles.map}
        viewBox={`0 0 ${OUTLINE_WIDTH} ${OUTLINE_HEIGHT}`}
        aria-label="World map in the Equal Earth projection. Click to take a reading and add a polygon corner."
        onClick={handleClick}
      >
        <path className={styles.ocean} d={basemap.sphere} />
        <path className={styles.graticule} d={basemap.graticule} />
        <path className={styles.land} d={basemap.land} />
        <path className={styles.borders} d={basemap.borders} />

        {brazilPath ? (
          <path
            d={brazilPath}
            fill={palette.brazil}
            fillOpacity={0.55}
            stroke={palette.brazilStroke}
            strokeWidth={1.5}
          />
        ) : null}

        {polygonPath ? (
          <path
            d={polygonPath}
            fill={palette.polygon}
            fillOpacity={0.3}
            stroke={palette.polygonStroke}
            strokeWidth={2}
          />
        ) : null}

        <path className={styles.rim} d={basemap.sphere} />

        {pointsOfInterest.map(({ name, label, lngLat }) => {
          const [x, y] = projection([lngLat.lng, lngLat.lat]) ?? [0, 0];
          return (
            <g key={name} className={styles.pin} transform={`translate(${x} ${y})`}>
              <title>{label}</title>
              <circle r={6} fill={palette.pin} />
              <circle r={2.2} fill="#fff" />
            </g>
          );
        })}

        {vertices.map((vertex, index) => {
          const [x, y] = projection([vertex.lng, vertex.lat]) ?? [0, 0];
          return (
            <circle
              key={index}
              className={styles.handle}
              cx={x}
              cy={y}
              r={7}
              fill="#fff"
              stroke={palette.polygonStroke}
              strokeWidth={2.5}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setDragging(index);
              }}
              onPointerMove={handleDrag(index)}
              onPointerUp={() => setDragging(null)}
              onPointerCancel={() => setDragging(null)}
            >
              <title>{`Corner ${index + 1}: drag to move`}</title>
            </circle>
          );
        })}
      </svg>
      <figcaption className={styles.caption}>
        Equal Earth outlines from Natural Earth, drawn locally. Set{" "}
        <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> for Mapbox street tiles instead.
      </figcaption>
    </figure>
  );
}
