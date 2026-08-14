#!/usr/bin/env python3
"""Regenerate every derived brand asset from images/fcc-logo.png.

    python tools/make-icons.py

Run this whenever the logo is replaced. It writes:

    favicon.ico              16 / 32 / 48 px, white ground
    favicon-16x16.png
    favicon-32x32.png
    apple-touch-icon.png     180 px, white ground (iOS does not honour alpha)
    images/fcc-logo-192.png  PWA manifest icon
    og-image.jpg             1200x630 social card, logo on brand navy

The source logo carries a white background and a wide white margin. Every
icon here is cut from the trimmed artwork and re-padded, which makes the mark
appreciably larger — and so legible — at 16 and 32 px.
"""
import os
from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO = os.path.join(ROOT, "images", "fcc-logo.png")

NAVY = (27, 42, 107)
NAVY_DEEP = (17, 28, 76)
GOLD = (212, 160, 23)
WHITE = (255, 255, 255)

DISPLAY_FONT = "C:/Windows/Fonts/ARIALNB.TTF"
BODY_FONT = "C:/Windows/Fonts/segoeui.ttf"


def trimmed_logo():
    """The logo cropped to its artwork, on a transparent ground."""
    im = Image.open(LOGO).convert("RGB")
    ground = Image.new("RGB", im.size, im.getpixel((0, 0)))
    mask = ImageChops.difference(im, ground).convert("L").point(lambda v: 255 if v > 12 else 0)
    box = mask.getbbox()
    art = im.crop(box)
    art.putalpha(mask.crop(box))
    return art


def on_square(art, size, pad=0.07, bg=WHITE):
    """Fit the artwork inside a square canvas with proportional padding."""
    canvas = Image.new("RGB", (size, size), bg)
    inner = int(size * (1 - pad * 2))
    scaled = art.copy()
    scaled.thumbnail((inner, inner), Image.LANCZOS)
    canvas.paste(scaled, ((size - scaled.width) // 2, (size - scaled.height) // 2), scaled)
    return canvas


def navy_backdrop(w, h):
    """Brand navy with the site's faint chart grid and a gold corner glow."""
    bg = Image.new("RGB", (w, h), NAVY)
    d = ImageDraw.Draw(bg, "RGBA")
    for x in range(0, w, 64):
        d.line([(x, 0), (x, h)], fill=(255, 255, 255, 8))
    for y in range(0, h, 64):
        d.line([(0, y), (w, y)], fill=(255, 255, 255, 8))
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i in range(70, 0, -1):
        r = i * 13
        gd.ellipse([w - 150 - r, -230 - r, w - 150 + r, -230 + r],
                   fill=(212, 160, 23, max(1, int(20 - i * 0.26))))
    bg = Image.alpha_composite(bg.convert("RGBA"), glow).convert("RGB")
    d = ImageDraw.Draw(bg, "RGBA")
    for i in range(h):                      # settle the base towards deep navy
        k = i / h
        d.line([(0, i), (w, i)], fill=NAVY_DEEP + (int(90 * k),))
    return bg


def build():
    art = trimmed_logo()
    print(f"source artwork trimmed to {art.size}")

    # --- favicons -------------------------------------------------------
    on_square(art, 16, pad=0.03).save(os.path.join(ROOT, "favicon-16x16.png"), optimize=True)
    on_square(art, 32, pad=0.04).save(os.path.join(ROOT, "favicon-32x32.png"), optimize=True)
    on_square(art, 180, pad=0.10).save(os.path.join(ROOT, "apple-touch-icon.png"), optimize=True)
    on_square(art, 192, pad=0.10).save(os.path.join(ROOT, "images", "fcc-logo-192.png"), optimize=True)
    ico = on_square(art, 48, pad=0.04)
    ico.save(os.path.join(ROOT, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])

    # --- Open Graph card -------------------------------------------------
    W, H = 1200, 630
    card = navy_backdrop(W, H)
    d = ImageDraw.Draw(card)

    # The logo ships on a white ground, so it sits in a white plate rather
    # than being knocked out — its navy letterforms would otherwise vanish
    # into the navy behind them.
    plate, pad = 250, 92
    px, py = 96, (H - plate) // 2
    d.rounded_rectangle([px, py, px + plate, py + plate], radius=22, fill=WHITE)
    mark = art.copy()
    mark.thumbnail((plate - 44, plate - 44), Image.LANCZOS)
    card.paste(mark, (px + (plate - mark.width) // 2, py + (plate - mark.height) // 2), mark)

    tx = px + plate + 64
    d.text((tx, 196), "EST. 2016  •  WORLDWIDE COMMUNITY",
           font=ImageFont.truetype(DISPLAY_FONT, 25), fill=GOLD)
    d.text((tx, 234), "FILIPINA CABIN CREW",
           font=ImageFont.truetype(DISPLAY_FONT, 78), fill=WHITE)
    d.rectangle([tx, 344, tx + 92, 350], fill=GOLD)
    d.text((tx, 374), "Where Aviation Connects Us",
           font=ImageFont.truetype(BODY_FONT, 31), fill=(232, 238, 248))
    d.text((tx, 424), "Hiring updates  ·  Career guides  ·  Mentorship  ·  Community",
           font=ImageFont.truetype(BODY_FONT, 23), fill=(178, 196, 224))

    card.save(os.path.join(ROOT, "og-image.jpg"), "JPEG",
              quality=88, optimize=True, progressive=True)

    for f in ("favicon.ico", "favicon-16x16.png", "favicon-32x32.png",
              "apple-touch-icon.png", "og-image.jpg", "images/fcc-logo-192.png"):
        p = os.path.join(ROOT, f)
        print(f"  {f:<26} {os.path.getsize(p):>7,} bytes")


if __name__ == "__main__":
    build()
