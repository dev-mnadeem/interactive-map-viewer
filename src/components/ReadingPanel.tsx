import type { LngLatLiteral, Point } from "../domain/conversion";
import { MINIMUM_RING_VERTICES } from "../domain/polygon";
import styles from "../styles/Home.module.css";

export type Reading = {
  lngLat: LngLatLiteral;
  measurement: Point;
};

type Props = {
  reading: Reading | undefined;
  vertexCount: number;
  onUndo: () => void;
  onClear: () => void;
  brazil: { points: LngLatLiteral[]; error: string | null };
};

const degrees = (value: number, positive: string, negative: string) =>
  `${Math.abs(value).toFixed(5)}° ${value >= 0 ? positive : negative}`;

function polygonStatus(vertexCount: number): string {
  if (vertexCount === 0) return "No corners yet.";
  const corners = `${vertexCount} ${vertexCount === 1 ? "corner" : "corners"}`;
  if (vertexCount < MINIMUM_RING_VERTICES) {
    return `${corners}. A shape needs ${MINIMUM_RING_VERTICES} before it can be filled.`;
  }
  return `${corners}. Drag a handle to move one.`;
}

function brazilStatus({ points, error }: Props["brazil"]): string {
  if (error) return `Brazil's outline could not be loaded (${error}).`;
  if (points.length === 0) return "Loading Brazil's outline…";
  return `Brazil, plotted from ${points.length} centimetre measurements taken off the paper map.`;
}

export default function ReadingPanel({
  reading,
  vertexCount,
  onUndo,
  onClear,
  brazil,
}: Props) {
  return (
    <aside className={styles.panel} aria-label="Reading and polygon">
      <section aria-labelledby="reading-heading">
        <h2 id="reading-heading" className={styles.panelHeading}>
          On the paper sheet
        </h2>
        <div aria-live="polite">
          {reading ? (
            <dl className={styles.readout} data-testid="readout">
              <dt>x</dt>
              <dd>{reading.measurement.x.toFixed(3)} cm</dd>
              <dt>y</dt>
              <dd>{reading.measurement.y.toFixed(3)} cm</dd>
              <dt>lon</dt>
              <dd>{degrees(reading.lngLat.lng, "E", "W")}</dd>
              <dt>lat</dt>
              <dd>{degrees(reading.lngLat.lat, "N", "S")}</dd>
            </dl>
          ) : (
            <p className={styles.empty}>
              No reading yet. Click the map to take one.
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="polygon-heading">
        <h2 id="polygon-heading" className={styles.panelHeading}>
          Your polygon
        </h2>
        <p className={styles.note} aria-live="polite">
          {polygonStatus(vertexCount)}
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={onUndo} disabled={vertexCount === 0}>
            Undo last corner
          </button>
          <button type="button" onClick={onClear} disabled={vertexCount === 0}>
            Clear
          </button>
        </div>
      </section>

      <section aria-labelledby="key-heading">
        <h2 id="key-heading" className={styles.panelHeading}>
          Key
        </h2>
        <ul className={styles.key}>
          <li>
            <span className={`${styles.swatch} ${styles.swatchPin}`} aria-hidden="true" />
            The four measurements the exercise supplies
          </li>
          <li>
            <span className={`${styles.swatch} ${styles.swatchBrazil}`} aria-hidden="true" />
            <span role={brazil.error ? "alert" : undefined}>{brazilStatus(brazil)}</span>
          </li>
          <li>
            <span className={`${styles.swatch} ${styles.swatchPolygon}`} aria-hidden="true" />
            Your polygon
          </li>
        </ul>
      </section>
    </aside>
  );
}
