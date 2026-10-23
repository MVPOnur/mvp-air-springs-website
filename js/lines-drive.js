// Product lines: the road slides under each drawing; when a stone passes under
// a wheel the axle lifts, its air spring compresses and the body stays level.
// On the cab card the chassis bounces and the cab air spring keeps the cab still.
// Starts after the draw-in, runs only on screen, pauses on hover, off for reduced motion.
(function () {
  "use strict";
  const SPEED = 46;        // road speed, drawing units per second
  const BUMP = 4.5;        // how far a stone lifts a wheel
  const STONE_W = 9;       // half-width of the bump a stone makes under a wheel
  const LANE_PERIOD = 22;  // dash + gap of the lane line
  const NS = "http://www.w3.org/2000/svg";

  function setup(svg) {
    const kind = svg.dataset.drive;
    const lane = svg.querySelector(".lane");
    const stonesG = svg.querySelector(".stones");
    const axles = [...svg.querySelectorAll(".axle")].map((g) => ({
      g, x: +g.dataset.x, r: +g.dataset.r, spin: g.querySelector(".spin"), lift: 0,
    }));
    const springs = [...svg.querySelectorAll(".spring")].map((g) => ({ g, x: g.dataset.x ? +g.dataset.x : null, h: +g.dataset.h }));
    const chassis = svg.querySelector(".chassis");
    const zoomFrame = svg.querySelector(".zoom-frame");

    // stones travel left to right under a truck that faces left
    const stones = [];
    let nextGap = 60;
    function addStone(x) {
      const el = document.createElementNS(NS, "path");
      const w = 5 + Math.random() * 4, h = 3 + Math.random() * 2;
      el.setAttribute("d", `M0 0l${w * 0.25} ${-h}l${w * 0.5} ${-h * 0.3}l${w * 0.25} ${h * 1.3}z`);
      stonesG.appendChild(el);
      stones.push({ el, x, w });
    }
    // a few stones already on the road so the first bumps come quickly
    addStone(-20); addStone(150); addStone(225);

    let dist = 0;
    function step(dt) {
      const dx = SPEED * dt;
      dist += dx;
      lane.style.strokeDashoffset = String(-(dist % LANE_PERIOD));
      // move stones, recycle, add new ones at the left edge
      for (const s of stones) s.x += dx;
      while (stones.length && stones[0].x > 380) { stones[0].el.remove(); stones.shift(); }
      nextGap -= dx;
      if (nextGap <= 0) { addStone(-12); nextGap = 70 + Math.random() * 130; }
      for (const s of stones) s.el.setAttribute("transform", `translate(${s.x - s.w / 2} 146)`);

      let maxLift = 0;
      for (const a of axles) {
        let lift = 0;
        for (const s of stones) {
          const d = Math.abs(s.x - a.x);
          if (d < STONE_W) lift = Math.max(lift, BUMP * Math.cos((d / STONE_W) * Math.PI / 2));
        }
        a.lift = lift;
        maxLift = Math.max(maxLift, lift);
        a.spin.style.transform = `rotate(${(-dist / a.r) * 57.2958}deg)`;
        if (kind !== "cab") a.g.style.transform = `translateY(${-lift}px)`;
      }
      if (kind === "cab") {
        // chassis rides the bumps; the cab above it stays where it is
        const lift = maxLift * 0.55;
        chassis.style.transform = `translateY(${-lift}px)`;
        for (const sp of springs) {
          const ratio = sp.h > 10 ? 3 : 1; // the magnified spring shows the same squeeze, larger
          sp.g.style.transform = `scaleY(${Math.max(0.45, 1 - (lift * ratio) / sp.h)})`;
        }
        if (zoomFrame) zoomFrame.style.transform = `translateY(${-lift * 3}px)`;
      } else {
        for (const sp of springs) {
          const a = axles.find((ax) => ax.x === sp.x);
          sp.g.style.transform = `scaleY(${1 - (a ? a.lift : 0) / sp.h})`;
        }
      }
    }
    return step;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const section = document.querySelector(".line-cards");
    if (!section || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cards = [...section.querySelectorAll(".line-card")];
    const runners = cards.map((card) => {
      const svg = card.querySelector("svg[data-drive]");
      const r = { step: setup(svg), paused: false };
      card.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") r.paused = true; });
      card.addEventListener("pointerleave", () => { r.paused = false; });
      return r;
    });

    let visible = false, started = false, last = 0, raf = 0;
    function frame(t) {
      raf = requestAnimationFrame(frame);
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
      last = t;
      for (const r of runners) if (!r.paused) r.step(dt);
    }
    function sync() {
      cancelAnimationFrame(raf);
      last = 0;
      if (visible && started && !document.hidden) raf = requestAnimationFrame(frame);
    }
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      // let the draw-in finish the first time before the road starts moving
      if (visible && !started) setTimeout(() => { started = true; sync(); }, 2800);
      sync();
    }, { threshold: 0.2 }).observe(section);
    document.addEventListener("visibilitychange", sync);
  });
})();
