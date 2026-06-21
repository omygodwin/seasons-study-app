#!/usr/bin/env python3
"""RG Sports Bar Father's Day ORDER CARD - 6 per US Letter sheet (2 cols x 3 rows), 300 DPI."""
from PIL import Image, ImageDraw, ImageFont

DPI = 300
W, H = int(8.5 * DPI), int(11 * DPI)  # 2550 x 3300

DEJA_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
DEJA_R = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FREE_BI = "/usr/share/fonts/truetype/freefont/FreeSansBoldOblique.ttf"

def fb(pt): return ImageFont.truetype(DEJA_B, int(pt * DPI / 72))
def fr(pt): return ImageFont.truetype(DEJA_R, int(pt * DPI / 72))
def fi(pt): return ImageFont.truetype(FREE_BI, int(pt * DPI / 72))

NAVY = (11, 31, 51)
WHITE = (255, 255, 255)
GOLD = (245, 197, 24)
RED = (200, 16, 46)
GREEN = (29, 122, 70)
INK = (40, 40, 40)
LINEGRAY = (120, 120, 120)

img = Image.new("RGB", (W, H), WHITE)
d = ImageDraw.Draw(img)

def tracked(cx, cy, text, font, fill, tracking):
    widths = [font.getlength(c) for c in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = cx - total / 2
    for c, w in zip(text, widths):
        d.text((x, cy), c, font=font, fill=fill, anchor="lm")
        x += w + tracking

def writeline(x0, x1, y):
    d.line([(x0, y), (x1, y)], fill=LINEGRAY, width=3)

def checkbox(x, y, s):
    d.rectangle([x, y, x + s, y + s], outline=NAVY, width=4)

def draw_card(ox, oy, cw, ch):
    cx = ox + cw / 2
    # card border + corner stripe accents
    d.rectangle([ox, oy, ox + cw, oy + ch], outline=GOLD, width=6)
    # --- header band ---
    hh = int(ch * 0.155)
    d.rectangle([ox, oy, ox + cw, oy + hh], fill=NAVY)
    # 3-color accent line under header
    seg = cw / 3
    d.rectangle([ox, oy + hh, ox + seg, oy + hh + 10], fill=RED)
    d.rectangle([ox + seg, oy + hh, ox + 2 * seg, oy + hh + 10], fill=GOLD)
    d.rectangle([ox + 2 * seg, oy + hh, ox + cw, oy + hh + 10], fill=GREEN)
    # brand line
    tracked(cx, oy + hh * 0.32, "THE RG SPORTS BAR", fb(9), GOLD, 4)
    tracked(cx, oy + hh * 0.70, "FATHER'S DAY ORDER", fb(15), WHITE, 2)

    # --- body fields ---
    padx = 55
    lx = ox + padx
    rx = ox + cw - padx
    y = oy + hh + 95
    lh = int((ch - hh - 200) / 6)  # row spacing

    lab = fb(12); fld = fr(11)

    # Row: Name + Table
    d.text((lx, y), "Name:", font=lab, fill=NAVY, anchor="lm")
    nstart = lx + lab.getlength("Name:") + 20
    tlbl_x = ox + cw * 0.66
    writeline(nstart, tlbl_x - 25, y + 26)
    d.text((tlbl_x, y), "Table #:", font=lab, fill=NAVY, anchor="lm")
    writeline(tlbl_x + lab.getlength("Table #:") + 15, rx, y + 26)
    y += lh

    for label in ["Drink / Beer:", "Entree:", "Wing flavor (FREE!):"]:
        d.text((lx, y), label, font=lab, fill=NAVY, anchor="lm")
        writeline(lx + lab.getlength(label) + 20, rx, y + 26)
        y += lh

    # checkbox special
    bs = 36
    checkbox(lx, y - bs / 2, bs)
    d.text((lx + bs + 18, y), "Add the ", font=fld, fill=INK, anchor="lm")
    sx = lx + bs + 18 + fld.getlength("Add the ")
    d.text((sx, y), "Buy 1 Beer, Get 1 HALF OFF", font=fb(11), fill=RED, anchor="lm")
    y += lh

    # Notes
    d.text((lx, y), "Notes:", font=lab, fill=NAVY, anchor="lm")
    writeline(lx + lab.getlength("Notes:") + 20, rx, y + 26)

    # --- footer ---
    fy = oy + ch - 52
    d.text((cx, fy), "Hand to your server  -  Happy Father's Day, Dad!",
           font=fi(9.5), fill=GREEN, anchor="mm")

# --- layout: 2 cols x 3 rows ---
mL, mT = 70, 70
cell_w = (W - 2 * mL) / 2
cell_h = (H - 2 * mT) / 3
inset = 22
for r in range(3):
    for c in range(2):
        ox = mL + c * cell_w + inset
        oy = mT + r * cell_h + inset
        draw_card(ox, oy, cell_w - 2 * inset, cell_h - 2 * inset)

# faint cut guides between cards
for c in range(1, 2):
    x = mL + c * cell_w
    for yy in range(0, H, 30):
        d.line([(x, yy), (x, yy + 14)], fill=(200, 200, 200), width=2)
for r in range(1, 3):
    yv = mT + r * cell_h
    for xx in range(0, W, 30):
        d.line([(xx, yv), (xx + 14, yv)], fill=(200, 200, 200), width=2)

img.save("/home/user/seasons-study-app/signs/fathers-day-order-card.png", dpi=(DPI, DPI))
img.save("/home/user/seasons-study-app/signs/fathers-day-order-card.pdf", "PDF", resolution=DPI)
print("done")
