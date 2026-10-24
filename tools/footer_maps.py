"""Small outline maps for the footer: lower-48 USA with Elk Grove Village and
Türkiye with Bursa. Natural Earth 1:50m countries (public domain).
Usage: footer_maps.py countries.geojson  -> prints the two <svg> blocks."""
import json, math, sys

feats = {f["properties"]["ADM0_A3"]: f for f in json.load(open(sys.argv[1]))["features"]}


def polys(code, box):
    lo0, la0, lo1, la1 = box
    for poly in feats[code]["geometry"]["coordinates"]:
        ring = poly[0]
        lons = [p[0] for p in ring]; lats = [p[1] for p in ring]
        cx, cy = sum(lons) / len(lons), sum(lats) / len(lats)
        if lo0 <= cx <= lo1 and la0 <= cy <= la1 and len(ring) > 6:
            yield ring


def svg(code, box, pin, label, width=240, cls=""):
    lat0 = (box[1] + box[3]) / 2
    k = math.cos(math.radians(lat0))
    rings = list(polys(code, box))
    xs = [p[0] * k for r in rings for p in r]; ys = [-p[1] for r in rings for p in r]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    s = width / (x1 - x0); height = round((y1 - y0) * s)
    P = lambda lon, lat: ((lon * k - x0) * s, (-lat - y0) * s)
    d = ""
    for r in rings:
        pts = [P(*p) for p in r]
        keep = [pts[0]]
        for q in pts[1:]:
            if abs(q[0] - keep[-1][0]) + abs(q[1] - keep[-1][1]) > 0.9: keep.append(q)
        if len(keep) < 4: continue
        d += "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in keep) + "Z"
    px, py = P(*pin)
    return (f'<svg class="footer-map{cls}" viewBox="-6 -6 {width + 12} {height + 12}" role="img" aria-label="{label}">'
            f'<path class="land" d="{d}"/>'
            f'<circle class="pin-ring" cx="{px:.1f}" cy="{py:.1f}" r="7"/><circle class="pin-dot" cx="{px:.1f}" cy="{py:.1f}" r="3.6"/></svg>')


print(svg("USA", (-125, 24, -66, 50), (-87.97, 42.00), "Map of the United States marking Elk Grove Village, Illinois"))
print(svg("TUR", (25, 35, 45, 43), (29.06, 40.19), "Map of Türkiye marking Bursa"))
