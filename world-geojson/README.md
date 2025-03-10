# world-geojson

`get_all_polygons.py` merges per-country GeoJSON outlines into the two files
the API serves:

| Output | Contents |
|---|---|
| `public/countries_coords.json` | `{ "<country>": [[lng, lat], ...] }` |
| `public/countries_physical.json` | the same vertices as `[x, y]` centimetres on the 100 × 64 cm paper map |

For each country it keeps the outer ring of the largest landmass, thinned to
about 75 vertices. Brazil, France, Spain and the USA are left out on purpose:
the exercise draws Brazil from its own paper measurements.

## The source outlines are not in this repository

The script reads `world-geojson/countries/*.json`: 197 files, 24 MB in all.
They come from [georgique/world-geojson](https://github.com/georgique/world-geojson),
which is licensed **GPL-3.0-or-later**. The folder is gitignored rather than
committed, both for size and so this repository does not redistribute it.

To regenerate the merged files:

```bash
git clone --depth 1 https://github.com/georgique/world-geojson /tmp/world-geojson
cp -R /tmp/world-geojson/countries world-geojson/countries

# Python 3 and the standard library only, e.g. in a throwaway container:
docker run --rm -v "$PWD":/app -w /app python:3.12-slim \
  python world-geojson/get_all_polygons.py
# -> wrote 193 countries to public/
```

The committed outputs were built from an older copy of that dataset: only 7
of its 197 files match the current release (3.5.3) exactly. Regenerating from
the current upstream therefore moves some vertices. `src/server/countryOutlines.test.ts`
checks the outputs either way: both files must list the same countries, every
paper measurement must match `src/domain/conversion.ts`, and countries must
keep their mainland.

`public/countries_*.json` are derived from that GPL-licensed data, so they keep
its licence. They are not covered by this project's MIT licence.
