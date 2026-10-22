// Shared page behaviour: menu, config placeholders, catalog cards, drawings.
(function () {
  "use strict";
  const cfg = window.MVP_CONFIG;
  const D = window.MVP_DATA;

  const isPlaceholder = (v) => !v || /\[[^\]]*\]/.test(v);

  /** Fill an element with a config value; unconfirmed values get the dashed placeholder style. */
  function fill(el, value, linkType) {
    if (isPlaceholder(value)) {
      el.textContent = value || "[To be confirmed]";
      el.classList.add("tbc");
      el.title = "To be confirmed";
      return;
    }
    el.classList.remove("tbc");
    if (linkType) {
      const a = document.createElement("a");
      a.href = linkType === "tel" ? "tel:" + value.replace(/[^\d+]/g, "") : "mailto:" + value;
      a.textContent = value;
      el.replaceChildren(a);
    } else el.textContent = value;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  const MISSING_DRAWING = `<div class="drawing-missing">
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <path d="M20 22h80v8H20zM24 30c-14 12-14 52 6 64h60c20-12 20-52 6-64M38 94l4 18h36l4-18" stroke-dasharray="4 4"/>
    </svg>Drawing to be added</div>`;

  /** Load the first drawing that exists; show a "to be added" frame if none does. */
  function mountDrawing(container, product, alt) {
    const urls = D.drawingUrls(product);
    let i = 0;
    const img = new Image();
    img.alt = alt;
    img.decoding = "async";
    img.onload = () => container.replaceChildren(img);
    img.onerror = () => {
      i++;
      if (i < urls.length) img.src = urls[i];
      else container.innerHTML = MISSING_DRAWING;
    };
    img.src = urls[0];
  }

  function firstNumber(p, brand) {
    const hit = p.interchange.find((x) => x.brand === brand);
    return hit ? hit.number : "";
  }

  function cardHtml(p) {
    const fs = firstNumber(p, "Firestone");
    const gy = firstNumber(p, "Goodyear");
    const ct = firstNumber(p, "ContiTech");
    const lines = [["FS", fs], ["GY", gy], ["CT", ct]]
      .filter(([, n]) => n)
      .map(([k, n]) => `<div><span>${k}</span>${escapeHtml(n)}</div>`)
      .join("");
    return `<li><a class="sheet part-card" href="${D.productUrl(p.mvp)}" aria-label="MVP ${escapeHtml(p.mvp)}${fs ? ", Firestone " + escapeHtml(fs) : ""}">
      <div class="thumb" data-drawing="${escapeHtml(p.mvp)}">${p.sample ? '<span class="sample-flag">Sample data</span>' : ""}</div>
      ${lines ? `<div class="xrefs">${lines}</div>` : ""}
      <div class="titleblock">
        <div><span class="lbl">MVP part no.</span><span class="val part-no">${escapeHtml(p.mvp)}</span></div>
        <div><span class="lbl">OEM</span><span class="val">${escapeHtml(p.oem || p.application || "—")}</span></div>
      </div>
    </a></li>`;
  }

  // Catalog drawings load only when their card scrolls near the screen.
  const lazyDrawings = "IntersectionObserver" in window
    ? new IntersectionObserver((entries, obs) => {
        for (const e of entries) {
          if (e.isIntersecting) { obs.unobserve(e.target); e.target._mount(); }
        }
      }, { rootMargin: "400px 0px" })
    : { observe: (el) => el._mount() };

  function renderCatalog(list, products) {
    list.innerHTML = products.map(cardHtml).join("");
    list.querySelectorAll("[data-drawing]").forEach((thumb) => {
      const p = products.find((x) => x.mvp === thumb.dataset.drawing);
      const holder = document.createElement("div");
      holder.style.cssText = "width:100%;height:100%;display:grid;place-items:center";
      thumb.appendChild(holder);
      holder._mount = () => mountDrawing(holder, p, `Technical drawing of MVP ${p.mvp}`);
      lazyDrawings.observe(holder);
    });
  }

  function dataError(err) {
    console.error(err);
    const hint = location.protocol === "file:"
      ? " Open the site through a web server (see website/README.md), not by double-clicking the file."
      : "";
    return `<div class="notice" role="alert">Product data could not be loaded.${hint}</div>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Mobile menu
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("nav");
    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const open = toggle.getAttribute("aria-expanded") !== "true";
        toggle.setAttribute("aria-expanded", String(open));
        nav.classList.toggle("open", open);
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && nav.classList.contains("open")) {
          nav.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.focus();
        }
      });
    }
    // Current page in the menu
    const page = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav a").forEach((a) => {
      if (a.getAttribute("href") === page) a.setAttribute("aria-current", "page");
    });

    document.querySelectorAll("[data-config]").forEach((el) => fill(el, cfg[el.dataset.config], el.dataset.link));
    document.querySelectorAll("[data-fact]").forEach((el) => fill(el, cfg.facts[el.dataset.fact]));
    document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

    const counts = document.querySelectorAll("[data-product-count]");
    const featured = document.querySelector("[data-catalog][data-limit]");
    if (counts.length || featured) {
      D.loadProducts().then((products) => {
        counts.forEach((el) => (el.textContent = products.length));
        if (featured) renderCatalog(featured, products.slice(0, +featured.dataset.limit));
      }).catch((err) => { if (featured) featured.outerHTML = dataError(err); });
    }
  });

  window.MVP_UI = { escapeHtml, mountDrawing, renderCatalog, dataError, fill };
})();
