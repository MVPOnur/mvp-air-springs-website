// Product lines rig: the road slides under the tractor-trailer and potholes come
// along. A wheel that drops into one pulls its air spring longer while the body
// above stays level. When the steer wheel drops, the chassis dips and the cab
// air spring keeps the cab still. The pick cards light up a product line on the rig.
// Driving starts as the drawing finishes, runs only while it is on screen (also
// under the pointer), and is off for reduced motion (picking still works).
(function () {
  "use strict";
  const SPEED = 52;         // road speed, drawing units per second
  const DEPTH = 5;          // pothole depth
  const GROUND = 146;
  const ROAD_END = 720;
  const LANE_PERIOD = 22;   // dash + gap of the lane line
  const STEER_TO_CHASSIS = 0.6; // share of a steer-wheel drop the chassis follows

  function setupDrive(svg) {
    const road = svg.querySelector(".road");
    const pitsPath = svg.querySelector(".pits");
    const lane = svg.querySelector(".lane");
    const chassis = svg.querySelector(".chassis");
    const wheelOf = (g) => ({ g, x: +g.dataset.x, r: +g.dataset.r, spin: g.querySelector(".spin"), drop: 0 });
    const steer = wheelOf(svg.querySelector(".steer"));
    const axles = [...svg.querySelectorAll(".axle")].map(wheelOf);
    const springs = [...svg.querySelectorAll(".spring")].map((g) => ({
      g, group: g.dataset.group, x: g.dataset.x ? +g.dataset.x : null, h: +g.dataset.h,
    }));

    // potholes move left to right under a rig that faces left
    let pits = [{ x: 150, w: 22 }, { x: 470, w: 26 }, { x: -40, w: 20 }];
    let nextGap = 120;
    let dist = 0;

    function dropAt(x) {
      let d = 0;
      for (const p of pits) {
        const t = 1 - Math.abs(p.x - x) / (p.w / 2);
        if (t > 0) d = Math.max(d, DEPTH * Math.min(1, t * 1.8)); // flat-bottomed dip
      }
      return d;
    }

    return function step(dt) {
      const dx = SPEED * dt;
      dist += dx;
      lane.style.strokeDashoffset = String(-(dist % LANE_PERIOD));
      for (const p of pits) p.x += dx;
      pits = pits.filter((p) => p.x - p.w < ROAD_END + 10);
      nextGap -= dx;
      if (nextGap <= 0) { pits.push({ x: -30, w: 18 + Math.random() * 10 }); nextGap = 150 + Math.random() * 170; }

      // road line with the dips cut into it, and the dips filled
      const sorted = [...pits].sort((a, b) => a.x - b.x);
      let d = `M0 ${GROUND}`, fill = "";
      for (const p of sorted) {
        const l = p.x - p.w / 2;
        if (l < 0 || l + p.w > ROAD_END) continue;
        d += `H${l.toFixed(1)}l3 ${DEPTH}h${(p.w - 6).toFixed(1)}l3 ${-DEPTH}`;
        fill += `M${l.toFixed(1)} ${GROUND}l3 ${DEPTH}h${(p.w - 6).toFixed(1)}l3 ${-DEPTH}z`;
      }
      road.setAttribute("d", d + `H${ROAD_END}`);
      pitsPath.setAttribute("d", fill);

      // steer wheel: the chassis follows part of its drop, the wheel the rest
      steer.drop = dropAt(steer.x);
      const chassisDrop = steer.drop * STEER_TO_CHASSIS;
      chassis.style.transform = `translateY(${chassisDrop}px)`;
      steer.g.style.transform = `translateY(${steer.drop - chassisDrop}px)`;
      steer.spin.style.transform = `rotate(${(-dist / steer.r) * 57.2958}deg)`;

      for (const a of axles) {
        a.drop = dropAt(a.x);
        a.g.style.transform = `translateY(${a.drop}px)`;
        a.spin.style.transform = `rotate(${(-dist / a.r) * 57.2958}deg)`;
      }

      for (const sp of springs) {
        if (sp.group === "cab") {
          // cab floor stays put, the frame under it drops: the spring stretches
          sp.g.style.transform = `scaleY(${1 + chassisDrop / sp.h})`;
        } else {
          const a = axles.find((ax) => ax.x === sp.x);
          const top = sp.group === "truck" ? chassisDrop : 0; // truck springs hang from the tractor frame
          sp.g.style.transform = `translateY(${top}px) scaleY(${1 + ((a ? a.drop : 0) - top) / sp.h})`;
        }
      }
    };
  }

  function setupPicks(svg, stage) {
    const picks = [...document.querySelectorAll("button[data-pick]")];
    let locked = null;
    const show = (group) => (group ? svg.setAttribute("data-show", group) : svg.removeAttribute("data-show"));
    // bring the picked springs into view when the drawing is scrolled (phones)
    function reveal(group) {
      if (stage.scrollWidth <= stage.clientWidth) return;
      const target = svg.querySelector(`.callout[data-group="${group}"] .dot`);
      if (!target) return;
      const box = target.getBoundingClientRect(), sbox = stage.getBoundingClientRect();
      stage.scrollBy({ left: box.left - sbox.left - stage.clientWidth / 2, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
    for (const b of picks) {
      const g = b.dataset.pick;
      b.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") show(g); });
      b.addEventListener("pointerleave", () => show(locked));
      b.addEventListener("focus", () => show(g));
      b.addEventListener("blur", () => show(locked));
      b.addEventListener("click", () => {
        locked = locked === g ? null : g;
        picks.forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.pick === locked)));
        show(locked || g);
        if (locked) reveal(g);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const rig = document.querySelector(".rig");
    const svg = rig && rig.querySelector("svg[data-rig]");
    if (!svg) return;
    const stage = rig.querySelector("[data-rig-stage]");
    setupPicks(svg, stage);
    // phones: start with the tractor and front of the trailer in view
    if (stage.scrollWidth > stage.clientWidth) stage.scrollLeft = 0;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const step = setupDrive(svg);
    let visible = false, started = false, last = 0, raf = 0;
    function frame(t) {
      raf = requestAnimationFrame(frame);
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
      last = t;
      step(dt);
    }
    function sync() {
      cancelAnimationFrame(raf);
      last = 0;
      if (visible && started && !document.hidden) raf = requestAnimationFrame(frame);
    }
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      // the road starts moving as the draw-in (1.2 s) finishes
      if (visible && !started) setTimeout(() => { started = true; sync(); }, 1000);
      sync();
    }, { threshold: 0.35 }).observe(rig); // same as the draw-in reveal
    document.addEventListener("visibilitychange", sync);
  });
})();
