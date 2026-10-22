// 3D air spring in the home page hero (MVP 23-8468).
// The body is a lathe built from the silhouette of a side photo; the top and
// bottom faces use the real product photos. Units: body radius = 1.
import * as THREE from "three";
import { OrbitControls } from "./vendor/three/OrbitControls.js";
import { RoomEnvironment } from "./vendor/three/RoomEnvironment.js";

const PART = "23-8468";

// Side profile [radius, height], top to bottom, measured from photo _NJT2352.
const RUBBER_PROFILE = [
  [0.86, -0.09], [0.9, -0.16], [0.95, -0.3], [0.99, -0.45], [1.0, -0.6],
  [1.0, -2.6], [0.995, -2.7], [0.97, -2.76],
];
const PISTON_PROFILE = [
  [0.97, -2.74], [1.02, -2.8], [1.02, -2.86], [0.97, -2.9], [0.95, -2.92],
];
const PLATE_TOP = 0;
const PLATE_R = 0.91;
const BOTTOM_Y = -2.92;
const BOTTOM_R = 0.95;
// Turn the logo side towards the opening camera; the top label is turned back
// by the same amount so it reads upright in the Top view.
const SPIN = Math.PI + Math.atan2(5.3, 6.3) + 0.3;

// Fittings on the top plate, as fractions of the plate radius (from the top photo).
const TOP_FITTINGS = [
  { x: 0.17, z: -0.62, r: 0.075, h: 0.14, color: 0x2f7fd0 }, // 1/4" NPT air inlet, blue cap
  { x: -0.01, z: -0.05, r: 0.06, h: 0.11, color: 0x2f7fd0 }, // stud, blue cap
];

// Profiles are listed top to bottom; LatheGeometry needs them bottom to top
// so the faces point outwards.
function lathe(points, segments = 96) {
  const pts = points.map(([r, y]) => new THREE.Vector2(r, y)).reverse();
  const geo = new THREE.LatheGeometry(pts, segments);
  geo.computeVertexNormals();
  return geo;
}

/** Lathe whose texture v runs by height (top = 1), so a photo strip maps without stretching. */
function latheByHeight(points, segments = 96) {
  const geo = lathe(points, segments);
  const ys = points.map((p) => p[1]);
  const top = Math.max(...ys), bottom = Math.min(...ys);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, (pos.getY(i) - bottom) / (top - bottom));
  return geo;
}

export function mountViewer(host) {
  const canvas = host.querySelector("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fb2ff, 1.4); // cool rim light so black rubber reads on navy
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  const loader = new THREE.TextureLoader();
  const tex = (url) => {
    const t = loader.load(url, () => render());
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };

  // Rubber wears the unwrapped side photos: MVP logo, "23-8468", "AIR SPRINGS".
  const rubber = new THREE.MeshStandardMaterial({ map: tex(`assets/3d/${PART}-side.webp`), color: new THREE.Color(1.3, 1.3, 1.3), roughness: 0.6, metalness: 0, envMapIntensity: 0.45 });
  const plastic = new THREE.MeshStandardMaterial({ color: 0x151517, roughness: 0.5, metalness: 0, envMapIntensity: 0.6 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xc9ccd2, roughness: 0.38, metalness: 0.85 });

  const spring = new THREE.Group();

  spring.add(new THREE.Mesh(latheByHeight(RUBBER_PROFILE), rubber));
  spring.add(new THREE.Mesh(lathe(PISTON_PROFILE), plastic));

  // Top bead plate: crimped steel rim plus the photographed top face.
  spring.add(new THREE.Mesh(lathe([[PLATE_R - 0.04, PLATE_TOP + 0.005], [PLATE_R, PLATE_TOP - 0.01], [PLATE_R + 0.01, -0.06], [0.86, -0.1]]), steel));
  const top = new THREE.Mesh(
    new THREE.CircleGeometry(PLATE_R - 0.03, 96),
    new THREE.MeshStandardMaterial({ map: tex(`assets/3d/${PART}-top.webp`), roughness: 0.7, metalness: 0.1, envMapIntensity: 0.45 }),
  );
  top.rotation.x = -Math.PI / 2;
  top.position.y = PLATE_TOP + 0.006;
  const topFace = new THREE.Group();
  topFace.rotation.y = -SPIN;
  topFace.add(top);
  spring.add(topFace);

  for (const f of TOP_FITTINGS) {
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(f.r, f.r, f.h, 32),
      new THREE.MeshStandardMaterial({ color: f.color, roughness: 0.4 }),
    );
    cap.position.set(f.x * PLATE_R, PLATE_TOP + f.h / 2, f.z * PLATE_R);
    topFace.add(cap);
  }

  // Bottom: photographed piston face plus the centre stud.
  const bottom = new THREE.Mesh(
    new THREE.CircleGeometry(BOTTOM_R, 96),
    new THREE.MeshStandardMaterial({ map: tex(`assets/3d/${PART}-bottom.webp`), roughness: 0.55 }),
  );
  bottom.rotation.x = Math.PI / 2;
  bottom.position.y = BOTTOM_Y - 0.001;
  spring.add(bottom);
  const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.32, 24), steel);
  stud.position.y = BOTTOM_Y - 0.16;
  spring.add(stud);

  spring.position.y = 1.5; // centre the spring on the origin
  spring.rotation.y = SPIN;
  scene.add(spring);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const VIEWS = {
    side: new THREE.Vector3(5.3, 2.3, 6.3),
    top: new THREE.Vector3(0.01, 7.4, 0.35),
    bottom: new THREE.Vector3(0.01, -7.4, 0.35),
  };
  camera.position.copy(VIEWS.side);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false; // keep page scrolling free
  controls.enablePan = false;
  controls.enableDamping = !reduce;
  controls.autoRotate = !reduce;
  controls.autoRotateSpeed = 1.6;
  controls.minPolarAngle = 0.02;
  controls.maxPolarAngle = Math.PI - 0.02;

  // Turn auto-rotation off for good once the visitor takes over.
  controls.addEventListener("start", () => { controls.autoRotate = false; flyTo = null; });

  let flyTo = null;
  function setView(name) {
    controls.autoRotate = false;
    flyTo = { from: camera.position.clone(), to: VIEWS[name].clone(), t: reduce ? 1 : 0 };
    host.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === name)));
    loop();
  }
  host.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  }
  new ResizeObserver(resize).observe(canvas);

  function render() { renderer.render(scene, camera); }

  // Only animate while the viewer is on screen.
  let visible = true;
  let raf = 0;
  function loop() {
    cancelAnimationFrame(raf);
    if (!visible) return;
    raf = requestAnimationFrame(loop);
    if (flyTo) {
      flyTo.t = Math.min(1, flyTo.t + 0.035);
      const k = 1 - Math.pow(1 - flyTo.t, 3);
      // Move along the sphere, not straight through the spring.
      const a = new THREE.Spherical().setFromVector3(flyTo.from);
      const b = new THREE.Spherical().setFromVector3(flyTo.to);
      let dTheta = b.theta - a.theta;
      if (dTheta > Math.PI) dTheta -= 2 * Math.PI;
      if (dTheta < -Math.PI) dTheta += 2 * Math.PI;
      camera.position.setFromSpherical(new THREE.Spherical(
        a.radius + (b.radius - a.radius) * k,
        a.phi + (b.phi - a.phi) * k,
        a.theta + dTheta * k,
      ));
      if (flyTo.t >= 1) flyTo = null;
    }
    controls.update();
    render();
    if (!controls.autoRotate && !flyTo && reduce) cancelAnimationFrame(raf);
  }
  controls.addEventListener("change", () => { if (reduce) render(); });

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) loop(); else cancelAnimationFrame(raf);
  }).observe(host);

  resize();
  loop();
  host.classList.add("ready");
}
