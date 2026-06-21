#!/usr/bin/env python3
"""RG Sports Bar Father's Day PICTURE MENU - illustrated icons, US Letter, 300 DPI."""
from PIL import Image, ImageDraw, ImageFont
import math

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
INK = (45, 45, 45)
GRAY = (105, 105, 105)
CREAM = (250, 247, 238)

# icon palette
AMBER = (232, 168, 40); FOAM = (255, 252, 245)
BUN = (214, 162, 96); PATTY = (96, 58, 34); LETTUCE = (95, 165, 70)
SAUSAGE = (150, 82, 45); TENDER = (210, 150, 72)
BUFFALO = (214, 86, 38); COFFEE = (70, 44, 30)
WATERBL = (120, 185, 222); WINERED = (122, 22, 52)
SELTZER = (236, 120, 66); BEANS = (54, 138, 58)

img = Image.new("RGB", (W, H), WHITE)
d = ImageDraw.Draw(img)

def tracked(cx, cy, text, font, fill, tracking):
    widths = [font.getlength(c) for c in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = cx - total / 2
    for c, w in zip(text, widths):
        d.text((x, cy), c, font=font, fill=fill, anchor="lm"); x += w + tracking

def rr(box, rad, **kw): d.rounded_rectangle(box, radius=rad, **kw)
def ell(cx, cy, rx, ry, **kw): d.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], **kw)

# ---------------- ICONS (drawn within radius s around cx,cy) ----------------
def ic_beer(cx, cy, s):
    bw, bh = 1.0*s, 1.5*s
    x0, y0 = cx-bw/2-0.1*s, cy-bh/2
    # handle
    d.ellipse([x0+bw-0.1*s, y0+0.3*s, x0+bw+0.7*s, y0+1.15*s], outline=AMBER, width=int(0.18*s))
    rr([x0, y0+0.25*s, x0+bw, y0+bh], rad=0.18*s, fill=AMBER, outline=(150,100,10), width=4)
    # foam
    rr([x0, y0, x0+bw, y0+0.5*s], rad=0.22*s, fill=FOAM, outline=(210,205,195), width=3)
    for i in range(3):
        ell(x0+0.25*s+i*0.28*s, y0+0.12*s, 0.2*s, 0.18*s, fill=FOAM, outline=(210,205,195), width=3)

def ic_can(cx, cy, s, body=SELTZER):
    bw, bh = 0.95*s, 1.6*s
    rr([cx-bw/2, cy-bh/2, cx+bw/2, cy+bh/2], rad=0.16*s, fill=body, outline=(60,60,60), width=4)
    d.rectangle([cx-bw/2, cy-0.2*s, cx+bw/2, cy+0.2*s], fill=WHITE)
    d.line([cx-bw/2, cy-0.2*s, cx+bw/2, cy-0.2*s], fill=(60,60,60), width=3)
    d.line([cx-bw/2, cy+0.2*s, cx+bw/2, cy+0.2*s], fill=(60,60,60), width=3)

def ic_wine(cx, cy, s):
    ell(cx, cy-0.35*s, 0.5*s, 0.55*s, fill=WINERED, outline=(70,10,30), width=4)
    d.pieslice([cx-0.5*s, cy-0.9*s, cx+0.5*s, cy+0.2*s], 20, 160, fill=(245,245,250), outline=(70,10,30), width=4)
    d.rectangle([cx-0.05*s, cy+0.15*s, cx+0.05*s, cy+0.9*s], fill=(70,10,30))
    d.line([cx-0.35*s, cy+0.9*s, cx+0.35*s, cy+0.9*s], fill=(70,10,30), width=int(0.14*s))

def ic_coffee(cx, cy, s):
    # iced coffee glass
    pts = [(cx-0.5*s, cy-0.7*s),(cx+0.5*s, cy-0.7*s),(cx+0.4*s, cy+0.8*s),(cx-0.4*s, cy+0.8*s)]
    d.polygon(pts, fill=COFFEE, outline=(40,25,15))
    d.polygon([(cx-0.5*s, cy-0.7*s),(cx+0.5*s, cy-0.7*s),(cx+0.47*s, cy-0.35*s),(cx-0.47*s, cy-0.35*s)],
              fill=(180,140,110))  # cream top
    for ix in [(-0.2,-0.4),(0.15,-0.15),(-0.05,0.2)]:  # ice cubes
        d.rectangle([cx+ix[0]*s, cy+ix[1]*s, cx+ix[0]*s+0.22*s, cy+ix[1]*s+0.22*s],
                    outline=(220,230,235), width=3)
    d.line([cx+0.25*s, cy-0.95*s, cx+0.1*s, cy+0.7*s], fill=RED, width=int(0.12*s))  # straw

def ic_water(cx, cy, s):
    pts = [(cx-0.45*s, cy-0.75*s),(cx+0.45*s, cy-0.75*s),(cx+0.33*s, cy+0.8*s),(cx-0.33*s, cy+0.8*s)]
    d.polygon(pts, outline=(120,140,150), width=4)
    d.polygon([(cx-0.4*s, cy-0.1*s),(cx+0.4*s, cy-0.1*s),(cx+0.33*s, cy+0.8*s),(cx-0.33*s, cy+0.8*s)],
              fill=WATERBL)
    ell(cx+0.15*s, cy+0.25*s, 0.06*s, 0.06*s, fill=(180,215,235))

def ic_wings(cx, cy, s):
    for ox, oy in [(-0.4,-0.25),(0.35,-0.2),(0.0,0.35)]:
        ell(cx+ox*s, cy+oy*s, 0.42*s, 0.34*s, fill=BUFFALO, outline=(150,50,20), width=4)
        ell(cx+ox*s-0.1*s, cy+oy*s-0.08*s, 0.12*s, 0.08*s, fill=(235,140,90))

def ic_burger(cx, cy, s):
    d.pieslice([cx-0.7*s, cy-0.95*s, cx+0.7*s, cy+0.05*s], 180, 360, fill=BUN, outline=(150,100,50), width=4)
    for i in range(5):
        ell(cx-0.45*s+i*0.22*s, cy-0.78*s, 0.04*s, 0.04*s, fill=(245,235,200))  # seeds
    d.rectangle([cx-0.68*s, cy-0.05*s, cx+0.68*s, cy+0.12*s], fill=LETTUCE)
    rr([cx-0.7*s, cy+0.1*s, cx+0.7*s, cy+0.42*s], rad=0.1*s, fill=PATTY)
    d.polygon([(cx-0.6*s, cy+0.42*s),(cx+0.6*s, cy+0.42*s),(cx+0.5*s, cy+0.58*s),(cx-0.5*s, cy+0.58*s)], fill=(235,205,90))  # cheese
    rr([cx-0.7*s, cy+0.55*s, cx+0.7*s, cy+0.85*s], rad=0.12*s, fill=BUN, outline=(150,100,50), width=4)

def ic_tenders(cx, cy, s):
    for ox, oy, ang in [(-0.25,-0.3,20),(0.2,0.0,-15),(-0.1,0.35,8)]:
        rr([cx+ox*s-0.45*s, cy+oy*s-0.18*s, cx+ox*s+0.45*s, cy+oy*s+0.18*s], rad=0.18*s,
           fill=TENDER, outline=(150,100,40), width=4)
        for dx in (-0.2,0,0.2):
            ell(cx+ox*s+dx*s, cy+oy*s, 0.03*s, 0.03*s, fill=(160,110,50))

def ic_brat(cx, cy, s):
    rr([cx-0.75*s, cy-0.15*s, cx+0.75*s, cy+0.5*s], rad=0.28*s, fill=BUN, outline=(150,100,50), width=4)
    rr([cx-0.8*s, cy-0.4*s, cx+0.8*s, cy+0.05*s], rad=0.22*s, fill=SAUSAGE, outline=(95,50,25), width=4)
    # mustard zigzag
    pts = []
    for i in range(7):
        pts.append((cx-0.7*s+i*0.23*s, cy-0.27*s + (0.12*s if i%2 else -0.05*s)))
    d.line(pts, fill=(240,200,40), width=int(0.1*s), joint="curve")

def ic_beans(cx, cy, s):
    for ox, oy, a in [(-0.2,-0.3,30),(0.15,-0.15,-25),(-0.05,0.1,15),(0.2,0.35,-10),(-0.25,0.4,40)]:
        x0 = cx+ox*s; y0 = cy+oy*s
        rr([x0-0.5*s, y0-0.1*s, x0+0.5*s, y0+0.1*s], rad=0.1*s, fill=BEANS, outline=(30,90,30), width=3)

def badge(cx, cy, R, icon):
    ell(cx, cy, R, R, fill=CREAM, outline=GOLD, width=6)
    icon(cx, cy, R*0.72)

# ---------------- HEADER ----------------
d.rectangle([0, 0, W, 360], fill=NAVY)
seg = W/3
d.rectangle([0,360,seg,374], fill=RED); d.rectangle([seg,360,2*seg,374], fill=GOLD); d.rectangle([2*seg,360,W,374], fill=GREEN)
tracked(W/2, 78, "THE  RG  SPORTS  BAR", fb(20), GOLD, 4)
tracked(W/2, 200, "FATHER'S DAY MENU", fb(40), WHITE, 2)
d.text((W/2, 285), "Happy Father's Day, Dad!  Dig in.", font=fi(15), fill=GOLD, anchor="mm")
d.rectangle([0,360,seg,374], fill=RED); d.rectangle([seg,360,2*seg,374], fill=GOLD); d.rectangle([2*seg,360,W,374], fill=GREEN)

# ---------------- SECTION HELPERS ----------------
def section_header(x, y, w, text):
    rr([x, y, x+w, y+70], rad=14, fill=NAVY)
    tracked(x+w/2, y+36, text, fb(18), GOLD, 4)

def item(x, y, icon, name, desc):
    R = 70
    badge(x+R, y, R, icon)
    tx = x + 2*R + 40
    d.text((tx, y-28), name, font=fb(14), fill=NAVY, anchor="lm")
    if desc:
        d.text((tx, y+28), desc, font=fr(10), fill=GRAY, anchor="lm")

def subhead(x, y, text):
    f = fb(12)
    d.text((x, y), text, font=f, fill=RED, anchor="lm")
    d.line([(x+ f.getlength(text)+24, y),(x+colw-20, y)], fill=GOLD, width=3)

# ---------------- LAYOUT: two columns ----------------
colL = 110
colR = 1320
colw = 1120
top = 470

# FOOD (left)
section_header(colL, top, colw, "FOOD")
fy = top + 160
foods = [
    (ic_wings,  "Boneless Wings",  "Buffalo or BBQ, tossed to order"),
    (ic_tenders,"Chicken Tenders", "Hand-breaded & crispy"),
    (ic_brat,   "Brats",           "Grilled, served on a bun"),
    (ic_beans,  "Green Beans",     "Fresh side"),
]
for ic, nm, ds in foods:
    item(colL+10, fy, ic, nm, ds); fy += 195

# left-column special callout (fills space + cross-promotes)
sb_y = fy + 40
scx = colL + colw/2
rr([colL, sb_y, colL+colw, sb_y+440], rad=24, fill=GOLD, outline=NAVY, width=6)
rr([scx-205, sb_y+34, scx+205, sb_y+98], rad=32, fill=RED)
tracked(scx, sb_y+66, "DAD'S DAY SPECIAL", fb(15), WHITE, 3)
d.text((scx, sb_y+170), "Buy 1 Beer,", font=fb(22), fill=NAVY, anchor="mm")
segs=[("Get 1 ", NAVY),("HALF OFF", RED)]
fbig=fb(22); tw=sum(fbig.getlength(t) for t,_ in segs); xx=scx-tw/2
for t,cc in segs:
    d.text((xx, sb_y+250), t, font=fbig, fill=cc, anchor="lm"); xx+=fbig.getlength(t)
d.text((scx, sb_y+340), "+ FREE wings with any entree", font=fb(13), fill=NAVY, anchor="mm")
d.text((scx, sb_y+400), "Happy Father's Day, Dad!", font=fi(13), fill=GREEN, anchor="mm")

# DRINKS (right)
section_header(colR, top, colw, "DRINKS")
ry = top + 150

def drink_group(title, items):
    global ry
    subhead(colR+12, ry, title); ry += 95
    for ic, nm, ds in items:
        item(colR+10, ry, ic, nm, ds); ry += 195
    ry += 30

drink_group("BEER", [
    (ic_beer, "Garage Beer", "Lime"),
    (ic_beer, "Modelo", "Mexican lager"),
    (ic_beer, "Charleston Beer", "Local favorite"),
    (ic_beer, "Hazy IPA", "Hoppy & smooth"),
    (ic_beer, "Three Notch'd JazzFest", "Seasonal ale"),
])
drink_group("SELTZER", [
    (lambda a,b,c: ic_can(a,b,c, SELTZER), "White Claw", "Blood Orange"),
])
drink_group("WINE", [
    (ic_wine, "DAOU Cabernet", "Paso Robles"),
])
drink_group("NON-ALCOHOLIC", [
    (ic_water,  "Water", "Ice cold"),
    (ic_coffee, "Iced Coffee", "Fresh brewed"),
])

# footer
d.line([(110, H-150),(W-110, H-150)], fill=GOLD, width=4)
d.text((W/2, H-100), "Ask your server about today's Father's Day special!",
       font=fb(13), fill=NAVY, anchor="mm")

img.save("/home/user/seasons-study-app/signs/fathers-day-menu.png", dpi=(DPI, DPI))
img.save("/home/user/seasons-study-app/signs/fathers-day-menu.pdf", "PDF", resolution=DPI)
print("done")
