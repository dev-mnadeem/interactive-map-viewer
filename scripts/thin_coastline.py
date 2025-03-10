#!/usr/bin/env python3
"""Thin a coastline to every Nth point.

The Brazil outline in the exercise data is a few hundred vertices taken off the
paper map. Rendering every one of them is fine, but a coarser ring is easier to
eyeball when checking the conversion by hand.

    python3 scripts/thin_coastline.py public/partial-brazil.json out.json --keep 20
"""

import argparse
import json


def thin(points: list, keep_every: int) -> list:
    return points[::keep_every]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", help="JSON file holding an array of [x, y] points")
    parser.add_argument("destination", help="where to write the thinned array")
    parser.add_argument(
        "--keep", type=int, default=20, help="keep one point in every N (default: 20)"
    )
    args = parser.parse_args()

    if args.keep < 1:
        parser.error("--keep must be at least 1")

    with open(args.source, encoding="utf-8") as handle:
        points = json.load(handle)

    thinned = thin(points, args.keep)

    with open(args.destination, "w", encoding="utf-8") as handle:
        json.dump(thinned, handle)

    print(f"{len(points)} points -> {len(thinned)}")


if __name__ == "__main__":
    main()
