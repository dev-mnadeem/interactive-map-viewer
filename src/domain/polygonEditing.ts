import type { LngLatLiteral } from "./conversion";

/** Everything the user can do to the polygon they are drawing. */
export type PolygonEdit =
  | { type: "append"; vertex: LngLatLiteral }
  | { type: "move"; index: number; vertex: LngLatLiteral }
  | { type: "undo" }
  | { type: "clear" };

/**
 * Applies one edit to the polygon's vertices, for use with `useReducer`.
 *
 * It returns the same array when nothing changes, so React can skip the
 * re-render -- and the map skips re-uploading an unchanged GeoJSON source.
 */
export function editPolygon(
  vertices: LngLatLiteral[],
  edit: PolygonEdit,
): LngLatLiteral[] {
  switch (edit.type) {
    case "append":
      return [...vertices, edit.vertex];
    case "move":
      if (edit.index < 0 || edit.index >= vertices.length) return vertices;
      return vertices.map((vertex, index) =>
        index === edit.index ? edit.vertex : vertex,
      );
    case "undo":
      return vertices.length === 0 ? vertices : vertices.slice(0, -1);
    case "clear":
      return vertices.length === 0 ? vertices : [];
  }
}
