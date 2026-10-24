// Home page supply-line map: Bursa → USA, Canada, Mexico → Elk Grove Village → across the USA.
// Loops on its own while it is on screen; the step buttons jump to any stage.
(function () {
  "use strict";
  // How long each stage stays before the next one; after stage 4 it zooms back out to 1.
  const STEP_MS = { 1: 1300, 2: 3300, 3: 3200, 4: 4500 };

  document.addEventListener("DOMContentLoaded", () => {
    const fig = document.querySelector("[data-route-map]");
    if (!fig) return;
    const holder = fig.querySelector(".map-holder");
    const buttons = [...fig.querySelectorAll("[data-step]")];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cam = null;
    let stage = 0;
    let timer = 0;
    let visible = false;

    function show(n, instant) {
      stage = n;
      fig.classList.toggle("instant", !!instant || reduce);
      for (let i = 1; i <= 4; i++) fig.classList.toggle("s" + i, i <= n);
      if (cam) cam.style.transform = n >= 3 ? cam.dataset.zoom : "none";
      buttons.forEach((b) => (+b.dataset.step === n ? b.setAttribute("aria-current", "step") : b.removeAttribute("aria-current")));
      if (instant) requestAnimationFrame(() => requestAnimationFrame(() => fig.classList.toggle("instant", reduce)));
    }

    function schedule() {
      clearTimeout(timer);
      if (reduce || !visible || !cam) return;
      timer = setTimeout(() => {
        show(stage >= 4 ? 1 : stage + 1);
        schedule();
      }, STEP_MS[stage] || 0); // stage 0: start right away
    }

    buttons.forEach((b) => b.addEventListener("click", () => { show(+b.dataset.step); schedule(); }));

    fetch(holder.dataset.mapSrc)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then((svg) => {
        holder.innerHTML = svg;
        cam = holder.querySelector(".cam");
        if (reduce) { show(2, true); return; }
        show(0, true);
        // Run only while the map is on screen; pick up where it left off.
        if (!("IntersectionObserver" in window)) { visible = true; return schedule(); }
        new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          if (visible) schedule(); else clearTimeout(timer);
        }, { threshold: 0.15 }).observe(fig);
      })
      .catch((err) => { console.error(err); holder.hidden = true; });
  });
})();
