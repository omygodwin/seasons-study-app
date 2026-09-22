# Deploying

Pushing to `main` deploys. There is no manual step and no staging site.

**Live: <https://omygodwin.github.io/seasons-study-app/>**

## The pipeline

`.github/workflows/deploy.yml` builds four separate npm projects and stitches
their output into one directory:

1. Build the root app → `dist/`
2. Build `animal-hospital/` → copy to `dist/hospital/`
3. Build `hotel/` → copy to `dist/hotel/`
4. Build `movie-theater/` → copy to `dist/movie-theater/`
5. Upload the merged `dist/` to GitHub Pages

A normal run takes **70–90 seconds**. If a deploy is taking many minutes,
something is wrong with dependency installs — see the history below.

## Watching a deploy

Pages serves the previous build until the run finishes, so a refresh straight
after merging will still show the old site. Check the run before assuming a
deploy failed: **Actions → Deploy to GitHub Pages**.

If the site still looks stale after a green run, it is browser caching of
`index.html`. There is no service worker, so re-entering the URL from the
address bar clears it. The JS and CSS filenames are content-hashed, so once
the new `index.html` arrives everything else follows.

## The base path

Vite's `base` is `/seasons-study-app/`, matching the Pages project URL.
Changing it breaks every asset path and every internal link, so don't,
unless you are also moving the site.

## Why every app installs with `npm ci`

All four projects commit a lockfile and the workflow installs with `npm ci`.
This is deliberate and worth preserving.

`hotel/` and `movie-theater/` used to have **no lockfile** — removed in
commit `83762e3` to dodge an esbuild version clash between the apps. Without
a lockfile, `npm install` re-resolves the whole dependency tree from the
registry on every deploy. Per-step timings across six runs:

| Step | Typical | Worst |
| --- | --- | --- |
| hotel install | 18–24s | **390s** |
| hospital install | 8–10s | **313s** |
| movie-theater install | 13–14s | **94s** |
| every build step | 3–6s | 6s |

That was the difference between an 80-second and a 14-minute deploy — around
95% of each run was dependency installation, and all of the variance was
there. The lockfiles were regenerated, the esbuild clash did not recur, and
installs moved to `npm ci`.

**Keep the lockfiles committed and keep the installs on `npm ci`.** If the
esbuild clash ever returns, fix the versions rather than deleting a lockfile.

Installs also pass `--prefer-offline --no-audit --no-fund` to cut registry
chatter, and `setup-node`'s `cache-dependency-path` lists all four lockfiles
so the cached `~/.npm` covers every app and invalidates when any of them
changes.
