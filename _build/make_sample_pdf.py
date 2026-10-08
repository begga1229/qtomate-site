#!/usr/bin/env python3
"""Draw the sample sheet used by the app's "Use the sample drawing" button.

A 12.0 x 8.0 m ground floor plan at 1:100 on A3 landscape, so known quantities are:
    floor area 96.0 m2 (56.0 + 22.5 + 17.5), external walls 40.0 m,
    internal partitions 13.0 m, doors 3, windows 4.

    python3 _build/make_sample_pdf.py
"""
import os
from reportlab.lib.pagesizes import A3, landscape
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app", "sample", "qtomate-sample-A-101.pdf")
os.makedirs(os.path.dirname(OUT), exist_ok=True)

W, H = landscape(A3)
c = canvas.Canvas(OUT, pagesize=(W, H))
c.setTitle("A-101 Ground floor plan")
c.setAuthor("QtoMate")
M = 10 * mm  # 1 metre at 1:100 is 10 mm on paper

ox, oy = 110 * mm, 110 * mm  # bottom-left corner of the building


def P(x, y):
    """Building metres -> page points."""
    return ox + x * M, oy + y * M


# sheet border
c.setLineWidth(1.2)
c.rect(10 * mm, 10 * mm, W - 20 * mm, H - 20 * mm)

# grid axes and bubbles
c.setLineWidth(0.4)
c.setDash(8, 3)
c.setStrokeGray(0.45)
for x in (0, 7, 12):
    c.line(*P(x, -1.2), *P(x, 9.6))
for y in (0, 3.5, 8):
    c.line(*P(-1.6, y), *P(13.2, y))
c.setDash()
c.setStrokeGray(0)
c.setFont("Helvetica", 10)
for x, label in ((0, "A"), (7, "B"), (12, "C")):
    px, py = P(x, 10.1)
    c.circle(px, py, 5 * mm, stroke=1, fill=0)
    c.drawCentredString(px, py - 3.5, label)
for y, label in ((8, "1"), (3.5, "2"), (0, "3")):
    px, py = P(-2.1, y)
    c.circle(px, py, 5 * mm, stroke=1, fill=0)
    c.drawCentredString(px, py - 3.5, label)

# external walls (centreline, 12 x 8 m) and internal partitions
c.setLineWidth(5)
c.setLineJoin(0)
c.rect(*P(0, 0), 12 * M, 8 * M)
c.setLineWidth(2.6)
c.line(*P(7, 0), *P(7, 8))
c.line(*P(7, 3.5), *P(12, 3.5))


def opening(x1, y1, x2, y2, width):
    """Cut a white gap in a wall."""
    c.setStrokeGray(1)
    c.setLineWidth(width)
    c.line(*P(x1, y1), *P(x2, y2))
    c.setStrokeGray(0)


def window(x1, y1, x2, y2):
    opening(x1, y1, x2, y2, 7)
    c.setLineWidth(0.7)
    if y1 == y2:
        px, py = P(x1, y1)
        c.rect(px, py - 2.5, (x2 - x1) * M, 5)
        c.line(px, py, px + (x2 - x1) * M, py)
    else:
        px, py = P(x1, y1)
        c.rect(px - 2.5, py, 5, (y2 - y1) * M)
        c.line(px, py, px, py + (y2 - y1) * M)


def door(hx, hy, dx, dy, sx, sy):
    """Door 0.9 m wide: hinge at (hx,hy), opening along (dx,dy), leaf swinging towards (sx,sy)."""
    opening(hx, hy, hx + dx * 0.9, hy + dy * 0.9, 7)
    c.setLineWidth(0.7)
    c.line(*P(hx, hy), *P(hx + sx * 0.9, hy + sy * 0.9))
    cx, cy = P(hx, hy)
    r = 0.9 * M
    import math
    a1 = math.degrees(math.atan2(dy, dx))
    a2 = math.degrees(math.atan2(sy, sx))
    ext = a2 - a1
    if ext > 180:
        ext -= 360
    if ext < -180:
        ext += 360
    c.arc(cx - r, cy - r, cx + r, cy + r, a1, ext)


# 4 windows
window(2.2, 8, 3.8, 8)
window(8.8, 8, 10.4, 8)
window(12, 5.0, 12, 6.6)
window(12, 1.0, 12, 2.6)
# 3 doors: entrance on the bottom wall, two in the partition on grid B
door(2.6, 0, 1, 0, 0, 1)
door(7, 6.4, 0, -1, -1, 0)
door(7, 1.2, 0, 1, -1, 0)

# room names
c.setFont("Helvetica-Bold", 12)
for name, x, y in (("LIVING ROOM", 3.5, 4.2), ("BEDROOM", 9.5, 5.9), ("KITCHEN", 9.5, 1.9)):
    c.drawCentredString(*P(x, y), name)
c.setFont("Helvetica", 9)
for txt, x, y in (("7.00 x 8.00", 3.5, 3.75), ("5.00 x 4.50", 9.5, 5.45), ("5.00 x 3.50", 9.5, 1.45)):
    c.drawCentredString(*P(x, y), txt)


# dimension chains
def dim_h(x1, x2, y, text):
    c.setLineWidth(0.5)
    c.line(*P(x1, y), *P(x2, y))
    for x in (x1, x2):
        px, py = P(x, y)
        c.line(px, py - 4, px, py + 4)
        c.line(px - 3, py - 3, px + 3, py + 3)
    c.setFont("Helvetica", 9)
    c.drawCentredString(P((x1 + x2) / 2, y)[0], P(0, y)[1] + 3, text)


def dim_v(y1, y2, x, text):
    c.setLineWidth(0.5)
    c.line(*P(x, y1), *P(x, y2))
    for y in (y1, y2):
        px, py = P(x, y)
        c.line(px - 4, py, px + 4, py)
        c.line(px - 3, py - 3, px + 3, py + 3)
    c.saveState()
    px, py = P(x, (y1 + y2) / 2)
    c.translate(px - 3, py)
    c.rotate(90)
    c.setFont("Helvetica", 9)
    c.drawCentredString(0, 0, text)
    c.restoreState()


dim_h(0, 7, -0.9, "7000")
dim_h(7, 12, -0.9, "5000")
dim_h(0, 12, -1.6, "12000")
dim_v(0, 3.5, 13.0, "3500")
dim_v(3.5, 8, 13.0, "4500")
dim_v(0, 8, 13.7, "8000")

# title block
bx, by, bw, bh = W - 10 * mm - 150 * mm, 10 * mm, 150 * mm, 34 * mm
c.setLineWidth(1)
c.rect(bx, by, bw, bh)
c.line(bx, by + 17 * mm, bx + bw, by + 17 * mm)
c.line(bx + 100 * mm, by, bx + 100 * mm, by + bh)
c.setFont("Helvetica-Bold", 13)
c.drawString(bx + 4 * mm, by + 23 * mm, "GROUND FLOOR PLAN")
c.setFont("Helvetica", 9)
c.drawString(bx + 4 * mm, by + 10 * mm, "QtoMate sample project. Not a real building.")
c.drawString(bx + 4 * mm, by + 4.5 * mm, "Dimensions in millimetres, measured to wall centrelines.")
c.setFont("Helvetica-Bold", 13)
c.drawString(bx + 104 * mm, by + 23 * mm, "A-101")
c.setFont("Helvetica", 10)
c.drawString(bx + 104 * mm, by + 10 * mm, "SCALE 1:100")
c.drawString(bx + 104 * mm, by + 4.5 * mm, "Sheet size A3")

c.showPage()
c.save()
print("wrote", OUT)
