# Worksheets

Printable recreations of workbook pages, for when Rose needs to do the homework
before she has the book.

## spanish-leccion-1-nouns-and-articles

Lección 1, page 3 of the Vista Higher Learning Workbook Activities
(1.1 Nouns and articles). Print the `.pdf`, or open the `.html` in a browser
and print at **100% / "Actual size"** — not "Fit to page", or the margins shift.

- `spanish-leccion-1-nouns-and-articles.html` — self-contained; the Activity 4
  pictures are embedded as base64 so the file prints correctly anywhere.
- `spanish-leccion-1-nouns-and-articles.pdf` — rendered from the HTML.
- `img/` — the Activity 4 artwork, extracted from a photo of the book page:
  deskewed 2.5°, lighting gradient divided out, paper tone clipped to white.
  Kept here so the pictures can be re-placed without redoing that cleanup.

Regenerate the PDF after editing the HTML:

```bash
chromium --headless --no-pdf-header-footer \
  --print-to-pdf=worksheets/spanish-leccion-1-nouns-and-articles.pdf \
  file://$PWD/worksheets/spanish-leccion-1-nouns-and-articles.html
```

Not part of the built app — this folder is outside `public/`, so nothing here
is deployed to GitHub Pages.
