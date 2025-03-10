import { describe, expect, it } from "vitest";

import type { LngLatLiteral } from "./conversion";
import { editPolygon } from "./polygonEditing";

const a: LngLatLiteral = { lng: 0, lat: 0 };
const b: LngLatLiteral = { lng: 10, lat: 0 };
const c: LngLatLiteral = { lng: 10, lat: 10 };

describe("editPolygon", () => {
  it("appends a vertex at the end, leaving the input alone", () => {
    const before = [a, b];
    const after = editPolygon(before, { type: "append", vertex: c });

    expect(after).toEqual([a, b, c]);
    expect(before).toEqual([a, b]);
  });

  it("moves one vertex and keeps the others in order", () => {
    const moved = { lng: 5, lat: 5 };
    expect(editPolygon([a, b, c], { type: "move", index: 1, vertex: moved })).toEqual([
      a,
      moved,
      c,
    ]);
  });

  it("ignores a move aimed at a vertex that no longer exists", () => {
    // A drag can still end after the vertex under it was undone.
    const vertices = [a, b];
    expect(editPolygon(vertices, { type: "move", index: 2, vertex: c })).toBe(vertices);
    expect(editPolygon(vertices, { type: "move", index: -1, vertex: c })).toBe(vertices);
  });

  it("undoes the most recent vertex only", () => {
    expect(editPolygon([a, b, c], { type: "undo" })).toEqual([a, b]);
  });

  it("clears every vertex", () => {
    expect(editPolygon([a, b, c], { type: "clear" })).toEqual([]);
  });

  it("returns the same array when undo or clear have nothing to remove", () => {
    const empty: LngLatLiteral[] = [];
    expect(editPolygon(empty, { type: "undo" })).toBe(empty);
    expect(editPolygon(empty, { type: "clear" })).toBe(empty);
  });
});
