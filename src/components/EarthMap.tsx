import React, { useState } from "react";
import MapGL, { Marker } from "react-map-gl";
import type { MapMouseEvent } from "mapbox-gl";

import {
  convertLngLatToPhysicalMapMeasurement,
  convertPhysicalMapMeasurementToLngLat,
  type LngLatLiteral,
  type Point,
} from "../domain/conversion";
import {
  pointOfInterestMeasurements,
  pointOfInterestNames,
} from "../domain/pointsOfInterest";
import { useCoastline } from "../hooks/useCoastline";
import LngLatPolygon from "./LngLatPolygon";

import "mapbox-gl/dist/mapbox-gl.css";

type Props = {
  mapboxToken: string;
  /** Called with the paper-map position of each click, in centimetres. */
  onMeasure: (measurement: Point) => void;
};

/**
 * The map itself.
 *
 * Kept in its own module so the page can load it with `next/dynamic`. Mapbox GL
 * JS is ~400 KB and needs a WebGL context, so there is nothing to gain from
 * putting it in the server-rendered bundle.
 */
export default function EarthMap({ mapboxToken, onMeasure }: Props) {
  const [polygonCoordinates, setPolygonCoordinates] = useState<LngLatLiteral[]>(
    [],
  );
  const coastline = useCoastline("/api/brazil");

  const handleClick = (event: MapMouseEvent) => {
    // `event.point` is the click in screen pixels. What the readout is meant to
    // show is where that lands on the 100 x 64 cm paper map, which is the
    // inverse conversion.
    const lngLat = { lng: event.lngLat.lng, lat: event.lngLat.lat };
    onMeasure(convertLngLatToPhysicalMapMeasurement(lngLat));
    setPolygonCoordinates((previous) => [...previous, lngLat]);
  };

  return (
    <MapGL
      id="earth"
      initialViewState={{ longitude: 0, latitude: 0, zoom: 0.5 }}
      style={{ display: "flex", flex: 1, flexGrow: 1, width: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      mapboxAccessToken={mapboxToken}
      projection="equalEarth"
      onClick={handleClick}
    >
      <Marker longitude={0} latitude={0} color="red" />

      {pointOfInterestNames.map((name) => {
        const { lng, lat } = convertPhysicalMapMeasurementToLngLat(
          pointOfInterestMeasurements[name],
        );
        return <Marker key={name} longitude={lng} latitude={lat} color="red" />;
      })}

      <LngLatPolygon
        id="user-polygon"
        lngLats={polygonCoordinates}
        editable
        onChange={setPolygonCoordinates}
      />
      <LngLatPolygon
        id="brazil"
        lngLats={coastline.points}
        fillColor="#00a000"
        strokeColor="#004d00"
      />
    </MapGL>
  );
}
