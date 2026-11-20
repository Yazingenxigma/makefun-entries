#!/usr/bin/env python3
"""Build the 20 Nov 2026 world-news front page, 1024x1024, deterministic."""
import textwrap
from PIL import Image, ImageDraw, ImageFont

W, H = 1024, 1024
NAVY = (16, 32, 86)
GOLD = (212, 175, 55)
RED = (178, 34, 34)
INK = (20, 20, 20)
GREY = (90, 90, 90)
LIGHT = (240, 241, 245)

def font(name, size):
    return ImageFont.truetype(f"/usr/share/fonts/truetype/dejavu/{name}", size)

FB = lambda s: font("DejaVuSans-Bold.ttf", s)
FR = lambda s: font("DejaVuSans.ttf", s)

hero = Image.open("hero.png").convert("RGB")
# crop hero to 1024x360
hw, hh = hero.size
target_ratio = 1024 / 360
crop_w = hw
crop_h = int(hw / target_ratio)
top = max(0, (hh - crop_h) // 2)
hero = hero.crop((0, top, hw, top + crop_h)).resize((1024, 360), Image.LANCZOS)

img = Image.new("RGB", (W, H), "white")
d = ImageDraw.Draw(img)

# masthead
d.rectangle([0, 0, W, 86], fill=NAVY)
d.text((24, 12), "THE WORLD", font=FB(44), fill="white")
d.text((24, 58), "ONE DAY  •  ONE PICTURE", font=FB(15), fill=GOLD)
d.text((1024 - 24, 14), "FRIDAY", font=FB(28), fill="white", anchor="ra")
d.text((1024 - 24, 48), "20 NOVEMBER 2026", font=FB(20), fill=GOLD, anchor="ra")

img.paste(hero, (0, 86))

# lead story
y = 446
d.rectangle([0, y, W, y + 118], fill=(255, 248, 220))
d.rectangle([0, y, 8, y + 118], fill=RED)
d.text((24, y + 10), "WORLD COURT  —  THE HAGUE", font=FB(16), fill=RED)
d.text((24, y + 32), "Myanmar committed genocide", font=FB(30), fill=INK)
d.text((24, y + 68), "against the Rohingya", font=FB(30), fill=INK)
d.text((640, y + 18), "The International Court of", font=FR(17), fill=INK)
d.text((640, y + 40), "Justice rules in a first", font=FR(17), fill=INK)
d.text((640, y + 62), "against a state.", font=FR(17), fill=INK)
d.text((640, y + 84), "A historic verdict.", font=FR(17), fill=INK)

stories = [
    ("SHENZHEN SUMMIT", RED, "Trump, Xi and Putin meet",
     "First three-way summit ends with a joint peace declaration."),
    ("KYIV UNDER FIRE", NAVY, "Russia strikes Kyiv bridges",
     "Overnight attack kills 8 and damages embassies and a cathedral."),
    ("RIYADH HIT", RED, "Houthi missile hits Riyadh tower",
     "Blast damages Saudi Arabia's PIF tower, its tallest skyscraper."),
    ("MARKETS", NAVY, "Stocks fall for a fifth day",
     "Nikkei down 4.8%; Anthropic jumps 17% on its Nasdaq debut."),
    ("KENYA", (0, 120, 60), "Kenya's last Ebola patient goes home",
     "Outbreak ends 37 days after the first case was found."),
    ("ALSO TODAY", GREY, "Poland: Russia violates airspace",
     "Estonia closes its border with Russia for six months."),
]

y0 = 572
cell_w, cell_h = 496, 136
for i, (tag, colour, head, sub) in enumerate(stories):
    col = i % 2
    row = i // 2
    x = 12 + col * 504
    y = y0 + row * 144
    d.rectangle([x, y, x + cell_w, y + cell_h], fill=LIGHT, outline=(200, 200, 200))
    d.rectangle([x, y, x + cell_w, y + 30], fill=colour)
    d.text((x + 12, y + 6), tag, font=FB(15), fill="white")
    # headline wrapped
    lines = textwrap.wrap(head, width=28)
    ly = y + 38
    for line in lines[:2]:
        d.text((x + 12, ly), line, font=FB(21), fill=INK)
        ly += 26
    # sub wrapped
    sub_lines = textwrap.wrap(sub, width=44)
    sy = y + 92
    for line in sub_lines[:2]:
        d.text((x + 12, sy), line, font=FR(15), fill=GREY)
        sy += 19

d.text((512, 1012), "FRIDAY 20 NOVEMBER 2026  •  THE DAY'S WORLD NEWS IN ONE IMAGE",
       font=FB(13), fill=GREY, anchor="mm")

img.save("entry.png", "PNG", optimize=True)
print("saved entry.png", img.size)
