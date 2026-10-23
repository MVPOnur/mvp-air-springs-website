// Site-wide settings. Everything in square brackets is a placeholder:
// replace it with the confirmed value, or leave it and it shows as a dashed
// "to be confirmed" box on the site so nobody mistakes it for a real fact.
window.MVP_CONFIG = {
  companyName: "MVP Air Springs",

  // Contact details
  email: "sales@mvptruckparts.com",
  phone: "(224) 423-8860",
  warehouseAddress: "1001 Nicholas Blvd, Elk Grove Village, IL 60007",
  factoryAddress: "Başköy Sanayi Sitesi, 355. İsimsiz Sk. No: 9/A, Nilüfer, Bursa, Türkiye",

  // Where the "Become a distributor" form is sent.
  // FormSubmit needs no account: the first application sends an "Activate form"
  // email to this address, and applications arrive once that link is clicked.
  // Leave empty to open the visitor's email app with the filled-in form instead.
  formEndpoint: "https://formsubmit.co/ajax/sales@mvptruckparts.com",

  // Product data and drawings, relative to the site root.
  productsCsv: "data/mvp-air-springs-products.csv",
  drawingsDir: "assets/drawings/",
  drawingExtensions: ["webp", "png", "svg", "jpg"],

  // Photos, relative to the site root. Leave empty until the photo is in
  // assets/; the page shows a dashed "Photo to be added" frame meanwhile.
  photos: {
    factory: "", // About page, next to the intro (e.g. "assets/factory.webp")
  },

  // Parts that have a 3D model (js/models3d.js + assets/3d/). Their product
  // page gets a "3D view" tab next to the drawing.
  models3d: ["23-8050"],

  // Facts to confirm before launch. Shown as placeholders until filled in.
  facts: {
    founded: "2015",
    warranty: "3 years",
    factoryCapacity: "500,000 / yr",
    factoryCapacityNumber: "500,000",
    productRange: "100+",
    factoryCapacityLong: "500,000 air springs",
  },
};
