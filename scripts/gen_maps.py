"""Generate SVG path data for the geography study maps from Natural Earth data."""
import json, math

# ---------------------------------------------------------------- projections
class Albers:
    """Albers equal-area conic - the classic USA look."""
    lat0, lon0, lat1, lat2 = 37.5, -96.0, 29.5, 45.5

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
        # negated so y grows downward, matching the SVG coordinate system
        return rho * math.sin(theta), rho * math.cos(theta) - self.rho0


class Equirect:
    """Plate carree - the classic classroom world map."""
    def __call__(self, lon, lat):
        return lon, -lat


# ------------------------------------------------------------------ clipping
def clip_poly(ring, box):
    """Sutherland-Hodgman clip of a ring against lon/lat box (w,s,e,n)."""
    w, s, e, n = box
    edges = (('x', w, 1), ('x', e, -1), ('y', s, 1), ('y', n, -1))
    out = ring
    for axis, val, sign in edges:
        if not out:
            return []
        i = 0 if axis == 'x' else 1
        inside = lambda p: (p[i] - val) * sign >= 0
        new = []
        for a, b in zip(out, out[1:] + out[:1]):
            ia, ib = inside(a), inside(b)
            if ia:
                new.append(a)
            if ia != ib:
                t = (val - a[i]) / (b[i] - a[i])
                new.append((a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])))
        out = new
    return out


def clip_line(coords, box):
    """Split a linestring into the pieces that fall inside the box."""
    w, s, e, n = box
    inside = lambda p: w <= p[0] <= e and s <= p[1] <= n
    parts, cur = [], []
    for p in coords:
        if inside(p):
            cur.append(p)
        else:
            if len(cur) > 1:
                parts.append(cur)
            cur = []
    if len(cur) > 1:
        parts.append(cur)
    return parts


# ------------------------------------------------------------ simplification
def rdp(pts, eps):
    """Douglas-Peucker, iterative."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        lo, hi = stack.pop()
        if hi <= lo + 1:
            continue
        ax, ay = pts[lo]
        bx, by = pts[hi]
        dx, dy = bx - ax, by - ay
        norm = math.hypot(dx, dy)
        best, bi = -1.0, lo
        for i in range(lo + 1, hi):
            px, py = pts[i]
            if norm < 1e-12:
                d = math.hypot(px - ax, py - ay)
            else:
                d = abs(dy * px - dx * py + bx * ay - by * ax) / norm
            if d > best:
                best, bi = d, i
        if best > eps:
            keep[bi] = True
            stack += [(lo, bi), (bi, hi)]
    return [p for p, k in zip(pts, keep) if k]


# ------------------------------------------------------------------- helpers
def ring_area(pts):
    a = 0.0
    for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]):
        a += x1 * y2 - x2 * y1
    return abs(a) / 2


def fmt(pts, close, prec=1):
    d = []
    for i, (x, y) in enumerate(pts):
        d.append(f"{'M' if i == 0 else 'L'}{round(x, prec):g} {round(y, prec):g}")
    if close:
        d.append('Z')
    return ''.join(d)


def polys_of(geom):
    """Yield each polygon (list of rings) from a Polygon/MultiPolygon."""
    if geom['type'] == 'Polygon':
        yield geom['coordinates']
    elif geom['type'] == 'MultiPolygon':
        yield from geom['coordinates']


def lines_of(geom):
    if geom['type'] == 'LineString':
        yield geom['coordinates']
    elif geom['type'] == 'MultiLineString':
        yield from geom['coordinates']


def load(name):
    with open(f'{name}.geojson') as fh:
        return json.load(fh)


# ================================================================= US  MAP ==
US_BOX = (-126.0, 23.5, -62.5, 52.5)
alb = Albers()

# fit the projected clip window into a 1000-wide viewport
_xs, _ys = [], []
for i in range(121):
    t = i / 120
    for lon, lat in ((US_BOX[0] + t * (US_BOX[2] - US_BOX[0]), US_BOX[1]),
                     (US_BOX[0] + t * (US_BOX[2] - US_BOX[0]), US_BOX[3]),
                     (US_BOX[0], US_BOX[1] + t * (US_BOX[3] - US_BOX[1])),
                     (US_BOX[2], US_BOX[1] + t * (US_BOX[3] - US_BOX[1]))):
        x, y = alb(lon, lat)
        _xs.append(x); _ys.append(y)
US_W = 1000.0
US_SCALE = US_W / (max(_xs) - min(_xs))
US_H = round((max(_ys) - min(_ys)) * US_SCALE, 1)
_x0, _y0 = min(_xs), min(_ys)


def us_pt(lon, lat):
    x, y = alb(lon, lat)
    return ((x - _x0) * US_SCALE, (y - _y0) * US_SCALE)


def us_polygon_paths(geom, eps=0.35, min_area=1.0):
    out = []
    for poly in polys_of(geom):
        for ring in poly:
            clipped = clip_poly([tuple(c[:2]) for c in ring], US_BOX)
            if len(clipped) < 3:
                continue
            pts = rdp([us_pt(*c) for c in clipped], eps)
            if len(pts) >= 3 and ring_area(pts) >= min_area:
                out.append(fmt(pts, True))
    return out


def us_line_paths(coords, eps=0.3):
    out = []
    for part in clip_line([tuple(c[:2]) for c in coords], US_BOX):
        pts = rdp([us_pt(*c) for c in part], eps)
        if len(pts) >= 2:
            out.append(fmt(pts, False))
    return out


# --- context land -----------------------------------------------------------
countries = load('ne_50m_admin_0_countries')
LAND_NAMES = {'United States of America', 'Canada', 'Mexico', 'Cuba', 'Bahamas',
              'Jamaica', 'Haiti', 'Dominican Rep.', 'Belize', 'Guatemala',
              'Honduras', 'El Salvador', 'Nicaragua'}
land = []
for f in countries['features']:
    if f['properties']['NAME'] in LAND_NAMES:
        land += us_polygon_paths(f['geometry'], eps=0.4, min_area=1.5)

# --- state / province lines -------------------------------------------------
states = load('states')
state_lines = []
for f in states['features']:
    p = f['properties']
    if (p.get('adm0_name') or p.get('ADM0_NAME')) != 'United States of America':
        continue
    for ls in lines_of(f['geometry']):
        state_lines += us_line_paths(ls, eps=0.5)

# --- great lakes ------------------------------------------------------------
lakes = load('ne_50m_lakes')
GREAT = {'Lake Superior', 'Lake Michigan', 'Lake Huron', 'Lake Erie', 'Lake Ontario'}
great_lakes = []
for f in lakes['features']:
    if (f['properties'].get('name') or '') in GREAT:
        great_lakes += us_polygon_paths(f['geometry'], eps=0.3, min_area=0.5)

# --- rivers -----------------------------------------------------------------
riv = load('ne_10m_rivers_lake_centerlines')

# The Columbia's "River" feature that loops out to lon -110 is the Snake; drop it.
def collect(name, predicate=None):
    segs = []
    for f in riv['features']:
        if f['properties'].get('name') != name:
            continue
        if predicate and not predicate(f):
            continue
        for ls in lines_of(f['geometry']):
            segs.append([tuple(c[:2]) for c in ls])
    return segs


def in_na(f):
    cs = [c for ls in lines_of(f['geometry']) for c in ls]
    return all(-130 < c[0] < -55 and 20 < c[1] < 60 for c in cs)


def not_snake(f):
    cs = [c for ls in lines_of(f['geometry']) for c in ls]
    return max(c[0] for c in cs) < -114


# The St. Lawrence below the international rapids is mapped as an estuary
# polygon rather than a centerline, so its channel is traced separately by
# walking the mid-point of the water gap between the shores (see
# derive_stlawrence.py) and stitched onto the Natural Earth segment.
with open('stlawrence.json') as fh:
    _chan = [tuple(c) for c in json.load(fh)]
# light moving-average smoothing over the derived mid-points
ST_LAWRENCE = []
for i in range(len(_chan)):
    win = _chan[max(0, i - 2):i + 3]
    ST_LAWRENCE.append((_chan[i][0], sum(c[1] for c in win) / len(win)))

RIVERS = {
    'columbia':    collect('Columbia', not_snake),
    'colorado':    collect('Colorado', in_na),
    'mississippi': collect('Mississippi', in_na),
    'missouri':    collect('Missouri', in_na),
    'ohio':        collect('Ohio', in_na),
    'riogrande':   collect('Rio Grande', in_na),
    'stlawrence':  [ST_LAWRENCE],
}

river_paths = {}
for key, segs in RIVERS.items():
    paths = []
    for seg in segs:
        paths += us_line_paths(seg, eps=0.3)
    river_paths[key] = paths
    pts = sum(p.count('L') + p.count('M') for p in paths)
    print(f'  {key:12s} {len(paths):3d} sub-paths, {pts:4d} pts')

# ============================================================== WORLD  MAP ==
from shapely.geometry import shape, box as sbox
from shapely.ops import unary_union

WORLD_N, WORLD_S = 90.0, -90.0
WLD_W = 1000.0
WLD_H = round(WLD_W * (WORLD_N - WORLD_S) / 360.0, 1)


def wld_pt(lon, lat):
    return ((lon + 180.0) / 360.0 * WLD_W, (WORLD_N - lat) / (WORLD_N - WORLD_S) * WLD_H)


w110 = load('ne_110m_admin_0_countries')
CONTINENT_KEY = {
    'North America': 'northamerica', 'South America': 'southamerica',
    'Europe': 'europe', 'Asia': 'asia', 'Africa': 'africa',
    'Oceania': 'australia', 'Antarctica': 'antarctica',
}
groups = {k: [] for k in CONTINENT_KEY.values()}

# Ural-line split for Russia, which Natural Earth files entirely under Europe.
URAL = 60.0
EUR_HALF, ASIA_HALF = sbox(-180, -90, URAL, 90), sbox(URAL, -90, 180, 90)

for f in w110['features']:
    props = f['properties']
    key = CONTINENT_KEY.get(props['CONTINENT'])
    if not key:
        continue
    geom = shape(f['geometry']).buffer(0)
    name = props['NAME']
    if name == 'Russia':
        groups['europe'].append(geom.intersection(EUR_HALF))
        groups['asia'].append(geom.intersection(ASIA_HALF))
        continue
    if name == 'France':
        # French Guiana rides along on the France feature.
        for part in getattr(geom, 'geoms', [geom]):
            groups['southamerica' if part.bounds[2] < -30 else 'europe'].append(part)
        continue
    groups[key].append(geom)

continents = {}
for key, parts in groups.items():
    merged = unary_union(parts).buffer(0.01).buffer(-0.01).simplify(0.12)
    paths = []
    for poly in getattr(merged, 'geoms', [merged]):
        for ring in [poly.exterior] + list(poly.interiors):
            pts = rdp([wld_pt(*c) for c in ring.coords], 0.3)
            if len(pts) >= 3 and ring_area(pts) >= 1.2:
                paths.append(fmt(pts, True))
    continents[key] = paths
    print(f'  {key:14s} {len(paths):3d} polygons')

# --------------------------------------------------------------- label anchors
# Hand-picked map positions for each answer label, projected with the same
# transforms so they stay pinned to the geography.
US_RIVER_LABEL_LONLAT = {
    'columbia':    (-120.6, 48.9),
    'missouri':    (-104.6, 47.6),
    'mississippi': (-91.0, 33.0),
    'ohio':        (-83.4, 37.6),
    'colorado':    (-112.4, 37.1),
    'riogrande':   (-104.0, 29.4),
    'stlawrence':  (-69.6, 49.6),
}
CONTINENT_LABEL_LONLAT = {
    'northamerica': (-100.0, 46.0),
    'southamerica': (-58.0, -12.0),
    'europe':       (17.0, 50.0),
    'africa':       (20.0, 4.0),
    'asia':         (95.0, 45.0),
    'australia':    (134.0, -25.0),
    'antarctica':   (10.0, -80.0),
}
OCEAN_LABEL_LONLAT = {
    'pacific':  (-142.0, 2.0),
    'atlantic': (-36.0, 12.0),
    'indian':   (78.0, -28.0),
    'arctic':   (-5.0, 81.0),
}

us_river_labels = {k: [round(v, 1) for v in us_pt(*p)] for k, p in US_RIVER_LABEL_LONLAT.items()}
continent_labels = {k: [round(v, 1) for v in wld_pt(*p)] for k, p in CONTINENT_LABEL_LONLAT.items()}
ocean_labels = {k: [round(v, 1) for v in wld_pt(*p)] for k, p in OCEAN_LABEL_LONLAT.items()}


# ------------------------------------------------------------------- output
def js_arr(paths, indent='    '):
    inner = ',\n'.join(f"{indent}  '{p}'" for p in paths)
    return '[\n' + inner + f',\n{indent}]' if paths else '[]'


with open('mapPaths.js', 'w') as fh:
    fh.write('// Generated from Natural Earth public-domain vector data.\n')
    fh.write('// US map: Albers equal-area conic. World map: equirectangular.\n')
    fh.write('// Regenerate with scripts/gen_maps.py -- do not hand-edit.\n\n')
    fh.write(f'export const US_VIEWBOX = "0 0 {US_W:g} {US_H:g}";\n')
    # Antarctica and the trans-antimeridian polygons close along the poles and
    # the +/-180 edges; inset the viewBox so those synthetic edges fall outside
    # it instead of drawing as stray straight lines.
    fh.write(f'export const WORLD_VIEWBOX = "0.4 0 {WLD_W - 0.8:g} 490";\n\n')
    fh.write(f'export const US_LAND = {js_arr(land)};\n\n')
    fh.write(f'export const US_STATE_LINES = {js_arr(state_lines)};\n\n')
    fh.write(f'export const US_LAKES = {js_arr(great_lakes)};\n\n')
    fh.write('export const US_RIVER_PATHS = {\n')
    for k, v in river_paths.items():
        fh.write(f'  {k}: {js_arr(v, "  ")},\n')
    fh.write('};\n\n')
    fh.write('export const CONTINENT_PATHS = {\n')
    for k, v in continents.items():
        fh.write(f'  {k}: {js_arr(v, "  ")},\n')
    fh.write('};\n')

    for name, data in (('US_RIVER_LABELS', us_river_labels),
                       ('CONTINENT_LABELS', continent_labels),
                       ('OCEAN_LABELS', ocean_labels)):
        fh.write(f'\nexport const {name} = {{\n')
        for k, (x, y) in data.items():
            fh.write(f'  {k}: {{ x: {x:g}, y: {y:g} }},\n')
        fh.write('};\n')

print(f'\nUS viewBox 0 0 {US_W:g} {US_H:g}   WORLD viewBox 0 0 {WLD_W:g} {WLD_H:g}')
import os
print('mapPaths.js', os.path.getsize('mapPaths.js') // 1024, 'KB')
