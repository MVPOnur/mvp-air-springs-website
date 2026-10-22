// Product page: product.html?part=23-9781
(function () {
  "use strict";
  const D = window.MVP_DATA;
  const UI = window.MVP_UI;
  const esc = (s) => UI.escapeHtml(s);
  const TBC = '<span class="tbc">To be added</span>';

  function dimensionRows(p) {
    return p.dimensions.filter((d) => isFinite(d.inches)).map((d) => {
      const f = D.formatInches(d.inches);
      return `<tr><th scope="row">${esc(d.label)}</th>${f
        ? `<td>${f.inches}<span class="alt">${f.mm}</span></td>`
        : `<td class="missing">${TBC}</td>`}</tr>`;
    }).join("");
  }

  function detailRows(p) {
    return p.details.filter((d) => d.value).map((d) => `<tr><th scope="row">${esc(d.label)}</th>${d.value
      ? `<td>${esc(d.value)}</td>` : `<td class="missing">${TBC}</td>`}</tr>`).join("");
  }

  function interchangeRows(p) {
    const rows = [`<tr><th scope="row">MVP</th><td><strong>${esc(p.mvp)}</strong></td></tr>`];
    for (const x of p.interchange) {
      rows.push(`<tr><th scope="row">${esc(x.brand)}</th><td>${esc(x.number)}${x.note ? `<span class="alt">${esc(x.note)}</span>` : ""}</td></tr>`);
    }
    return rows.join("");
  }

  function render(host, p) {
    const title = `MVP ${p.mvp}`;
    const fs = p.interchange.find((x) => x.brand === "Firestone");
    document.title = `${title}${fs ? " (Firestone " + fs.number + ")" : ""} Air Spring — MVP Air Springs`;
    document.querySelector('meta[name="description"]').content =
      `MVP ${p.mvp} heavy-duty air spring. Technical drawing, dimensions and interchange: ` +
      p.interchange.map((x) => `${x.brand} ${x.number}`).join(", ") + ".";
    document.querySelector("[data-crumb]").textContent = p.mvp;

    host.innerHTML = `
      <article class="product">
        <div class="product-drawing">
          <figure class="sheet" style="margin:0">
            <div class="canvas" data-canvas></div>
            <figcaption class="titleblock">
              <div><span class="lbl">Title</span><span class="val">${esc(p.style ? p.style + " air spring" : "Air spring")}</span></div>
              <div><span class="lbl">Part no.</span><span class="val">${esc(p.mvp)}</span></div>
              <div><span class="lbl">Units</span><span class="val">in / mm</span></div>
            </figcaption>
          </figure>
          <ul class="legend" aria-label="Drawing symbols">
            <li><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M10 2a8 8 0 0 1 8 8h-8zM10 18a8 8 0 0 1-8-8h8z" fill="currentColor"/></svg>Threaded hole</li>
            <li><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="m4.5 4.5 11 11m0-11-11 11"/></svg>Air inlet</li>
            <li><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M2 10h16"/></svg>Bolt / stud</li>
            <li><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.5"/><circle cx="10" cy="10" r="5.5"/><path d="m6 6 8 8m0-8-8 8"/></svg>Combo stud</li>
          </ul>
          <p class="units-note">Dimensions on the drawing are in inches unless marked mm (11,25 = 11.25 in).</p>
          <div class="actions">
            <a class="btn btn-line" data-open-drawing hidden target="_blank" rel="noopener">Open full-size drawing</a>
            <button class="btn btn-line" type="button" data-print>Print spec sheet</button>
          </div>
        </div>

        <div class="product-info">
          <p class="eyebrow">${esc(p.oem ? `Air spring · ${p.oem}` : "Air spring")}</p>
          <h1><span class="mono">${esc(p.mvp)}</span></h1>
          ${p.sample ? '<p class="notice"><strong>Sample entry.</strong> This row in the product file is a placeholder — replace it with real product data.</p>' : ""}
          ${p.description && !p.sample ? `<p class="desc">${esc(p.description)}</p>` : ""}

          <table class="spec">
            <caption>Interchange</caption>
            <thead><tr><th scope="col">Brand</th><th scope="col">Part number</th></tr></thead>
            <tbody>${interchangeRows(p)}</tbody>
          </table>

          ${dimensionRows(p) ? `<table class="spec">
            <caption>Dimensions</caption>
            <tbody>${dimensionRows(p)}</tbody>
          </table>` : ""}

          ${detailRows(p) ? `<table class="spec">
            <caption>Details</caption>
            <tbody>${detailRows(p)}</tbody>
          </table>` : ""}

          <div class="cta-box">
            <h2>Want to stock ${esc(p.mvp)}?</h2>
            <p>Distributors can apply online. We’ll reply with terms and availability from Elk Grove Village.</p>
            <a class="btn btn-red" href="distributors.html?part=${encodeURIComponent(p.mvp)}">Become a distributor</a>
          </div>
        </div>
      </article>`;

    const canvas = host.querySelector("[data-canvas]");
    UI.mountDrawing(canvas, p, `Technical drawing of MVP air spring ${p.mvp} with dimensions`);
    // Once the drawing loads, offer it full size.
    new MutationObserver(() => {
      const img = canvas.querySelector("img");
      const link = host.querySelector("[data-open-drawing]");
      if (img && link) { link.href = img.src; link.hidden = false; }
    }).observe(canvas, { childList: true });
    host.querySelector("[data-print]").addEventListener("click", () => window.print());
  }

  function notFound(host, part) {
    document.title = "Part not found — MVP Air Springs";
    host.innerHTML = `<div style="padding:48px 0 96px;max-width:40em">
      <h1 style="font-size:2.6rem">Part not found</h1>
      <p>We couldn’t find ${part ? `<strong class="mono">${esc(part)}</strong>` : "that part"} in the catalog.</p>
      <p><a class="btn btn-red" href="products.html${part ? "?q=" + encodeURIComponent(part) : ""}">Search the catalog</a></p>
    </div>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const host = document.querySelector("[data-product]");
    const part = new URLSearchParams(location.search).get("part") || "";
    D.loadProducts().then((products) => {
      const p = products.find((x) => x.mvpNorm === D.normalize(part));
      if (p) render(host, p); else notFound(host, part);
    }).catch((err) => { host.innerHTML = UI.dataError(err); });
  });
})();
