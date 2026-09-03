# Map data generation

`src/data/mapPaths.js` is **generated** — don't hand-edit it. It holds the SVG
path data behind the Geography study topic (`src/GeographyStudyApp.jsx`): the
US rivers map and the world continents map.

Source data is [Natural Earth](https://www.naturalearthdata.com/) (public
domain). The raw GeoJSON is not committed — it's ~30 MB — so fetch it first.

## Regenerating

```bash
cd scripts
pip install shapely numpy

for f in ne_50m_admin_0_countries ne_50m_lakes \
         ne_110m_admin_0_countries ne_10m_rivers_lake_centerlines \
         ne_10m_admin_0_countries_lakes; do
  curl -sSO "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/$f.geojson"
done
curl -sS -o states.geojson \
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces_lines.geojson"

python3 derive_stlawrence.py     # only needed if stlawrence.json is missing
python3 gen_maps.py
cp mapPaths.js ../src/data/mapPaths.js
```

## What the generator does

- **US map** — Albers equal-area conic (the standard USA look), clipped to a
  lon/lat window, Douglas–Peucker simplified. Context land, US state lines,
  the Great Lakes, and the 7 quiz rivers.
- **World map** — equirectangular. Country polygons are dissolved per
  continent with shapely so no internal country borders show through. Two
  fixes are applied that Natural Earth's `CONTINENT` field gets wrong for a
  classroom map: Russia is split at the Urals (60°E) into Europe and Asia
  rather than filed wholly under Europe, and French Guiana is moved off the
  France feature into South America.
- **Projected y is negated** so it grows downward, matching SVG coordinates.
- The world `viewBox` is inset slightly. Antarctica and the polygons that
  cross the antimeridian close along the poles and ±180°, and those synthetic
  edges would otherwise draw as stray straight lines across the map.
- Label anchors are picked in lon/lat and projected with the same transforms,
  so they stay pinned to the geography.

## Verifying a change

There's no test framework. Render both maps to a PNG and look at them — a
projection or clipping mistake is obvious visually and nearly invisible in the
path data. The quickest check is that each river sits in the right place
(Columbia in the Pacific Northwest, Rio Grande on the Texas border, and so on).
