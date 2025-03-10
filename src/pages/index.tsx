import Head from "next/head";
import dynamic from "next/dynamic";
import { useReducer, useState } from "react";

import {
  convertLngLatToPhysicalMapMeasurement,
  type LngLatLiteral,
} from "../domain/conversion";
import { editPolygon } from "../domain/polygonEditing";
import { useCoastline } from "../hooks/useCoastline";
import MissingTokenNotice from "../components/MissingTokenNotice";
import ReadingPanel, { type Reading } from "../components/ReadingPanel";
import styles from "../styles/Home.module.css";

// Mapbox public tokens are meant to ship in client code, but they are billed to
// whoever owns them. Supply your own via .env.local -- see .env.example.
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const MapLoading = () => (
  <p className={styles.mapStatus} role="status">
    Loading the map&hellip;
  </p>
);

// Mapbox GL JS is the bulk of this page's JavaScript and cannot server-render,
// so it is split into its own chunk and loaded in the browser only.
const EarthMap = dynamic(() => import("../components/EarthMap"), {
  ssr: false,
  loading: MapLoading,
});

export default function MapPage() {
  const [reading, setReading] = useState<Reading>();
  const [vertices, editVertices] = useReducer(editPolygon, []);
  const brazil = useCoastline("/api/brazil");

  const takeReading = (lngLat: LngLatLiteral) => {
    setReading({ lngLat, measurement: convertLngLatToPhysicalMapMeasurement(lngLat) });
    editVertices({ type: "append", vertex: lngLat });
  };

  const moveVertex = (index: number, vertex: LngLatLiteral) =>
    editVertices({ type: "move", index, vertex });

  return (
    <>
      <Head>
        <title>The Earth, off a paper map</title>
        <meta
          name="description"
          content="Convert a ruler measurement on a 100 x 64 cm Mercator wall map into a longitude and latitude."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.page}>
        <header className={styles.masthead}>
          <p className={styles.kicker}>100 &times; 64 cm Mercator sheet &rarr; Equal Earth</p>
          <h1 className={styles.title}>The Earth, off a paper map</h1>
          <p className={styles.lede}>
            Click anywhere on the map to see where that spot sits on the paper
            sheet, in centimetres from its top-left corner. Each click also adds
            a corner to a polygon.
          </p>
        </header>

        <main className={styles.layout}>
          <section className={styles.mapFrame} aria-label="Map">
            {MAPBOX_TOKEN ? (
              <EarthMap
                mapboxToken={MAPBOX_TOKEN}
                vertices={vertices}
                brazil={brazil.points}
                onMapClick={takeReading}
                onVertexMove={moveVertex}
              />
            ) : (
              <MissingTokenNotice />
            )}
          </section>

          <ReadingPanel
            reading={reading}
            vertexCount={vertices.length}
            onUndo={() => editVertices({ type: "undo" })}
            onClear={() => editVertices({ type: "clear" })}
            brazil={brazil}
          />
        </main>
      </div>
    </>
  );
}
