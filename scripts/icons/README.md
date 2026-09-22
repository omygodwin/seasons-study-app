# App icon

The **RG** monogram — all three girls are R. Godwin — on a deep indigo badge.
Everything in `public/` that is an icon comes from here; don't hand-edit the
PNGs.

## Why it is drawn as paths

The letters are SVG **paths**, not `<text>`. A text-based icon renders
differently (or not at all) depending on which fonts the machine has, and the
favicon is shipped as an SVG that the *viewer's* browser renders. Paths make it
identical everywhere.

## Three variants, because one does not survive every size

| Variant | Used for | Why |
|---|---|---|
| `icon-master.svg` | manifest icons, 192 and 512 | Full mark, 34px strokes, amber bar |
| `icon-ios.svg` | `apple-touch-icon.png` | Same art, **square, no rounded corners** — iOS applies its own squircle mask, and composites a transparent icon onto black |
| `icon-small.svg` | `favicon.svg`, 16/32/48 PNGs | **Heavier 46px strokes, no amber bar.** The full mark turns to mush below about 48px, and browsers that prefer the SVG favicon render it at 16px |
| `icon-maskable.svg` | `icon-maskable-512.png` | Full bleed, mark scaled to 78% so it survives Android's circle crop |

The favicon being the simplified variant is deliberate. If you point the SVG
favicon at the master, tabs get a grey smudge.

## Regenerating

```bash
cd scripts/icons
python3 gen_icons.py     # writes the four SVGs here
npm i -D playwright && npx playwright install chromium
node raster.mjs          # writes the PNGs into public/
```

Then copy `icon-small.svg` to `public/favicon.svg`.

## If you change the colors

`index.html`'s `theme-color` and `manifest.json`'s `theme_color` /
`background_color` are matched to the badge gradient by hand — update them too,
or the splash screen will flash a color the icon does not use.
