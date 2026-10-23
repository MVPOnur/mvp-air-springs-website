# MVP Air Springs website: notes for Claude Code

Static marketing site for MVP Air Springs (heavy-duty truck and trailer air springs). Factory in Bursa, Türkiye; US warehouse in Elk Grove Village, Illinois. The audience is US truck-parts distributors. There is no checkout and there are no prices. The goal is distributor applications and trust.

## Working with the owner
- The owner is **Onur Aykanat**. He is not a developer. Talk to him in **Turkish**, in plain language, with numbered click-by-click steps when he has to do something.
- The site itself, code, comments and commit messages are in **English**.

## Rules
- **Don't invent facts.** Capacity, certifications, years, warranty and shipping countries come only from Onur or the MVP catalog. Anything not yet confirmed stays a `[bracketed]` placeholder in `js/config.js`, which shows as a dashed box on the site.
- **Cross-reference numbers must be verified.** Numbers found online are not added to the live CSV until Onur approves them.
- **Footer disclaimer stays:** competitor brand names are trademarks of their owners, and part numbers are for cross-reference only.
- **Brand colors are fixed:** navy `#13235B`, deep navy `#0B1638`, red `#B73A36`, blue `#3F5195`. No orange. The logo (`assets/logo-mvp-air-springs.png`, web copy `assets/logo.webp`) only goes on light backgrounds.
- **Keep it a static site** with no build step and no framework, so any host can serve it.

## Where things are
- **Products:** `data/mvp-air-springs-products.csv` is the only product file.
- **Drawings:** `assets/drawings/<MVP number>.webp`, cut from the catalog PDF.
- **MVP numbers:** `23-` + the last 4 digits of the Firestone number.
- **Supply-line map:** `assets/route-map.svg` is generated from Natural Earth data. It is animated by `js/route-map.js`.
- **Contacts, facts, photos, form endpoint:** `js/config.js`.
- **Product lines (cab, truck, trailer):** one tractor-trailer drawn as inline SVG in `index.html` (regenerate with care: the drive script relies on its `.chassis`, `.axle`, `.spring[data-group]` and `.callout` groups). `js/lines-drive.js` rolls it over potholes so the springs stretch, and the pick cards below highlight a product line on the rig.
- **3D air springs:**
  - Models are defined in `js/models3d.js`. Each model's profile is traced from a side photo; 23-8050 is also sized to its catalog drawing.
  - `js/viewer3d.js` draws them with three.js, vendored in `js/vendor/three/` (MIT) and loaded through an import map on `index.html` and `product.html`.
  - Textures are in `assets/3d/`.
  - Product page tabs appear for parts listed in `models3d` in `js/config.js`.
- **Hero video:** factory footage in `assets/video/` (720p for desktop, 480p for phones, WebM + MP4, poster frame), started by `js/hero-video.js`; reduced motion and Save-Data keep the poster. Encode new footage small (24 fps, no audio): it sits under a navy film.
- **About page:** `about.html`. The factory photo slot reads `photos.factory` in `js/config.js`.
- **"What goes into an MVP air spring":** `assets/inside-air-spring.webp` is Onur's cutaway illustration, cleaned and laid out on a transparent canvas; the rings, leaders and numbers are SVG/HTML in `index.html`. Its list holds only facts Onur confirmed (molded part number, 4.5–5.0 mm rubber, 4140 studs, leak test, 3-year warranty).
- **Live preview:** GitHub Pages serves `main` at https://mvponur.github.io/mvp-air-springs-website/ (keep all paths relative).

## Checks before pushing
1. Serve the site with `python3 -m http.server`.
2. Open it at 390 px and at 1440 px wide.
3. Confirm there are no console errors and no horizontal scroll.
4. Confirm the search finds parts by Firestone, Goodyear and ContiTech number.
