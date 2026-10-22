// Cross-reference search box: live results as you type, Enter opens an exact match.
(function () {
  "use strict";
  const D = window.MVP_DATA;
  const UI = window.MVP_UI;
  const MAX_RESULTS = 8;

  function resultHtml(r) {
    const esc = UI.escapeHtml;
    const m = r.match;
    const from = m.brand === "MVP"
      ? `<span class="from"><small>MVP number</small>${esc(m.number)}</span>`
      : `<span class="from"><small>${esc(m.brand)}</small>${esc(m.number)}</span>`;
    return `<li><a href="${D.productUrl(r.product.mvp)}">
      ${from}
      <svg class="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>
      <span class="to"><span class="visually-hidden">matches MVP </span>${esc(r.product.mvp)}</span>
      ${r.product.sample ? '<span class="sample-flag">Sample data</span>' : ""}
    </a></li>`;
  }

  function setup(form) {
    const input = form.querySelector("input[type=search]");
    const status = form.querySelector(".xref-status");
    const list = form.querySelector(".xref-results");
    let products = null;
    let timer = 0;

    const ready = D.loadProducts().then((p) => (products = p)).catch((err) => {
      status.innerHTML = UI.dataError(err);
    });

    function run() {
      if (!products) return [];
      const q = input.value.trim();
      if (D.normalize(q).length < 2) {
        list.innerHTML = "";
        status.textContent = "";
        return [];
      }
      const results = D.search(products, q);
      list.innerHTML = results.slice(0, MAX_RESULTS).map(resultHtml).join("");
      if (!results.length) {
        status.innerHTML = `No MVP part found for <strong class="mono">${UI.escapeHtml(q)}</strong>. Check the number, try the last few digits, or <a href="distributors.html?part=${encodeURIComponent(q)}">ask us about it</a>.`;
      } else {
        const more = results.length > MAX_RESULTS ? ` Showing the first ${MAX_RESULTS}.` : "";
        status.textContent = `${results.length} matching MVP part${results.length === 1 ? "" : "s"}.${more}`;
      }
      return results;
    }

    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(run, 120);
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      ready.then(() => {
        const results = run();
        if (results.length && results[0].rank === 0) location.href = D.productUrl(results[0].product.mvp);
        else if (results.length) list.querySelector("a").focus();
      });
    });

    // Pre-fill from ?q= so searches can be linked and shared.
    const q = new URLSearchParams(location.search).get("q");
    if (q) { input.value = q; ready.then(run); }
  }

  document.addEventListener("DOMContentLoaded", () => document.querySelectorAll("form[data-xref]").forEach(setup));
})();
