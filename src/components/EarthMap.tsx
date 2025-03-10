import MapGL, { Marker } from "react-map-gl";
import type { MapMouseEvent } from "mapbox-gl";

import type { LngLatLiteral } from "../domain/conversion";
import { pointsOfInterest } from "../domain/pointsOfInterest";
import { palette } from "./palette";
import LngLatPolygon from "./LngLatPolygon";

import "mapbox-gl/dist/mapbox-gl.css";

type Props = {
  mapboxToken: string;
  vertices: LngLatLiteral[];
  brazil: LngLatLiteral[];
  onMapClick: (lngLat: LngLatLiteral) => void;
  onVertexMove: (index: number, lngLat: LngLatLiteral) => void;
};

/**
 * The Mapbox basemap, used when a token is configured.
 *
 * Kept in its own module so the page can load it with `next/dynamic`. Mapbox GL
 * JS is ~400 KB and needs a WebGL context, so there is nothing to gain from
 * putting it in the server-rendered bundle.
 */
export default function EarthMap({
  mapboxToken,
  vertices,
  brazil,
  onMapClick,
  onVertexMove,
}: Props) {
  return (
    <MapGL
      id="earth"
      initialViewState={{ longitude: 0, latitude: 0, zoom: 0.5 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      mapboxAccessToken={mapboxToken}
      projection="equalEarth"
      onClick={(event: MapMouseEvent) =>
        onMapClick({ lng: event.lngLat.lng, lat: event.lngLat.lat })
      }
    >
      {pointsOfInterest.map(({ name, lngLat }) => (
        <Marker
          key={name}
          longitude={lngLat.lng}
          latitude={lngLat.lat}
          color={palette.pin}
        />
      ))}

      <LngLatPolygon
        id="brazil"
        lngLats={brazil}
        fillColor={palette.brazil}
        strokeColor={palette.brazilStroke}
      />
      <LngLatPolygon
        id="user-polygon"
        lngLats={vertices}
        fillColor={palette.polygon}
        strokeColor={palette.polygonStroke}
        editable
        onVertexMove={onVertexMove}
      />
    </MapGL>
  );
}
