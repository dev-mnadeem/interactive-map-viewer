import { useEffect, useState } from "react";

import {
  convertPhysicalMapMeasurementToLngLat,
  type LngLatLiteral,
} from "../domain/conversion";

type CoastlineState = {
  points: LngLatLiteral[];
  error: string | null;
};

/**
 * Loads a coastline expressed as paper-map centimetres and converts it to
 * geographic coordinates.
 *
 * The fetch used to sit inline in the map page with no error handling, so a
 * failed request left the outline silently missing and nothing in the UI said
 * why. The request is aborted on unmount rather than setting state on a
 * component that has gone away.
 */
export function useCoastline(url: string): CoastlineState {
  const [state, setState] = useState<CoastlineState>({
    points: [],
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }

        const measurements = (await response.json()) as [number, number][];
        setState({
          points: measurements.map(([x, y]) =>
            convertPhysicalMapMeasurementToLngLat({ x, y }),
          ),
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          points: [],
          error: error instanceof Error ? error.message : "request failed",
        });
      }
    };

    load();

    return () => controller.abort();
  }, [url]);

  return state;
}
