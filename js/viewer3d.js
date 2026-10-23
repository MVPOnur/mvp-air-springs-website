// 3D air spring viewer (three.js). Used in the home page hero and on product
// pages that have a model in js/models3d.js.
import * as THREE from "three";
import { OrbitControls } from "./vendor/three/OrbitControls.js";
import { RoomEnvironment } from "./vendor/three/RoomEnvironment.js";
import { MODELS } from "./models3d.js";

const FOV = 30;
// Camera directions; the side view looks at the logo.
const DIRS = {
  side: new THREE.Vector3(5.3, 2.3, 6.3).normalize(),
  top: new THREE.Vector3(0.001, 1, 0.05).normalize(),
  bottom: new THREE.Vector3(0.001, -1, 0.05).normalize(),
};
const SIDE_AZIMUTH = Math.atan2(DIRS.side.x, DIRS.side.z);

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

function buildSpring(m, tex, mats) {
  // Turn the logo side towards the side camera; the top face is turned back by
  // the same amount so its label reads upright in the Top view.
  const spin = Math.PI + SIDE_AZIMUTH + m.spin;
  const spring = new THREE.Group();
  const s = m.plate.r;

  const rubber = new THREE.MeshStandardMaterial({ map: tex(`assets/3d/${m.part}-side.webp`), color: new THREE.Color(1.3, 1.3, 1.3), roughness: 0.6, envMapIntensity: 0.45 });
  spring.add(new THREE.Mesh(latheByHeight(m.rubber), rubber));
  spring.add(new THREE.Mesh(lathe(m.piston), m.pistonMaterial === "metal" ? mats.alu : mats.plastic));
  spring.add(new THREE.Mesh(lathe(m.plate.rim), mats.steel));

  const topFace = new THREE.Group();
  topFace.rotation.y = -spin;
  const top = new THREE.Mesh(
    new THREE.CircleGeometry(m.plate.faceR, 96),
    new THREE.MeshStandardMaterial({ map: tex(`assets/3d/${m.part}-top.webp`), roughness: 0.7, metalness: 0.1, envMapIntensity: 0.45 }),
  );
  top.rotation.x = -Math.PI / 2;
  top.position.y = m.plate.rim[0][1] + 0.001 * s;
  topFace.add(top);
  for (const f of m.topFittings) {
    const y0 = top.position.y;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(f.r, f.r, f.h, 32),
      new THREE.MeshStandardMaterial({ color: f.color, roughness: 0.4, metalness: f.cap ? 0.8 : 0 }),
    );
    post.position.set(f.x * m.plate.r, y0 + f.h / 2, f.z * m.plate.r);
    topFace.add(post);
    if (f.cap) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(f.cap.r, f.cap.r, f.cap.h, 32), new THREE.MeshStandardMaterial({ color: f.cap.color, roughness: 0.4 }));
      cap.position.set(post.position.x, y0 + f.h - f.cap.h / 2 + 0.05 * f.cap.h, post.position.z);
      topFace.add(cap);
    }
  }
  spring.add(topFace);

  const bottom = new THREE.Mesh(
    new THREE.CircleGeometry(m.bottom.r, 96),
    new THREE.MeshStandardMaterial({ map: tex(`assets/3d/${m.part}-bottom.webp`), roughness: 0.6, metalness: m.pistonMaterial === "metal" ? 0.25 : 0, envMapIntensity: 0.5 }),
  );
  bottom.rotation.x = Math.PI / 2;
  bottom.position.y = m.bottom.y - 0.001 * s;
  spring.add(bottom);
  if (m.bottomStud) {
    const stud = new THREE.Mesh(new THREE.CylinderGeometry(m.bottomStud.r, m.bottomStud.r, m.bottomStud.h, 24), mats.steel);
    stud.position.y = m.bottom.y - m.bottomStud.h / 2;
    spring.add(stud);
  }

  spring.rotation.y = spin;
  // Centre on the origin and scale every model to the same bounding size.
  spring.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(spring);
  const radius = box.getBoundingSphere(new THREE.Sphere()).radius;
  spring.position.sub(box.getCenter(new THREE.Vector3()));
  const holder = new THREE.Group();
  holder.add(spring);
  holder.scale.setScalar(1.6 / radius);
  return holder;
}

export function mountViewer(host, part) {
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
  const mats = {
    plastic: new THREE.MeshStandardMaterial({ color: 0x151517, roughness: 0.5, envMapIntensity: 0.6 }),
    alu: new THREE.MeshStandardMaterial({ color: 0x8f949b, roughness: 0.5, metalness: 0.6, envMapIntensity: 0.6 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xa9adb3, roughness: 0.4, metalness: 0.8, envMapIntensity: 0.7 }),
  };

  // Every model is scaled to a bounding radius of 1.6, so one distance fits all.
  const DIST = (1.6 / Math.sin(THREE.MathUtils.degToRad(FOV / 2))) * 0.8; // the bounding sphere is generous
  const views = Object.fromEntries(Object.entries(DIRS).map(([k, d]) => [k, d.clone().multiplyScalar(DIST)]));
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.copy(views.side);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false; // keep page scrolling free
  controls.enablePan = false;
  controls.enableDamping = !reduce;
  controls.autoRotate = !reduce;
  controls.autoRotateSpeed = 1.6;
  controls.minPolarAngle = 0.02;
  controls.maxPolarAngle = Math.PI - 0.02;

  let flyTo = null;
  // The visitor can turn it any time; it starts spinning again after a pause.
  const RESUME_MS = 3500;
  let resumeTimer = 0;
  function resumeLater(ms = RESUME_MS) {
    clearTimeout(resumeTimer);
    if (!reduce) resumeTimer = setTimeout(() => { controls.autoRotate = true; loop(); }, ms);
  }
  controls.addEventListener("start", () => { controls.autoRotate = false; flyTo = null; clearTimeout(resumeTimer); });
  controls.addEventListener("end", () => resumeLater());
  controls.addEventListener("change", () => { if (reduce) render(); });

  let current = null;
  function setModel(id) {
    if (!MODELS[id]) return;
    if (current) scene.remove(current);
    current = buildSpring(MODELS[id], tex, mats);
    scene.add(current);
    host.querySelectorAll("[data-model]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.model === id)));
    host.querySelectorAll("[data-model-label]").forEach((el) => (el.textContent = id));
    render();
  }

  function setView(name) {
    controls.autoRotate = false;
    flyTo = { from: camera.position.clone(), to: views[name].clone(), t: reduce ? 1 : 0 };
    host.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === name)));
    resumeLater(5000);
    loop();
  }
  host.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
  host.querySelectorAll("[data-model]").forEach((b) => b.addEventListener("click", () => setModel(b.dataset.model)));

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
    if (reduce && !flyTo) cancelAnimationFrame(raf);
  }

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) loop(); else cancelAnimationFrame(raf);
  }).observe(host);

  setModel(part);
  resize();
  loop();
  host.classList.add("ready");
  return { setModel, setView };
}
