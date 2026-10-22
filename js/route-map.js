// Home page supply-line map: Bursa → USA, Canada, Mexico → Elk Grove Village → across the USA.
// Plays once when scrolled into view; the step buttons jump to any stage.
(function () {
  "use strict";
  const STEP_MS = { 1: 1500, 2: 3300, 3: 3200 }; // time on each stage before the next one

  document.addEventListener("DOMContentLoaded", () => {
    const fig = document.querySelector("[data-route-map]");
    if (!fig) return;
    const holder = fig.querySelector(".map-holder");
    const buttons = [...fig.querySelectorAll("[data-step]")];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cam = null;
    let timer = 0;

    function show(stage, instant) {
      fig.classList.toggle("instant", !!instant || reduce);
      for (let i = 1; i <= 4; i++) fig.classList.toggle("s" + i, i <= stage);
      if (cam) cam.style.transform = stage >= 3 ? cam.dataset.zoom : "none";
      buttons.forEach((b) => (+b.dataset.step === stage ? b.setAttribute("aria-current", "step") : b.removeAttribute("aria-current")));
      if (instant) requestAnimationFrame(() => requestAnimationFrame(() => fig.classList.toggle("instant", reduce)));
    }

    function play() {
      clearTimeout(timer);
      show(0, true);
      let stage = 0;
      const next = () => {
        stage++;
        show(stage);
        if (stage < 4) timer = setTimeout(next, STEP_MS[stage]);
      };
      timer = setTimeout(next, 120);
    }

    buttons.forEach((b) => b.addEventListener("click", () => { clearTimeout(timer); show(+b.dataset.step); }));
    fig.querySelector("[data-replay]").addEventListener("click", () => (reduce ? show(1) : play()));

    fetch(holder.dataset.mapSrc)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then((svg) => {
        holder.innerHTML = svg;
        cam = holder.querySelector(".cam");
        if (reduce) { show(2, true); return; }
        show(0, true);
        if (!("IntersectionObserver" in window)) return play();
        new IntersectionObserver((entries, obs) => {
          if (entries.some((e) => e.isIntersecting)) { obs.disconnect(); play(); }
        }, { threshold: 0.4 }).observe(fig);
      })
      .catch((err) => { console.error(err); holder.hidden = true; });
  });
})();
