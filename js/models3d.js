// 3D air spring models. Each one is built from photos of the real part:
//  - `rubber`, `piston`: side profile as [radius, height] pairs, top to bottom,
//    traced from a straight side photo (and, for 23-8050, sized to the
//    catalog drawing: top plate Ø 11.25", piston Ø 11.49").
//  - textures in assets/3d/<part>-top|bottom|side.webp: the top and bottom
//    photos, and the front and back side photos unwrapped around the body.
// Units are free per model; the viewer scales every model to fit.

const BLUE = 0x2f7fd0;

export const MODELS = {
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
