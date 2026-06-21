#!/usr/bin/env python3
"""Render the RG Sports Bar Father's Day sign to PNG + PDF (300 DPI, US Letter)."""
from PIL import Image, ImageDraw, ImageFont

S = 3  # 850x1100 design space -> 2550x3300 (=300 DPI on 8.5x11in)
W, H = 850 * S, 1100 * S

DEJA_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FREE_BOLD_IT = "/usr/share/fonts/truetype/freefont/FreeSansBoldOblique.ttf"

def f(size, italic=False):
    return ImageFont.truetype(FREE_BOLD_IT if italic else DEJA_BOLD, int(size * S))

# colors
NAVY = (11, 31, 51)
WHITE = (255, 255, 255)
GOLD = (245, 197, 24)
RED = (200, 16, 46)
GREEN = (29, 122, 70)
BROWN = (75, 58, 0)

img = Image.new("RGB", (W, H), NAVY)
d = ImageDraw.Draw(img)

# --- vertical gradient background (top brighter -> bottom dark) ---
stops = [(0.0, (30, 58, 95)), (0.55, (11, 31, 51)), (1.0, (6, 20, 33))]
def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
for y in range(H):
    p = y / H
    for i in range(len(stops) - 1):
        p0, c0 = stops[i]; p1, c1 = stops[i + 1]
        if p0 <= p <= p1:
            col = lerp(c0, c1, (p - p0) / (p1 - p0)); break
    else:
        col = stops[-1][1]
    d.line([(0, y), (W, y)], fill=col)

def tracked(cx, cy, text, font, fill, tracking, stroke_w=0, stroke_fill=None):
    tracking *= S
    widths = [font.getlength(c) for c in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = cx - total / 2
    for c, w in zip(text, widths):
        d.text((x, cy), c, font=font, fill=fill, anchor="lm",
               stroke_width=stroke_w, stroke_fill=stroke_fill)
        x += w + tracking

def segments(cx, cy, segs, font):
    widths = [font.getlength(t) for t, _ in segs]
    total = sum(widths)
    x = cx - total / 2
    for (t, col), w in zip(segs, widths):
        d.text((x, cy), t, font=font, fill=col, anchor="lm")
        x += w

CX = 425 * S
def Y(v): return v * S

# --- stripes ---
seg = W // 3
for (x0, x1, c) in [(0, seg, RED), (seg, 2 * seg, GOLD), (2 * seg, W, GREEN)]:
    d.rectangle([x0, 0, x1, 22 * S], fill=c)
    d.rectangle([x0, H - 22 * S, x1, H], fill=c)

# --- brand ---
tracked(CX, Y(82), "THE", f(26), GOLD, 10)
# RG large two-color
rg = f(150); rw = rg.getlength("R"); gw = rg.getlength("G"); tr = 8 * S
tot = rw + gw + tr; x = CX - tot / 2
d.text((x, Y(195)), "R", font=rg, fill=WHITE, anchor="lm")
d.text((x + rw + tr, Y(195)), "G", font=rg, fill=GOLD, anchor="lm")
tracked(CX, Y(288), "SPORTS BAR", f(34), WHITE, 8)
# rule line
d.line([(180 * S, Y(323)), (670 * S, Y(323))], fill=GOLD, width=3 * S)

# --- headline ---
d.text((CX, Y(393)), "Happy", font=f(40, italic=True), fill=GOLD, anchor="mm")
tracked(CX, Y(462), "FATHER'S", f(80), WHITE, 2)
tracked(CX, Y(548), "DAY", f(86), RED, 6, stroke_w=int(2 * S), stroke_fill=WHITE)

# --- special box ---
d.rounded_rectangle([70 * S, 630 * S, 780 * S, 950 * S], radius=20 * S,
                    fill=GOLD, outline=WHITE, width=5 * S)
# tag pill
d.rounded_rectangle([300 * S, 651 * S, 550 * S, 691 * S], radius=20 * S, fill=RED)
tracked(CX, Y(672), "DAD'S DAY SPECIAL", f(20), WHITE, 3)
# deal
segments(CX, Y(735), [("BUY 1", RED), (" BEER,", NAVY)], f(48))
segments(CX, Y(792), [("GET 1 ", NAVY), ("HALF OFF", RED)], f(48))
# sub + fine
d.text((CX, Y(858)), "Free wings with any entree for Dad!", font=f(24), fill=NAVY, anchor="mm")
d.text((CX, Y(905)), "Valid Father's Day only  -  Dine-in  -  One special per guest",
       font=f(15), fill=BROWN, anchor="mm")

# --- footer ---
d.text((CX, Y(1003)), "Sunday, June 21, 2026   -   Doors Open 11 AM",
       font=f(23), fill=WHITE, anchor="mm")
tracked(CX, Y(1042), "CHEERS TO ALL THE DADS!", f(17), GOLD, 4)

img.save("/home/user/seasons-study-app/signs/fathers-day-sign.png", dpi=(300, 300))
img.save("/home/user/seasons-study-app/signs/fathers-day-sign.pdf", "PDF", resolution=300)
print("done")
