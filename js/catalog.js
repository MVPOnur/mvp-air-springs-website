// Catalog page: all parts, filterable by OEM application (Hendrickson, Neway, …).
(function () {
  "use strict";
  const D = window.MVP_DATA;
  const UI = window.MVP_UI;

  document.addEventListener("DOMContentLoaded", () => {
    const list = document.querySelector("[data-catalog]");
    const filters = document.querySelector("[data-filters]");
    const count = document.querySelector("[data-count]");

    D.loadProducts().then((products) => {
      const apps = [...new Set(products.map((p) => p.oem).filter(Boolean))].sort();
      let active = "All";

      function render() {
        const shown = active === "All" ? products : products.filter((p) => p.oem === active);
        count.textContent = `${shown.length} part${shown.length === 1 ? "" : "s"}`;
        if (shown.length) UI.renderCatalog(list, shown);
        else list.innerHTML = '<li class="empty">No parts listed yet.</li>';
      }

      if (apps.length > 1) {
        filters.innerHTML = ["All", ...apps]
          .map((a) => `<button type="button" class="chip" aria-pressed="${a === active}">${UI.escapeHtml(a)}</button>`)
          .join("");
        filters.addEventListener("click", (e) => {
          const btn = e.target.closest(".chip");
          if (!btn) return;
          active = btn.textContent;
          filters.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === btn)));
          render();
        });
      }
      render();
    }).catch((err) => { list.outerHTML = UI.dataError(err); });
  });
})();
