// Factory footage behind the hero. It loads after the rest of the page, plays
// only while the hero is on screen, and has a pause button. Reduced motion and
// Save-Data keep the still poster; phones get the smaller file.
(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", () => {
    const video = document.querySelector("[data-hero-video]");
    const toggle = document.querySelector("[data-hero-video-toggle]");
    if (!video) return;
    const saveData = navigator.connection && navigator.connection.saveData;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || saveData) return;

    const size = matchMedia("(max-width: 700px)").matches ? "480" : "720";
    let paused = false, visible = false, loaded = false;

    function load() {
      if (loaded) return;
      loaded = true;
      for (const [ext, type] of [["webm", "video/webm"], ["mp4", "video/mp4"]]) {
        const source = document.createElement("source");
        source.src = `assets/video/factory-${size}.${ext}`;
        source.type = type;
        video.appendChild(source);
      }
      video.load();
    }

    function sync() {
      if (visible && !paused && !document.hidden) {
        load();
        // If the browser blocks autoplay (e.g. low power mode), the poster stays.
        video.play().then(() => { toggle.hidden = false; }).catch(() => {});
      } else {
        video.pause();
      }
    }

    toggle.addEventListener("click", () => {
      paused = !paused;
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.setAttribute("aria-label", paused ? "Play background video" : "Pause background video");
      sync();
    });
    window.addEventListener("load", () => {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(video.parentElement);
    });
    document.addEventListener("visibilitychange", sync);
  });
})();
