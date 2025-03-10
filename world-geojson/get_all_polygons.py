"""Merge the per-country outlines in countries/ into the two files the API serves.

    python3 world-geojson/get_all_polygons.py

For every country it keeps one ring -- the outer ring of its largest landmass,
thinned to about MAX_POINTS vertices -- and writes it twice:

    public/countries_coords.json    [longitude, latitude] pairs
    public/countries_physical.json  [x, y] centimetres on the 100 x 64 cm paper map

countries/ is not part of this repository; README.md next to this file says
where to get it.
"""

from typing import Any, Dict, List, Sequence, Tuple
import json
import math
import os

Position = Tuple[float, float]

width = 100
height = 64

MAX_POINTS = 75

# Drawn from the exercise's own measurements instead, or left out on purpose.
EXCLUDED = {"brazil", "france", "usa", "spain"}

HERE = os.path.dirname(os.path.abspath(__file__))
COUNTRIES_DIR = os.path.join(HERE, "countries")
PUBLIC_DIR = os.path.join(HERE, "..", "public")

# The map's top edge sits at Mercator's limit, not at the pole. Anything at or
# beyond it clamps to the edge, as convertLngLatToPhysicalMapMeasurement does;
# testing only for exactly 90 let 85.06..89.99 through to a y off the sheet.
MAX_MERCATOR_LATITUDE = math.degrees(math.atan(math.sinh(math.pi)))


def convert_range(value: float, r1: Tuple[float, float], r2: Tuple[float, float]) -> float:
  return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0]


def GudermannianInv(latitude: float) -> float:
  sign = math.copysign(1, latitude)
  sin = math.sin(latitude * (math.pi / 180) * sign)
  return sign * (math.log((1 + sin) / (1 - sin)) / 2)


def from_lat_lng_to_point(coord: Sequence[float]) -> Position:
  x = convert_range(coord[0], (-180, 180), (0, width))
  if abs(coord[1]) >= MAX_MERCATOR_LATITUDE:
    return (x, 0 if coord[1] > 0 else height)
  y = convert_range(GudermannianInv(coord[1]), (math.pi, -math.pi), (0, height))
  return (x, y)


def largest_outer_ring(feature_collection: Dict[str, Any]) -> List[List[float]]:
  """The outer ring with the most vertices across every Polygon and MultiPolygon.

  A polygon is a list of rings, so comparing len(polygon) counts rings, not
  vertices. That is what this used to do, and for 22 countries it picked a
  small island -- Chile and Japan among them -- instead of the mainland.
  """
  outer_rings: List[List[List[float]]] = []
  for feature in feature_collection["features"]:
    geometry = feature["geometry"]
    polygons = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
    outer_rings.extend(polygon[0] for polygon in polygons)
  return max(outer_rings, key=len)


def thin(ring: List[List[float]]) -> List[List[float]]:
  """Drop the closing vertex and keep every Nth one, to about MAX_POINTS."""
  open_ring = ring[:-1]
  take_every = round(len(open_ring) / MAX_POINTS) if len(open_ring) > MAX_POINTS else 1
  return open_ring[::take_every]


def write_polygons(path: str, polygons: Dict[str, List[Sequence[float]]]) -> None:
  """One vertex per line: readable in a diff, and the shape the served files have always had."""
  entries = []
  for name, ring in polygons.items():
    vertices = ",\n".join(f"    [{json.dumps(a)}, {json.dumps(b)}]" for a, b in ring)
    entries.append(f"  {json.dumps(name)}: [\n{vertices}\n  ]")
  with open(path, "w", encoding="utf-8") as handle:
    handle.write("{\n" + ",\n".join(entries) + "\n}\n")


def main() -> None:
  coords: Dict[str, List[Sequence[float]]] = {}
  physical: Dict[str, List[Sequence[float]]] = {}

  for file in sorted(os.listdir(COUNTRIES_DIR)):
    name, extension = os.path.splitext(file)
    if extension != ".json" or name in EXCLUDED:
      continue
    with open(os.path.join(COUNTRIES_DIR, file), encoding="utf-8") as handle:
      ring = thin(largest_outer_ring(json.load(handle)))
    coords[name] = [(lng, lat) for lng, lat, *_ in ring]
    physical[name] = [from_lat_lng_to_point(position) for position in ring]

  write_polygons(os.path.join(PUBLIC_DIR, "countries_coords.json"), coords)
  write_polygons(os.path.join(PUBLIC_DIR, "countries_physical.json"), physical)
  print(f"wrote {len(coords)} countries to public/")


if __name__ == "__main__":
  main()
