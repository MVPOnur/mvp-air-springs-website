// Site-wide settings. Everything in square brackets is a placeholder:
// replace it with the confirmed value, or leave it and it shows as a dashed
// "to be confirmed" box on the site so nobody mistakes it for a real fact.
window.MVP_CONFIG = {
  companyName: "MVP Air Springs",

  // Contact details
  email: "[distributor email]",
  phone: "[US phone number]",
  warehouseAddress: "[Street address], Elk Grove Village, IL [ZIP]",
  factoryAddress: "[Street address], Bursa, Türkiye",

  // Where the "Become a distributor" form is sent.
  // Leave empty to open the visitor's email app with the filled-in form instead.
  // Works with any service that accepts a JSON-friendly form POST (e.g. Formspree).
  formEndpoint: "",

  // Product data and drawings, relative to the site root.
  productsCsv: "data/mvp-air-springs-products.csv",
  drawingsDir: "assets/drawings/",
  drawingExtensions: ["png", "svg", "webp", "jpg"],

  // Facts to confirm before launch. Shown as placeholders until filled in.
  facts: {
    founded: "[Year founded]",
    certifications: "[Certifications, e.g. ISO 9001 — confirm]",
    warranty: "[Warranty terms]",
    leadTime: "[Typical ship time from Elk Grove Village]",
    factoryCapacity: "[Factory capacity]",
  },
};
