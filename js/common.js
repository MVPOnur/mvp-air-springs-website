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

  /** Count a figure such as "500,000" up from zero once (skipped for reduced motion). */
  function countUp(el) {
    const target = parseInt(el.textContent.replace(/[^\d]/g, ""), 10);
    if (!target || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const final = el.textContent;
    const t0 = performance.now(), MS = 1600;
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / MS), eased = 1 - Math.pow(1 - k, 3);
      el.textContent = k < 1 ? Math.round(target * eased).toLocaleString("en-US") : final;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /** Pick parts round-robin across OEMs so a short showcase shows the range. */
  function mixByOem(products, n) {
    const groups = new Map();
    for (const p of products) {
      const k = p.oem || "";
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(p);
    }
    const lists = [...groups.values()].sort((a, b) => b.length - a.length);
    const out = [];
    for (let i = 0; out.length < n && lists.some((l) => i < l.length); i++) {
      for (const l of lists) if (i < l.length && out.length < n) out.push(l[i]);
    }
    return out;
  }

  /**
   * Sideways showcase that drifts slowly on its own and loops without a seam
   * (the list is rendered twice). It stops while the pointer is over it, while
   * something in it has focus, while it is being touched or scrolled, when the
   * pause button is pressed, and when it is off screen. Reduced motion: no drift.
   */
  function setupRail(rail, count) {
    if (!rail) return;
    const track = rail.querySelector(".catalog-rail");
    const prev = rail.querySelector("[data-rail-prev]");
    const next = rail.querySelector("[data-rail-next]");
    const toggle = rail.querySelector("[data-rail-toggle]");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SPEED = 30; // px per second
    const looped = !reduce && track.children.length >= count * 2;
    const holds = new Set();          // reasons the drift is stopped
    const timers = {};
    let pos = 0, last = 0, writing = false;

    const setLength = () => (looped ? track.children[count].offsetLeft - track.children[0].offsetLeft : 0);
    const hold = (why, ms) => {
      holds.add(why);
      clearTimeout(timers[why]);
      if (ms) timers[why] = setTimeout(() => holds.delete(why), ms);
    };
    const release = (why, ms = 0) => {
      clearTimeout(timers[why]);
      if (ms) timers[why] = setTimeout(() => holds.delete(why), ms); else holds.delete(why);
    };

    function frame(t) {
      requestAnimationFrame(frame);
      const dt = last ? Math.min((t - last) / 1000, 0.1) : 0;
      last = t;
      if (!looped || holds.size) return;
      const len = setLength();
      pos += SPEED * dt;
      if (len && pos >= len) pos -= len;
      writing = true;
      track.scrollLeft = pos;
    }

    function updateArrows() {
      if (looped) return; // a loop has no ends
      const max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    }

    // Move by the cards that fit on screen.
    function page(dir) {
      const first = track.children[0];
      if (!first) return;
      hold("nav", 4000);
      const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
      const cols = Math.max(1, Math.round((track.clientWidth + step - first.getBoundingClientRect().width) / step));
      let from = track.scrollLeft;
      const len = setLength();
      if (looped && dir < 0 && from < cols * step) { from += len; track.scrollLeft = from; }
      if (looped && dir > 0 && from + cols * step > len * 1.5) { from -= len; track.scrollLeft = from; }
      track.scrollTo({ left: from + dir * cols * step, behavior: reduce ? "auto" : "smooth" });
    }

    track.addEventListener("scroll", () => {
      if (writing) { writing = false; return; }
      pos = track.scrollLeft; // someone else moved it: arrows, swipe, wheel
      updateArrows();
    }, { passive: true });
    track.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") hold("hover"); });
    track.addEventListener("pointerleave", () => release("hover"));
    track.addEventListener("touchstart", () => hold("touch"), { passive: true });
    track.addEventListener("touchend", () => release("touch", 3000), { passive: true });
    track.addEventListener("wheel", () => hold("wheel", 2500), { passive: true });
    // Keyboard users tabbing through the cards get a still row; clicks on the
    // buttons below must not leave it stopped.
    track.addEventListener("focusin", (e) => { if (e.target.matches(":focus-visible")) hold("focus"); });
    track.addEventListener("focusout", () => release("focus"));
    prev.addEventListener("click", () => page(-1));
    next.addEventListener("click", () => page(1));

    if (looped) {
      track.classList.add("drifting");
      toggle.hidden = false;
      toggle.addEventListener("click", () => {
        const paused = toggle.getAttribute("aria-pressed") !== "true";
        toggle.setAttribute("aria-pressed", String(paused));
        toggle.setAttribute("aria-label", paused ? "Play the showcase" : "Pause the showcase");
        if (paused) hold("user"); else release("user");
      });
      new IntersectionObserver(([e]) => (e.isIntersecting ? release("offscreen") : hold("offscreen"))).observe(track);
      document.addEventListener("visibilitychange", () => (document.hidden ? hold("hidden") : release("hidden")));
      requestAnimationFrame(frame);
    }
    new ResizeObserver(updateArrows).observe(track);
    updateArrows();
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

    // Sections that animate once when they scroll into view.
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      if (!("IntersectionObserver" in window)) return;
      el.classList.add("armed");
      new IntersectionObserver(([e], obs) => {
        if (e.isIntersecting) { el.classList.add("in"); obs.disconnect(); el.querySelectorAll("[data-countup]").forEach(countUp); }
      }, { threshold: 0.35 }).observe(el);
    });

    const counts = document.querySelectorAll("[data-product-count]");
    const featured = document.querySelector("[data-catalog][data-limit]");
    if (counts.length || featured) {
      D.loadProducts().then((products) => {
        counts.forEach((el) => (el.textContent = products.length));
        if (featured) {
          const picks = mixByOem(products, +featured.dataset.limit);
          const drift = !matchMedia("(prefers-reduced-motion: reduce)").matches;
          // A drifting showcase loops over a second copy, hidden from screen readers and Tab.
          renderCatalog(featured, drift ? picks.concat(picks) : picks);
          [...featured.children].slice(picks.length).forEach((li) => {
            li.setAttribute("aria-hidden", "true");
            li.querySelectorAll("a").forEach((a) => (a.tabIndex = -1));
          });
          setupRail(featured.closest("[data-rail]"), picks.length);
        }
      }).catch((err) => { if (featured) featured.outerHTML = dataError(err); });
    }
  });

  window.MVP_UI = { escapeHtml, mountDrawing, renderCatalog, dataError, fill };
})();
