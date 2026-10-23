// 3D air spring models. Each one is built from photos of the real part:
//  - `rubber`, `piston`: side profile as [radius, height] pairs, top to bottom,
//    traced from a straight side photo (and, for 23-8050, sized to the
//    catalog drawing: top plate Ø 11.25", piston Ø 11.49").
//  - textures in assets/3d/<part>-top|bottom|side.webp: the top and bottom
//    photos, and the front and back side photos unwrapped around the body.
// Units are free per model; the viewer scales every model to fit.

const BLUE = 0x2f7fd0;

export const MODELS = {
  "23-8468": {
    part: "23-8468",
    // Profile measured row by row from the side photo (body radius = 1).
    plate: { r: 0.925, faceR: 0.88, rim: [[0.87, 0.0], [0.92, -0.03], [0.925, -0.19], [0.89, -0.255]] },
    rubber: [
      [0.89, -0.253], [0.89, -0.295], [0.921, -0.337], [0.948, -0.379], [0.968, -0.421], [0.985, -0.463],
      [0.997, -0.506], [1.003, -0.548], [1.011, -0.59], [1.006, -0.632], [1.003, -0.744], [1.0, -0.913],
      [0.997, -1.081], [0.994, -1.25], [0.992, -1.419], [0.99, -1.587], [0.989, -1.756], [0.991, -1.924],
      [0.994, -2.093], [0.994, -2.261], [0.997, -2.43], [1.004, -2.486],
    ],
    piston: [[1.0, -2.47], [1.02, -2.55], [1.02, -2.8], [0.96, -2.87], [0.93, -2.9]],
    pistonMaterial: "plastic",
    bottom: { y: -2.9, r: 0.93 },
    // Positions are fractions of the plate radius, read off the top photo.
    topFittings: [
      { x: 0.17, z: -0.62, r: 0.075, h: 0.14, color: BLUE }, // 1/4" NPT air inlet
      { x: -0.01, z: -0.05, r: 0.06, h: 0.11, color: BLUE }, // stud cap
    ],
    bottomStud: { r: 0.05, h: 0.32 },
    spin: 0.3,
  },

  "23-8050": {
    part: "23-8050",
    plate: { r: 5.625, faceR: 5.45, rim: [[5.4, 0.02], [5.625, -0.08], [5.66, -0.35], [5.5, -0.55], [5.05, -0.62]] },
    rubber: [
      [5.05, -0.6], [5.09, -1.2], [5.08, -3.0], [5.05, -4.0], [4.97, -4.9], [4.98, -5.6],
      [5.1, -6.4], [5.28, -7.0], [5.3, -7.6], [5.33, -8.2], [5.5, -8.9], [5.45, -9.6],
      [5.35, -10.1], [5.1, -10.5], [4.8, -10.75],
    ],
    piston: [[5.1, -10.45], [5.55, -10.85], [5.745, -11.2], [5.745, -11.55], [5.6, -11.68]],
    pistonMaterial: "metal",
    bottom: { y: -11.68, r: 5.6 },
    topFittings: [
      { x: -0.725, z: -0.3, r: 0.25, h: 1.5, color: 0xc9ccd2, cap: { r: 0.33, h: 0.6, color: BLUE } },
      { x: 0.75, z: -0.3, r: 0.25, h: 1.5, color: 0xc9ccd2, cap: { r: 0.33, h: 0.6, color: BLUE } },
    ],
    bottomStud: null,
    spin: 0.2,
  },
};
