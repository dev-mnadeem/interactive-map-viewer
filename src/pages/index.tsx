import Head from "next/head";
import dynamic from "next/dynamic";
import { useState } from "react";

import type { Point } from "../domain/conversion";
import MissingTokenNotice from "../components/MissingTokenNotice";
import styles from "../styles/Home.module.css";

// Mapbox public tokens are meant to ship in client code, but they are billed to
// whoever owns them. Supply your own via .env.local -- see .env.example.
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

// Mapbox GL JS is the bulk of this page's JavaScript and cannot server-render,
// so it is split into its own chunk and loaded in the browser only.
const EarthMap = dynamic(() => import("../components/EarthMap"), {
  ssr: false,
  loading: () => <div style={{ flex: 1, width: "100%" }} />,
});

export default function MapPage() {
  const [measurement, setMeasurement] = useState<Point>();

  return (
    <>
      <Head>
        <title>The Earth</title>
        <meta
          name="description"
          content="Convert a ruler measurement on a 100 x 64 cm Mercator wall map into a longitude and latitude."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.description}>
          <h2>The Earth</h2>
          <p>
            Click the map to read off its position on the
            100&nbsp;&times;&nbsp;64&nbsp;cm paper map, and to build a polygon.
          </p>
          {measurement ? (
            <p data-testid="readout">
              x&nbsp;{measurement.x.toFixed(3)}&nbsp;cm &nbsp;&middot;&nbsp; y&nbsp;
              {measurement.y.toFixed(3)}&nbsp;cm
            </p>
          ) : null}
        </div>

        {MAPBOX_TOKEN ? (
          <EarthMap mapboxToken={MAPBOX_TOKEN} onMeasure={setMeasurement} />
        ) : (
          <MissingTokenNotice />
        )}
      </main>
    </>
  );
}
