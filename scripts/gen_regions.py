"""Generate SVG path data for the North America geographic-regions map.

Output: regionPaths.js  (copy to src/data/regionPaths.js)

The eight regions are the ones on Rose's Unit 1 study guide (and the Virginia
SOL USI.2 list): Coastal Range, Basin and Range, Rocky Mountains, Great Plains,
Interior Lowlands, Appalachian Mountains, Coastal Plain, Canadian Shield.

Natural Earth has no physiographic regions, so each region is a hand-drawn
lon/lat outline, deliberately loose on its ocean side, that is clipped to real
coastlines. Outlines are claimed in PRIORITY order - a later region only gets
land an earlier one did not take - so only the inland edges have to be drawn
with any care. Shared edges then come out identical on both sides, and the
coverage is simplified as a whole (shapely.coverage_simplify) so neighbouring
regions never open slivers between them.

The boundaries are classroom-map generalisations drawn to match the numbered
map on the study guide, not survey lines.
"""
import json, math

import shapely
from shapely.geometry import shape, Polygon, MultiPolygon, box
from shapely.ops import unary_union, transform


def load(name):
    with open(f'{name}.geojson') as fh:
        return json.load(fh)


# ---------------------------------------------------------------- projection
class Albers:
    """Albers equal-area conic tuned for North America."""
    lat0, lon0, lat1, lat2 = 40.0, -96.0, 20.0, 60.0

    def __init__(self):
        r = math.radians
        s1, s2 = math.sin(r(self.lat1)), math.sin(r(self.lat2))
        self.n = (s1 + s2) / 2
        self.C = math.cos(r(self.lat1)) ** 2 + 2 * self.n * s1
        self.rho0 = math.sqrt(self.C - 2 * self.n * math.sin(r(self.lat0))) / self.n

    def __call__(self, lon, lat):
        r = math.radians
        rho = math.sqrt(max(self.C - 2 * self.n * math.sin(r(lat)), 1e-9)) / self.n
        theta = self.n * r(lon - self.lon0)
        # negated so y grows downward, matching SVG
        return rho * math.sin(theta), rho * math.cos(theta) - self.rho0


alb = Albers()

# ------------------------------------------------------------------- land
countries = {f['properties']['NAME']: shape(f['geometry']).buffer(0)
             for f in load('ne_50m_admin_0_countries')['features']}

# Hawaii sits inside the view box's longitudes but is not part of this map.
countries['United States of America'] = unary_union(
    [p for p in countries['United States of America'].geoms
     if p.representative_point().y > 24 or p.representative_point().x > -150])

VIEW_LONLAT = box(-169.0, 13.0, -10.0, 84.0)
CONTEXT = ['United States of America', 'Canada', 'Mexico', 'Greenland', 'Cuba',
           'Bahamas', 'Jamaica', 'Haiti', 'Dominican Rep.', 'Puerto Rico',
           'Belize', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua',
           'Costa Rica', 'Panama']
context = unary_union([countries[n] for n in CONTEXT]).intersection(VIEW_LONLAT)

usa = countries['United States of America']
mexico = countries['Mexico']

# Canada without the Arctic Archipelago, which is not one of the eight regions.
# Baffin Island (the largest of those islands) is kept: it belongs to the Shield.
canada_parts = list(countries['Canada'].geoms)
arctic = [p for p in canada_parts if p.representative_point().y > 66]
baffin = max(arctic, key=lambda p: p.area)
canada = unary_union([p for p in canada_parts
                      if p.representative_point().y <= 66 or p is baffin])

# Hawaii and the far Aleutians fall outside the view box anyway.
us_can = unary_union([usa, canada]).intersection(VIEW_LONLAT)
us_can_mex = unary_union([us_can, mexico]).intersection(VIEW_LONLAT)

# ---------------------------------------------------------------- regions
# (id, allowed land, outline). Order is priority. Outlines run roughly
# clockwise; any vertex in open water is just there to close the shape.
REGIONS = [
    ('coastalrange', us_can, [
        # inland edge, south to north: Peninsular Ranges, Sierra Nevada crest,
        # Cascades, Coast Mountains, St. Elias and the Alaska Range
        (-116.0, 32.55), (-116.4, 33.9), (-117.6, 34.6), (-118.3, 35.2),
        (-118.1, 36.5), (-119.4, 38.2), (-120.1, 39.6), (-120.9, 41.0),
        (-121.4, 42.6), (-121.6, 44.6), (-121.2, 46.5), (-120.6, 48.0),
        (-120.6, 49.2), (-121.8, 50.6), (-124.2, 52.4), (-127.2, 54.4),
        (-129.8, 56.4), (-132.8, 58.4), (-136.2, 60.3), (-140.5, 61.4),
        (-145.5, 62.2), (-150.5, 62.8), (-154.5, 60.2), (-158.5, 57.4),
        (-163.0, 55.2),
        # open ocean back down the coast
        (-165.0, 53.0), (-150.0, 50.0), (-135.0, 45.0), (-127.0, 37.0),
        (-119.0, 31.8), (-117.12, 32.53),
    ]),
    ('coastalplain', us_can_mex, [
        # fall line from Cape Cod to Alabama, round the Mississippi
        # embayment, along the Balcones Escarpment and into Mexico
        (-70.8, 41.95), (-72.6, 41.3), (-74.0, 40.75), (-74.8, 40.2),
        (-75.6, 39.7), (-76.6, 39.3), (-77.1, 38.9), (-77.5, 37.5),
        (-78.6, 35.8), (-79.4, 35.1), (-80.9, 34.1), (-82.0, 33.5),
        (-83.6, 32.8), (-85.0, 32.5), (-86.3, 32.4), (-87.6, 33.2),
        (-88.2, 34.5), (-88.4, 35.6), (-88.8, 36.6), (-89.2, 37.2),
        (-90.4, 36.8), (-91.3, 35.1), (-92.4, 34.6), (-93.9, 34.0),
        (-95.8, 33.8), (-96.8, 33.0), (-97.2, 32.3), (-97.7, 30.3),
        (-98.5, 29.45), (-99.9, 29.1), (-100.6, 28.6), (-100.9, 27.0),
        (-99.9, 25.0), (-98.9, 23.0), (-98.2, 21.2),
        # Gulf of Mexico, Florida Straits and the open Atlantic
        (-96.0, 21.0), (-90.0, 22.6), (-82.0, 24.3), (-79.4, 25.0),
        (-75.0, 32.0), (-72.0, 38.0), (-68.0, 41.5), (-69.8, 42.4),
    ]),
    ('canadianshield', us_can, [
        # southern edge, east to west: north shore of the St. Lawrence,
        # Georgian Bay, round Lake Superior, the lakes of Manitoba and
        # Saskatchewan, Lake Athabasca, Great Slave and Great Bear Lakes
        (-56.3, 51.75), (-60.0, 50.12), (-64.0, 50.12), (-67.0, 49.25),
        (-69.0, 48.2), (-70.6, 47.1), (-71.3, 46.9), (-72.6, 46.4),
        (-74.0, 45.9), (-75.6, 45.55), (-76.4, 44.75), (-78.6, 44.85),
        (-80.0, 45.05), (-82.5, 46.0), (-84.6, 46.45), (-86.6, 46.1),
        (-88.2, 45.6), (-89.6, 45.1), (-91.6, 45.5), (-93.6, 46.1),
        (-95.6, 47.6), (-96.2, 49.0), (-96.6, 50.6), (-98.0, 52.6),
        (-99.6, 54.0), (-102.2, 55.1), (-105.2, 56.6), (-111.0, 58.5),
        (-113.2, 60.6), (-116.2, 62.6), (-118.6, 64.6), (-118.2, 66.6),
        (-116.0, 68.2), (-115.0, 69.5),
        # Arctic and Labrador Sea
        (-115.0, 76.0), (-55.0, 76.0), (-55.0, 60.0), (-54.0, 53.0),
    ]),
    ('appalachian', us_can, [
        # western edge, Alabama to New York: Cumberland and Allegheny plateaus
        (-88.2, 33.0), (-87.4, 34.6), (-86.0, 35.8), (-84.6, 37.0),
        (-83.8, 38.2), (-82.8, 39.4), (-81.8, 40.6), (-80.8, 41.6),
        (-79.6, 42.3), (-77.8, 42.6), (-76.2, 42.9), (-75.3, 43.1),
        # skirting the Adirondacks to Lake Champlain, then the south shore
        # of the St. Lawrence out to the Gaspe and Newfoundland
        (-74.0, 43.0), (-73.4, 43.8), (-73.3, 45.0), (-72.0, 45.8),
        (-70.5, 46.75), (-68.5, 48.1), (-66.0, 49.15), (-64.0, 49.5),
        (-60.0, 50.0), (-57.0, 51.0), (-55.0, 52.0),
        # open Atlantic, then back through the Coastal Plain (already taken)
        (-48.0, 50.0), (-48.0, 42.0), (-69.0, 40.0), (-74.0, 39.0),
        (-76.0, 37.0), (-78.5, 34.0), (-83.0, 31.5), (-87.0, 31.5),
    ]),
    ('rockies', us_can, [
        # eastern front, south to north: Sangre de Cristo, Front Range,
        # Bighorns, the Montana front, Canadian Rockies, Mackenzie Mountains
        (-105.6, 35.2), (-105.0, 37.0), (-105.1, 39.0), (-105.2, 41.0),
        (-105.6, 42.6), (-106.8, 44.4), (-108.6, 45.8), (-111.2, 47.0),
        (-112.8, 48.6), (-114.0, 49.8), (-114.9, 51.0), (-117.0, 53.0),
        (-118.8, 54.2), (-121.0, 55.6), (-123.4, 57.4), (-124.6, 59.4),
        (-124.0, 61.4), (-126.2, 63.6), (-129.4, 65.8), (-133.6, 67.4),
        (-135.4, 68.6), (-136.2, 69.4),
        # Arctic coast and all of Alaska the Coastal Range did not take
        (-141.0, 72.0), (-170.0, 72.0), (-170.0, 58.0), (-135.0, 58.5),
        # western edge back south: Columbia Mountains, Idaho, Wasatch, the
        # western slope in Colorado
        (-127.6, 58.5), (-125.0, 56.5), (-122.6, 54.5), (-120.6, 52.5),
        (-119.0, 50.5), (-118.4, 49.0), (-117.0, 48.0), (-116.8, 46.5),
        (-116.4, 45.4), (-116.0, 44.3), (-114.6, 43.7), (-112.6, 43.5),
        (-111.9, 42.0), (-111.9, 40.0), (-110.0, 40.3), (-108.0, 38.5),
        (-107.8, 35.5),
    ]),
    ('basinrange', us_can_mex, [
        # eastern edge in New Mexico and West Texas; north of that the
        # outline runs through the Rockies, which have already claimed it
        (-104.0, 28.0), (-104.5, 29.5), (-104.7, 31.0), (-105.3, 32.5),
        (-105.6, 34.2), (-105.8, 35.5), (-106.5, 38.0), (-107.0, 42.0),
        (-113.0, 45.0), (-115.0, 48.0), (-116.0, 49.0), (-117.5, 52.0),
        (-121.0, 55.0), (-126.0, 58.5), (-133.0, 58.5),
        # Pacific side (the Coastal Range has claimed the coast)
        (-140.0, 55.0), (-130.0, 45.0), (-125.0, 35.0), (-117.12, 32.53),
        # along the Mexican border and into Sonora and Chihuahua
        (-114.8, 32.45), (-114.0, 31.3), (-111.5, 28.5), (-106.0, 28.0),
    ]),
    ('greatplains', us_can, [
        # eastern edge, Texas to the Arctic: roughly the 98th-100th meridian,
        # then the Manitoba Escarpment and the plains of Alberta
        (-100.6, 29.2), (-98.2, 30.2), (-98.6, 33.0), (-98.0, 36.0),
        (-97.6, 38.0), (-98.4, 40.0), (-98.0, 42.5), (-99.0, 44.5),
        (-100.0, 46.5), (-99.6, 48.5), (-100.6, 49.6), (-101.0, 51.0),
        (-105.4, 54.0), (-111.4, 56.2), (-117.0, 58.8), (-120.4, 61.0),
        (-124.4, 64.4), (-130.4, 67.4), (-133.4, 69.6),
        # west through the Rockies (already taken) and back south
        (-140.0, 70.0), (-125.0, 50.0), (-112.0, 44.0), (-107.0, 36.0),
        (-106.0, 31.0), (-105.0, 28.0), (-100.9, 28.8),
    ]),
    ('interiorlowlands', us_can, [
        # everything east of the Rockies nobody else has claimed: the
        # Midwest, the Great Lakes and St. Lawrence lowlands, and the
        # Manitoba-to-Mackenzie strip between the Plains and the Shield
        (-106.0, 26.0), (-60.0, 26.0), (-60.0, 76.0), (-140.0, 76.0),
    ]),
]

claimed = Polygon()
pieces = {}
for rid, allowed, outline in REGIONS:
    geom = Polygon(outline).buffer(0).intersection(allowed).difference(claimed)
    pieces[rid] = geom
    claimed = claimed.union(geom)

# Anything inside the US or Canada that no outline reached is a gap in the
# hand-drawn edges. Fold each gap into the neighbour it shares most edge with,
# so a sloppy vertex never leaves a grey hole in the middle of the country.
gaps = us_can.difference(claimed)
for g in getattr(gaps, 'geoms', [gaps]):
    if g.is_empty or g.geom_type != 'Polygon':
        continue
    best, best_len = None, 0.0
    for rid, geom in pieces.items():
        shared = g.boundary.intersection(geom.buffer(1e-6)).length
        if shared > best_len:
            best, best_len = rid, shared
    if best:
        pieces[best] = pieces[best].union(g)
    # a gap touching no region (an offshore island) stays plain land

# ------------------------------------------------------------------- fit
_minx, _miny, _maxx, _maxy = transform(lambda x, y, z=None: alb(x, y), context).bounds
W = 1000.0
SCALE = W / (_maxx - _minx)


def to_svg(lon, lat):
    x, y = alb(lon, lat)
    return ((x - _minx) * SCALE, (y - _miny) * SCALE)


def _proj_arrays(xs, ys):
    out = [to_svg(x, y) for x, y in zip(xs, ys)]
    return [p[0] for p in out], [p[1] for p in out]


def proj(geom):
    out = transform(_proj_arrays, geom)
    # projecting can pinch a near-touching ring into a self-intersection
    return out.buffer(0) if out.geom_type in ('Polygon', 'MultiPolygon') else out


H = round((_maxy - _miny) * SCALE, 1)

# Crop to the top of Alaska and the bottom of the Gulf of Mexico. Greenland
# and southern Mexico would otherwise stretch the map for no study value, and
# every pixel of height is a pixel the Coastal Range strip does not get.
CROP = box(0, round(to_svg(-160.0, 71.6)[1] - 8, 1), W, round(to_svg(-92.0, 17.6)[1], 1))

ids = [r[0] for r in REGIONS]
region_svg = [proj(pieces[i]).intersection(CROP) for i in ids]
land_svg = proj(context).intersection(CROP)

# Simplify the regions as one coverage so shared edges stay shared.
simplified = shapely.coverage_simplify(region_svg, 0.9)
land_simpl = land_svg.simplify(0.9)

# ------------------------------------------------------------------ lakes
LAKES = {'Lake Superior', 'Lake Michigan', 'Lake Huron', 'Lake Erie',
         'Lake Ontario', 'Great Slave Lake', 'Great Bear Lake',
         'Lake Winnipeg', 'Lake Athabasca'}
lakes = unary_union([shape(f['geometry']).buffer(0)
                     for f in load('ne_50m_lakes')['features']
                     if (f['properties'].get('name') or '') in LAKES])
lakes_svg = proj(lakes).intersection(CROP).simplify(0.6)

# -------------------------------------------------------- country borders
borders = []
for a, b in (('United States of America', 'Canada'), ('United States of America', 'Mexico')):
    line = countries[a].buffer(0.02).boundary.intersection(countries[b].buffer(0.02))
    borders.append(proj(line).intersection(CROP).simplify(0.8))


# ------------------------------------------------------------------ output
def fmt_ring(coords):
    pts = list(coords)[:-1]
    return ''.join(f"{'M' if i == 0 else 'L'}{round(x, 1):g} {round(y, 1):g}"
                   for i, (x, y) in enumerate(pts)) + 'Z'


def poly_paths(geom, min_area=2.0):
    out = []
    for p in getattr(geom, 'geoms', [geom]):
        if p.geom_type != 'Polygon' or p.is_empty or p.area < min_area:
            continue
        d = fmt_ring(p.exterior.coords) + ''.join(fmt_ring(r.coords) for r in p.interiors)
        out.append(d)
    return out


def line_paths(geom, min_len=3.0):
    out = []
    for ls in getattr(geom, 'geoms', [geom]):
        if ls.geom_type != 'LineString' or ls.length < min_len:
            continue
        out.append(''.join(f"{'M' if i == 0 else 'L'}{round(x, 1):g} {round(y, 1):g}"
                           for i, (x, y) in enumerate(ls.coords)))
    return out


# Label anchors picked in lon/lat so they stay pinned to the geography.
LABEL_LONLAT = {
    'coastalrange':     (-122.6, 42.6),
    'basinrange':       (-116.5, 39.5),
    'rockies':          (-109.0, 43.5),
    'greatplains':      (-102.0, 40.5),
    'interiorlowlands': (-91.0, 40.5),
    'appalachian':      (-80.0, 38.8),
    'coastalplain':     (-89.5, 31.5),
    'canadianshield':   (-74.0, 52.5),
}


def js_arr(paths, indent='  '):
    inner = ',\n'.join(f"{indent}  '{p}'" for p in paths)
    return '[\n' + inner + f',\n{indent}]' if paths else '[]'


minx, miny, maxx, maxy = CROP.bounds
with open('regionPaths.js', 'w') as fh:
    fh.write('// Generated from Natural Earth public-domain vector data plus the\n')
    fh.write('// hand-drawn region outlines in scripts/gen_regions.py.\n')
    fh.write('// North America, Albers equal-area conic.\n')
    fh.write('// Regenerate with scripts/gen_regions.py -- do not hand-edit.\n\n')
    fh.write(f'export const NA_VIEWBOX = "{minx:g} {miny:g} {maxx - minx:g} {maxy - miny:g}";\n\n')
    fh.write(f'export const NA_LAND = {js_arr(poly_paths(land_simpl, 1.0), "")};\n\n')
    fh.write(f'export const NA_LAKES = {js_arr(poly_paths(lakes_svg, 0.8), "")};\n\n')
    fh.write(f'export const NA_BORDERS = {js_arr(sum((line_paths(b) for b in borders), []), "")};\n\n')
    fh.write('export const REGION_PATHS = {\n')
    for rid, geom in zip(ids, simplified):
        paths = poly_paths(geom)
        fh.write(f'  {rid}: {js_arr(paths, "  ")},\n')
        print(f'  {rid:17s} {len(paths):3d} polygons')
    fh.write('};\n\nexport const REGION_LABELS = {\n')
    for rid, (lon, lat) in LABEL_LONLAT.items():
        x, y = to_svg(lon, lat)
        fh.write(f'  {rid}: {{ x: {round(x, 1):g}, y: {round(y, 1):g} }},\n')
    fh.write('};\n')

import os
print(f'viewBox {minx:g} {miny:g} {maxx - minx:g} {maxy - miny:g}')
print('regionPaths.js', os.path.getsize('regionPaths.js') // 1024, 'KB')
