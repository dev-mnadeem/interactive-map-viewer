import { useMemo } from "react";
import { Layer, Marker, Source } from "react-map-gl";

import type { LngLatLiteral } from "../domain/conversion";
import { isDrawablePolygon, toGeoJsonPolygon } from "../domain/polygon";

type Props = {
  id: string;
  lngLats: LngLatLiteral[];
  fillColor: string;
  strokeColor: string;
  /**
   * Show a draggable handle on every vertex. Sensible for a polygon the user
   * drew; not for imported outlines, where a coastline's few hundred points
   * become a wall of overlapping pins that hides the shape underneath.
   */
  editable?: boolean;
  /** Called with a vertex's new position when its handle is dropped. */
  onVertexMove?: (index: number, lngLat: LngLatLiteral) => void;
};

export default function LngLatPolygon({
  id,
  lngLats,
  fillColor,
  strokeColor,
  editable = false,
  onVertexMove,
}: Props) {
  const geoJson = useMemo(() => toGeoJsonPolygon(lngLats), [lngLats]);

  return (
    <>
      {isDrawablePolygon(lngLats) ? (
        <Source id={id} type="geojson" data={geoJson}>
          <Layer
            id={`${id}fill`}
            source={id}
            type="fill"
            paint={{ "fill-color": fillColor, "fill-opacity": 0.35 }}
          />
          <Layer
            id={`${id}outline`}
            source={id}
            type="line"
            paint={{ "line-color": strokeColor, "line-width": 2 }}
          />
        </Source>
      ) : null}

      {editable
        ? lngLats.map((point, index) => (
            <Marker
              key={`${id}-${index}`}
              latitude={point.lat}
              longitude={point.lng}
              draggable
              color={strokeColor}
              onDragEnd={(event) =>
                onVertexMove?.(index, {
                  lng: event.lngLat.lng,
                  lat: event.lngLat.lat,
                })
              }
            />
          ))
        : null}
    </>
  );
}
