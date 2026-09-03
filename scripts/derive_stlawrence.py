"""Derive a St. Lawrence River centerline and write scripts/stlawrence.json.

Natural Earth's river centerlines only cover the short international-rapids
stretch of the St. Lawrence (lon -75.8 to -74.7); everything downstream of
that is mapped as an estuary/ocean polygon instead, so there is no line to
draw. This walks the channel: at each step of longitude it finds the gaps of
open water between the shorelines and follows the one nearest the previous
point, taking its mid-point.

Needs ne_10m_admin_0_countries_lakes.geojson in the working directory
(see README.md), and shapely + numpy.
"""
import json

import numpy as np
from shapely.geometry import Point, box, shape
from shapely.ops import unary_union

# Lake Ontario through the Gulf of St. Lawrence.
LON_START, LON_END, LON_STEP = -76.60, -64.20, 0.10
LAT_LO, LAT_HI, LAT_STEP = 43.2, 51.0, 0.01
START_LAT = 44.20          # just off Kingston, at the outlet of Lake Ontario
MAX_CHANNEL_WIDTH = 3.0    # degrees; wider gaps are open ocean, not the river
MAX_JUMP = 1.2             # degrees; keeps the walk on one continuous channel


def main():
    with open('ne_10m_admin_0_countries_lakes.geojson') as fh:
        data = json.load(fh)

    region = box(-78, 43, -63, 51.5)
    land = unary_union([
        shape(f['geometry']).buffer(0).intersection(region)
        for f in data['features']
        if f['properties']['NAME'] in ('Canada', 'United States of America')
    ])

    lats = np.arange(LAT_LO, LAT_HI, LAT_STEP)
    path = []
    prev = START_LAT

    for lon in np.arange(LON_START, LON_END, LON_STEP):
        wet = [not land.contains(Point(lon, lat)) for lat in lats]

        # contiguous runs of open water at this longitude
        runs, start = [], None
        for i, ok in enumerate(wet):
            if ok and start is None:
                start = i
            elif not ok and start is not None:
                runs.append((start, i - 1))
                start = None
        if start is not None:
            runs.append((start, len(wet) - 1))

        candidates = []
        for a, b in runs:
            lo, hi = lats[a], lats[b]
            if hi - lo > MAX_CHANNEL_WIDTH:
                continue
            mid = (lo + hi) / 2
            candidates.append((abs(mid - prev), mid))

        if not candidates:
            continue
        gap, mid = min(candidates)
        if gap > MAX_JUMP:
            continue

        path.append((round(float(lon), 2), round(float(mid), 3)))
        prev = mid

    stranded = [p for p in path if land.contains(Point(*p))]
    assert not stranded, f'{len(stranded)} derived points fell on land'

    with open('stlawrence.json', 'w') as fh:
        json.dump(path, fh)
    print(f'wrote stlawrence.json: {len(path)} channel points, all in water')


if __name__ == '__main__':
    main()
