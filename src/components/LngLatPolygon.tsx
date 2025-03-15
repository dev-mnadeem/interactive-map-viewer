import React, { useMemo } from "react";
import { Layer, Marker, Source } from "react-map-gl";

import type { LngLatLiteral } from "../domain/conversion";
import { isDrawablePolygon, toGeoJsonPolygon } from "../domain/polygon";

import "mapbox-gl/dist/mapbox-gl.css";

type Props = {
  id: string;
  lngLats: LngLatLiteral[];
  fillColor?: string;
  strokeColor?: string;
  markerColor?: string;
  /**
   * Show a draggable handle on every vertex. Sensible for a polygon the user
   * drew; not for imported outlines, where a coastline's few hundred points
   * become a wall of overlapping pins that hides the shape underneath.
   */
  editable?: boolean;
  /** Called with the updated ring when a vertex is dragged. */
  onChange?: (lngLats: LngLatLiteral[]) => void;
};

export default function LngLatPolygon({
  id,
  lngLats,
  fillColor = "#0080ff",
  strokeColor = "#000",
  markerColor,
  editable = false,
  onChange,
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
            paint={{ "fill-color": fillColor, "fill-opacity": 0.5 }}
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
              color={markerColor}
              onDragEnd={(event) => {
                // Without this the handles were draggable but inert: the pin
                // moved and the polygon stayed where it was.
                const next = [...lngLats];
                next[index] = { lng: event.lngLat.lng, lat: event.lngLat.lat };
                onChange?.(next);
              }}
            />
          ))
        : null}
    </>
  );
}
