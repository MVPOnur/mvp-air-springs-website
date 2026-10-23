# MVP Air Springs website

A static website for US truck-parts distributors. It is plain HTML, CSS and JavaScript, with no build step, so any static host can serve it: Cloudflare Pages, Netlify, GitHub Pages or ordinary web hosting. Upload the contents of this `website/` folder as the site root.

## Pages

| Page | What it does |
|---|---|
| `index.html` | Home page. Core message, cross-reference search, supply line (Bursa → Elk Grove Village → distributor), facts, featured parts |
| `products.html` | Full catalog with search and an OEM filter (Hendrickson, Neway, …). `?q=W01-358-9781` pre-fills the search |
| `product.html?part=23-9781` | One page per product: technical drawing, interchange numbers, dimensions, print-friendly spec sheet |
| `distributors.html` | "Become a distributor" application form |

## Adding or changing products

Edit **`data/mvp-air-springs-products.csv`**. This is the only product file. Each row is one product:

| Column | Notes |
|---|---|
| `mvp_part` | Optional. If you leave it empty, the site builds it as `23-` + the last 4 digits of the Firestone number. If you fill it in and it does not match that rule, the browser console shows a warning. |
| `firestone`, `goodyear`, `contitech`, `oe_numbers` | Cross-reference numbers. To put several numbers in one cell, separate them with `\|` (for example `1R12-123\|1R12-456`). A note in brackets after a number, such as `1R12-095 (Plastic)`, is shown next to it but ignored by the search. |
| `oem` | OEM application from the catalog, for example `Hendrickson`. The catalog filter buttons come from this column, and searching the name lists its parts. |
| `application` | Optional, for example `Truck` or `Trailer`. |
| `style`, `description` | Short text |
| `compressed_height_in`, `extended_height_in`, `design_height_in`, `max_diameter_in` | Numbers in inches. The site also shows the value in mm. Empty columns are simply not shown. |
| `upper_mount`, `lower_mount`, `air_inlet` | Short text |
| `drawing` | Optional. A file name in `assets/drawings/`, used only when the drawing is not named after the part number. |
| `sample` | `yes` marks a placeholder row. |

The 86 products and drawings were taken from the MVP Air Springs catalog PDF. Each drawing is the side, top and bottom view from that catalog page.

## Drawings

Put drawings in `assets/drawings/` and name each one after the MVP part number, for example `23-9781.webp`. The site tries `.webp`, `.png`, `.svg` and `.jpg` in that order. If no file is found, the page shows a "Drawing to be added" frame.

## Placeholders to fill in

Open **`js/config.js`**. Every value in `[square brackets]` appears on the site in a dashed box until you replace it:
- email, phone and street addresses;
- typical ship time from Elk Grove Village.

Leave a fact in brackets until it is confirmed.

**Form delivery:** applications go through FormSubmit (`formEndpoint` in `js/config.js`) to sales@mvptruckparts.com, with no account needed:
- The very first application sends an **"Activate form"** email to that address. Click the link once, and every application after that arrives as an email with the answers in a table.
- If `formEndpoint` is emptied, the form opens the visitor's email app instead.
- A Formspree URL also works in `formEndpoint`.

## Preview locally

The site loads the CSV with `fetch`, which does not work when you double-click a file. Start a small web server instead:

```
cd website
python3 -m http.server 8000
```

Then open http://localhost:8000.

## 3D models

The home page hero shows 23-8050 in 3D, spinning on its own; visitors can turn it and it starts spinning again after a pause. A part that has a model also gets a **3D view** tab on its product page.

Each model is defined in `js/models3d.js` and drawn by `js/viewer3d.js`:
- **Body shape:** traced from a straight side photo. For 23-8050 it is also sized to the catalog drawing.
- **Textures:** in `assets/3d/<part>-top|bottom|side.webp`. These are the real top and bottom photos, plus the front and back side photos unwrapped around the body.
- **Turning on the product page tab:** list the part in `models3d` in `js/config.js`.
- **No 3D support in the browser:** the top photo is shown instead.

three.js is stored in `js/vendor/three/`, so the site does not depend on a CDN.

## Design notes

- **Style:** "drawing sheet". Paper-gray neutrals and hairline rules. Part numbers are set in IBM Plex Mono. Product cards and drawings sit in technical-drawing title blocks. Dark sections use deep navy with a blueprint grid.
- **Colors:** the brand colors only: navy `#13235B`, deep navy `#0B1638`, red `#B73A36` and blue `#3F5195`. Red is kept for calls to action.
- **Logo:** used only on white surfaces, because it does not work on dark backgrounds.
- **Fonts:** Barlow Condensed for headings and Barlow for body text, both from Google Fonts.
- **Accessibility:** skip link, visible focus rings, 44 px or larger touch targets, form errors shown next to each field plus a summary that receives focus, and reduced-motion support.
- **Search engines:** product pages are rendered in the browser from the CSV. If ranking for competitor part numbers becomes important, the next step is a small script that generates one static HTML file per product.
