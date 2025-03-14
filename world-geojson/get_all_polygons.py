
from typing import Any, Dict, List, Tuple
import math

width = 100
height = 64

def convert_range(value: float, r1: Tuple[float, float], r2: Tuple[float, float]) -> float:
  return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0]

def GudermannianInv(latitude: float) -> float:
  sign = math.copysign(1, latitude)
  sin = math.sin(latitude * (math.pi / 180) * sign)
  return sign * (math.log((1 + sin) / (1 - sin)) / 2)

def from_lat_lng_to_point(coord: Tuple[float, float]) -> Tuple[float, float]:
  x = convert_range(coord[0], (-180, 180), (0, width))
  if abs(coord[1]) == 90:
    return (x, 0 if coord[1] > 0 else height)
  y = convert_range(GudermannianInv(coord[1]), (math.pi, -math.pi), (0, height))
  return (x, y)

# for each json file in the folder countries,
# open and parse the data
# convert the coordinates to points
# save the points in a new json file

import json
import os

all_polygons: Dict[str, List[Tuple[float, float]]] = {}
all_coord_polygons: Dict[str, List[Tuple[float, float]]] = {}

def append_point_polygon_from_json_file(filepath: str, name: str) -> None:
  with open(filepath) as f:
    data = json.load(f)

    largest_polygon = []
    num_polygons_considered = 0
    for index, feature in enumerate(data["features"]):
      polygon_or_multipolygon = feature["geometry"]
      polygons: List[List[Any]] = [polygon_or_multipolygon["coordinates"]] if polygon_or_multipolygon["type"] == "Polygon" else [p for p in polygon_or_multipolygon["coordinates"]]
      # print(name, index, len(polygons), )

      for polygon in polygons:
        num_polygons_considered += 1
        if len(polygon) > len(largest_polygon):
          largest_polygon = polygon
    
    point_polygon: List[Tuple[float, float]] = []
    coord_polygon: List[Tuple[float, float]] = []

    num_points = len(largest_polygon[0]) - 1

    max_num_points = 75
    # we want a max of max_num_points points per polygon. 
    # If there are more than max_num_points points, we only take as many points as needed to get to max_num_points
    if num_points > max_num_points:
      take_every = round(num_points/ max_num_points) 
    else:
      take_every = 1
        
    for index, coord in enumerate(largest_polygon[0][:-1]):
      if index % take_every == 0:
        point_polygon.append(from_lat_lng_to_point(coord))
        coord_polygon.append(coord)
      
    all_polygons[name] = point_polygon
    all_coord_polygons[name] = coord_polygon

for file in os.listdir("countries"):
    if file.endswith(".json"):
        name = file.replace(".json", "")
        # intentionally excluding some countries
        if name in ["brazil", "france", "usa", "spain"]:
          continue
        append_point_polygon_from_json_file(os.path.join("countries", file), name)

# printed = False
# for folder in os.listdir("states"):
#     for file in os.listdir(os.path.join("states", folder)):
#         if file.endswith(".json") or file.endswith(".geojson"):
#             if not printed:
#                 print(folder, file, folder + "_" + file.replace(".json", "").replace(".geojson", ""))
#                 printed = True
#             append_point_polygon_from_json_file(
#                 os.path.join("states", folder, file),
#                 folder + "_" + file.replace(".json", "").replace(".geojson", ""),
#             )

# for folder in os.listdir("areas"):
#     for file in os.listdir(os.path.join("areas", folder)):
#         if file.endswith(".json") or file.endswith(".geojson"):
#             append_point_polygon_from_json_file(
#                 os.path.join("areas", folder, file)
#             )
        
            

with open("all_polygons.json", "w") as f:
    json.dump(all_polygons, f)

with open("all_coord_polygons.json", "w") as f:
    json.dump(all_coord_polygons, f)


