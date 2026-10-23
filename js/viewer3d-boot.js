// Loads the 3D viewer only when WebGL is available; otherwise the photo stays.
const host = document.querySelector("[data-viewer3d]");
const hasWebGL = (() => {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
})();
if (host && hasWebGL) {
  import("./viewer3d.js")
    .then((m) => m.mountViewer(host, host.dataset.part))
    .catch((err) => console.error("3D viewer failed to load", err));
} else if (host) {
  host.querySelectorAll(".v3d-views").forEach((el) => (el.hidden = true));
}
