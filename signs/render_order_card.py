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

def cb(x, yc, label, font, fill=INK, box=28):
    """checkbox + label centered on yc; returns x after label."""
    d.rectangle([x, yc - box / 2, x + box, yc + box / 2], outline=NAVY, width=3)
    d.text((x + box + 12, yc), label, font=font, fill=fill, anchor="lm")
    return x + box + 12 + font.getlength(label)

def draw_card(ox, oy, cw, ch):
    cx = ox + cw / 2
    d.rectangle([ox, oy, ox + cw, oy + ch], outline=GOLD, width=6)
    # --- header band ---
    hh = int(ch * 0.135)
    d.rectangle([ox, oy, ox + cw, oy + hh], fill=NAVY)
    seg = cw / 3
    d.rectangle([ox, oy + hh, ox + seg, oy + hh + 9], fill=RED)
    d.rectangle([ox + seg, oy + hh, ox + 2 * seg, oy + hh + 9], fill=GOLD)
    d.rectangle([ox + 2 * seg, oy + hh, ox + cw, oy + hh + 9], fill=GREEN)
    tracked(cx, oy + hh * 0.32, "THE RG SPORTS BAR", fb(8.5), GOLD, 3)
    tracked(cx, oy + hh * 0.70, "FATHER'S DAY ORDER", fb(14), WHITE, 2)

    padx = 48
    lx = ox + padx
    rx = ox + cw - padx
    lab = fb(11)
    sm = fr(8.5)
    y = oy + hh + 70

    # Name + Table
    d.text((lx, y), "Name:", font=lab, fill=NAVY, anchor="lm")
    tlbl_x = ox + cw * 0.64
    writeline(lx + lab.getlength("Name:") + 16, tlbl_x - 22, y + 24)
    d.text((tlbl_x, y), "Table #:", font=lab, fill=NAVY, anchor="lm")
    writeline(tlbl_x + lab.getlength("Table #:") + 14, rx, y + 24)
    y += 80

    # Beer picker
    d.text((lx, y), "Pick your beer:", font=lab, fill=NAVY, anchor="lm")
    y += 52
    beers = ["Bud Light", "Coors Lt", "Miller Lt", "IPA", "Corona", "Other:____"]
    colw = (rx - lx) / 3
    for i, b in enumerate(beers):
        r, c = divmod(i, 3)
        cb(lx + c * colw, y + r * 52, b, sm)
    y += 52 + 70

    # Entree + Wings
    for label in ["Entree:", "Wing flavor (FREE!):"]:
        d.text((lx, y), label, font=lab, fill=NAVY, anchor="lm")
        writeline(lx + lab.getlength(label) + 18, rx, y + 24)
        y += 70

    # Special checkbox
    endx = cb(lx, y, "Add the ", fr(10))
    d.text((endx, y), "Buy 1 Beer, Get 1 HALF OFF", font=fb(10), fill=RED, anchor="lm")
    y += 76

    # Service rating
    d.text((lx, y), "How's your service?", font=lab, fill=NAVY, anchor="lm")
    sx = lx + lab.getlength("How's your service?") + 26
    sx = cb(sx, y, "Great", sm) + 26
    sx = cb(sx, y, "Good", sm) + 26
    cb(sx, y, "Okay", sm)
    y += 70

    # Notes
    d.text((lx, y), "Notes:", font=lab, fill=NAVY, anchor="lm")
    writeline(lx + lab.getlength("Notes:") + 18, rx, y + 24)

    # Footer
    d.text((cx, oy + ch - 46), "Hand to your server  -  Happy Father's Day, Dad!",
           font=fi(9), fill=GREEN, anchor="mm")

# --- layout: 2 cols x 3 rows ---
mL, mT = 70, 70
cell_w = (W - 2 * mL) / 2
cell_h = (H - 2 * mT) / 3
inset = 22
for r in range(3):
    for c in range(2):
        draw_card(mL + c * cell_w + inset, mT + r * cell_h + inset,
                  cell_w - 2 * inset, cell_h - 2 * inset)

# faint cut guides
x = mL + cell_w
for yy in range(0, H, 30):
    d.line([(x, yy), (x, yy + 14)], fill=(200, 200, 200), width=2)
for r in range(1, 3):
    yv = mT + r * cell_h
    for xx in range(0, W, 30):
        d.line([(xx, yv), (xx + 14, yv)], fill=(200, 200, 200), width=2)

img.save("/home/user/seasons-study-app/signs/fathers-day-order-card.png", dpi=(DPI, DPI))
img.save("/home/user/seasons-study-app/signs/fathers-day-order-card.pdf", "PDF", resolution=DPI)
print("done")
