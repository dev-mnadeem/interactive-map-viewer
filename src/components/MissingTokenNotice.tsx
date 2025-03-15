import styles from "../styles/Home.module.css";

/**
 * Shown instead of the map when no Mapbox token is configured.
 *
 * Mapbox GL JS v3 refuses to draw anything without a valid token -- not even a
 * raster basemap it does not host -- so without this the page rendered as a
 * blank white rectangle with the reason only visible in the browser console.
 */
export default function MissingTokenNotice() {
  return (
    <section className={styles.notice} aria-live="polite">
      <h3>No Mapbox token configured</h3>
      <p>
        The map needs a Mapbox public token to draw anything at all. Create a
        free one at{" "}
        <a
          href="https://account.mapbox.com/access-tokens/"
          target="_blank"
          rel="noreferrer"
        >
          account.mapbox.com/access-tokens
        </a>{" "}
        and put it in <code>.env.local</code>:
      </p>
      <pre>
        <code>NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here</code>
      </pre>
      <p>
        The value is inlined into the client bundle when the app is built, so
        restart <code>next dev</code> — or rebuild the image — after setting it.
        Setting it on an already-built container has no effect.
      </p>
      <p>
        The conversion itself needs no token and no network. <code>npm test</code>{" "}
        exercises it in full.
      </p>
    </section>
  );
}
