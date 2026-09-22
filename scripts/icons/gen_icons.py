"""Generates the Godwin Studies app icon. See README.md in this directory.

The RG monogram is drawn as PATHS, not text, so it renders identically without
depending on a font being installed. Run gen_icons.py to write the SVGs, then
raster.mjs to produce the PNGs."""

import math, pathlib

OUT = pathlib.Path(__file__).resolve().parent

CY = 256

def g_path(cx, r):
    th = math.radians(-35)
    x1, y1 = cx + r*math.cos(th), CY + r*math.sin(th)
    return f"M {x1:.1f} {y1:.1f} A {r} {r} 0 1 0 {cx+r:.1f} {CY} L {cx+10:.1f} {CY}"

def r_paths(sx, top, bot, bowl, leg):
    mid = top + bowl*2
    return [f"M {sx} {top} L {sx} {bot}",
            f"M {sx} {top} A {bowl} {bowl} 0 0 1 {sx} {mid}",
            f"M {sx+5} {mid-2} L {sx+leg} {bot}"]

GRAD = '''<linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#4338ca"/>
      <stop offset="0.5" stop-color="#312e81"/>
      <stop offset="1" stop-color="#151438"/>
    </linearGradient>'''

def mark(stroke, rs, rtop, rbot, rbowl, rleg, gcx, gr, bar):
    paths = "".join(f'<path d="{d}"/>' for d in r_paths(rs, rtop, rbot, rbowl, rleg) + [g_path(gcx, gr)])
    amber = '<rect x="150" y="408" width="212" height="20" rx="10" fill="#f59e0b"/>' if bar else ''
    return (f'<g fill="none" stroke="#f8fafc" stroke-width="{stroke}" '
            f'stroke-linecap="round" stroke-linejoin="round">{paths}</g>{amber}')

def wrap(inner, rx=112, scale=1.0, label='Godwin Studies'):
    t = f'<g transform="translate({256*(1-scale):.1f} {256*(1-scale):.1f}) scale({scale:.3f})">{inner}</g>' if scale != 1.0 else inner
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" '
            f'role="img" aria-label="{label}"><defs>{GRAD}</defs>'
            f'<rect width="512" height="512" rx="{rx}" fill="url(#bg)"/>{t}</svg>')

# Master: the home-screen / manifest art. Amber bar included.
FULL = mark(34, 77, 151, 361, 62, 87, 331, 105, bar=True)
# Simplified: for 16-32px. Heavier stroke, no bar, optically centred.
SMALL = mark(46, 86, 140, 372, 66, 92, 330, 110, bar=False)

(OUT / 'icon-master.svg').write_text(wrap(FULL))
(OUT / 'icon-small.svg').write_text(wrap(SMALL))
(OUT / 'icon-maskable.svg').write_text(wrap(FULL, rx=0, scale=0.78))
(OUT / 'icon-ios.svg').write_text(wrap(FULL, rx=0))
print('wrote icon-master.svg, icon-small.svg, icon-maskable.svg, icon-ios.svg')
