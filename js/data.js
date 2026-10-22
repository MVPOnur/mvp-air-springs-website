// Product data: loads the CSV, turns rows into products, and runs the
// cross-reference search. No dependencies.
(function () {
  "use strict";
  const cfg = window.MVP_CONFIG;

  // Brands searched by the cross-reference. `column` is the CSV header.
  const BRANDS = [
    { key: "firestone", label: "Firestone", column: "firestone" },
    { key: "goodyear", label: "Goodyear", column: "goodyear" },
    { key: "contitech", label: "ContiTech", column: "contitech" },
    { key: "oe", label: "OE", column: "oe_numbers" },
  ];

  // Dimension columns, in inches in the CSV.
  const DIMENSIONS = [
    { column: "compressed_height_in", label: "Compressed height" },
    { column: "extended_height_in", label: "Extended height" },
    { column: "design_height_in", label: "Design height" },
    { column: "max_diameter_in", label: "Max. diameter" },
  ];

  const DETAILS = [
    { column: "oem", label: "OEM application" },
    { column: "application", label: "Application" },
    { column: "style", label: "Style" },
    { column: "upper_mount", label: "Upper mount" },
    { column: "lower_mount", label: "Lower mount" },
    { column: "air_inlet", label: "Air inlet" },
  ];

  /** Minimal RFC 4180 CSV parser: quoted fields, "" escapes, CRLF. */
  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
        } else field += c;
      } else if (c === '"') quoted = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    const header = (rows.shift() || []).map((h) => h.trim().toLowerCase().replace(/^﻿/, ""));
    return rows
      .filter((r) => r.some((v) => v.trim() !== ""))
      .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] || "").trim()])));
  }

  /** Uppercase, letters and digits only: "w01 358-9781" → "W013589781". */
  function normalize(value) {
    return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  /** MVP number rule: "23-" + last 4 digits of the Firestone number. */
  function mvpFromFirestone(firestone) {
    const digits = String(firestone || "").replace(/\D/g, "");
    return digits.length >= 4 ? "23-" + digits.slice(-4) : "";
  }

  /** A cell may hold several numbers separated by | or ; */
  function splitNumbers(cell) {
    return String(cell || "").split(/[|;]/).map((s) => s.trim()).filter(Boolean);
  }

  /** "1R12-095 (Plastic)" → { number: "1R12-095", note: "Plastic" } */
  function splitNote(entry) {
    const m = entry.match(/^(.*?)\s*\(([^)]*)\)$/);
    return m ? { number: m[1], note: m[2] } : { number: entry, note: "" };
  }

  function toProduct(row) {
    const firestone = splitNumbers(row.firestone).map((e) => splitNote(e).number);
    const derived = firestone.map(mvpFromFirestone);
    const mvp = row.mvp_part || derived[0] || "";
    if (row.mvp_part && derived.length && !derived.includes(row.mvp_part)) {
      console.warn(`MVP number ${row.mvp_part} does not match its Firestone number ${row.firestone}.`);
    }
    const interchange = [];
    for (const b of BRANDS) {
      for (const entry of splitNumbers(row[b.column])) {
        const { number, note } = splitNote(entry);
        interchange.push({ brand: b.label, number, note, norm: normalize(number) });
      }
    }
    return {
      mvp,
      mvpNorm: normalize(mvp),
      description: row.description || "",
      interchange,
      dimensions: DIMENSIONS.map((d) => ({ label: d.label, inches: parseFloat(row[d.column]) })),
      details: DETAILS.map((d) => ({ label: d.label, value: row[d.column] || "" })),
      application: row.application || "",
      oem: row.oem || "",
      oemNorm: normalize(row.oem),
      style: row.style || "",
      drawing: row.drawing || "",
      sample: /^(yes|true|1)$/i.test(row.sample || ""),
    };
  }

  let cache = null;
  function loadProducts() {
    if (!cache) {
      cache = fetch(cfg.productsCsv, { cache: "no-cache" })
        .then((r) => {
          if (!r.ok) throw new Error(`Could not load ${cfg.productsCsv} (${r.status})`);
          return r.text();
        })
        .then((text) => parseCsv(text).map(toProduct).filter((p) => p.mvp))
        .then((list) => list.sort((a, b) => a.mvp.localeCompare(b.mvp, "en", { numeric: true })));
    }
    return cache;
  }

  /**
   * Cross-reference search. Returns [{ product, match: {brand, number}, rank }]
   * rank 0 = exact number, 1 = starts with, 2 = contains.
   * Only numbers listed in the CSV match: guessing from the last 4 digits could
   * point a distributor at the wrong part.
   */
  function search(products, query) {
    const q = normalize(query);
    if (q.length < 2) return [];
    const results = [];
    for (const p of products) {
      const candidates = [{ brand: "MVP", number: p.mvp, norm: p.mvpNorm }, ...p.interchange];
      if (p.oem) candidates.push({ brand: "OEM application", number: p.oem, norm: p.oemNorm });
      let best = null;
      for (const c of candidates) {
        let rank = -1;
        if (c.norm === q) rank = 0;
        else if (c.norm.startsWith(q)) rank = 1;
        else if (q.length >= 3 && c.norm.includes(q)) rank = 2;
        if (rank >= 0 && (!best || rank < best.rank)) best = { rank, match: c };
      }
      if (best) results.push({ product: p, match: best.match, rank: best.rank });
    }
    return results.sort((a, b) => a.rank - b.rank || a.product.mvp.localeCompare(b.product.mvp, "en", { numeric: true }));
  }

  function formatInches(inches) {
    if (!isFinite(inches)) return null;
    const mm = Math.round(inches * 25.4);
    return { inches: `${+inches.toFixed(2)} in`, mm: `${mm} mm` };
  }

  function productUrl(mvp) {
    return `product.html?part=${encodeURIComponent(mvp)}`;
  }

  /** Candidate drawing URLs for a product, in the order to try them. */
  function drawingUrls(p) {
    if (p.drawing) return [cfg.drawingsDir + p.drawing];
    return cfg.drawingExtensions.map((ext) => `${cfg.drawingsDir}${p.mvp}.${ext}`);
  }

  window.MVP_DATA = { BRANDS, loadProducts, search, normalize, mvpFromFirestone, formatInches, productUrl, drawingUrls, parseCsv };
})();
