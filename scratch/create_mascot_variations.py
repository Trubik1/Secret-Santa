import os
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw, ImageOps
import math

brain = r'C:\Users\artem\.gemini\antigravity\brain\4a4e23ea-fbc3-4d7a-9541-66157cad8cd9'
src_path = os.path.join(brain, 'avatar_2_mascot.jpg')
im = Image.open(src_path).convert('RGB')
w, h = im.size # 1024, 1024

# 1. Classic Full (Already have it, ensure it's saved)
v1 = im.copy()
v1_path = os.path.join(brain, 'mascot_v1_classic.jpg')
v1.save(v1_path, quality=95)

# 2. Close-up Face Focus (Crop to face & top of glowing gift, ideal for small Telegram round avatar)
# Center slightly above midpoint to capture cute ears, huge eyes, and top ribbon
crop_w = int(w * 0.72)
crop_h = int(h * 0.72)
center_x = w // 2
center_y = int(h * 0.44)

left = center_x - crop_w // 2
top = center_y - crop_h // 2
right = left + crop_w
bottom = top + crop_h

v2 = im.crop((left, top, right, bottom)).resize((w, h), Image.Resampling.LANCZOS)
# Subtle sharpness boost for avatar scale
enhancer = ImageEnhance.Sharpness(v2)
v2 = enhancer.enhance(1.2)
v2_path = os.path.join(brain, 'mascot_v2_closeup.jpg')
v2.save(v2_path, quality=95)

# 3. Liquid Neon Glow Ring
v3 = im.copy().convert('RGBA')
overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
draw = ImageDraw.Draw(overlay)

# Draw glowing ring (centered at 512, 512, radius ~440)
ring_center = (w // 2, h // 2)
radius = 450
for offset, alpha, width in [(15, 30, 24), (8, 60, 16), (0, 180, 8), (-4, 255, 4)]:
    draw.ellipse(
        [ring_center[0] - radius - offset, ring_center[1] - radius - offset,
         ring_center[0] + radius + offset, ring_center[1] + radius + offset],
        outline=(196, 69, 123, alpha),
        width=width
    )

# Add subtle sparkle stars
sparkle_positions = [(180, 160, 16), (840, 190, 20), (820, 780, 14), (160, 800, 12)]
for sx, sy, size in sparkle_positions:
    for dx, dy in [(-size, 0), (size, 0), (0, -size), (0, size)]:
        draw.line([(sx, sy), (sx + dx, sy + dy)], fill=(255, 190, 220, 220), width=3)
    draw.ellipse([sx - 4, sy - 4, sx + 4, sy + 4], fill=(255, 255, 255, 255))

v3 = Image.alpha_composite(v3, overlay).convert('RGB')
v3_path = os.path.join(brain, 'mascot_v3_neon_ring.jpg')
v3.save(v3_path, quality=95)

# 4. OLED Vibrant Boost (Deep black background, saturated rose rim lighting and glowing gift box)
v4 = im.copy()
# Boost contrast
contrast = ImageEnhance.Contrast(v4)
v4 = contrast.enhance(1.25)
# Boost color vibrancy
color = ImageEnhance.Color(v4)
v4 = color.enhance(1.3)
# Brightness tweak
bright = ImageEnhance.Brightness(v4)
v4 = bright.enhance(1.05)
v4_path = os.path.join(brain, 'mascot_v4_oled_vibrant.jpg')
v4.save(v4_path, quality=95)

# 5. Super-Zoom Ultra-Cute Expression (Focus right into the cute eyes and nose)
crop_w5 = int(w * 0.58)
crop_h5 = int(h * 0.58)
center_y5 = int(h * 0.38)
left5 = w // 2 - crop_w5 // 2
top5 = center_y5 - crop_h5 // 2
v5 = im.crop((left5, top5, left5 + crop_w5, top5 + crop_h5)).resize((w, h), Image.Resampling.LANCZOS)
sharp5 = ImageEnhance.Sharpness(v5)
v5 = sharp5.enhance(1.25)
v5_path = os.path.join(brain, 'mascot_v5_eyes_focus.jpg')
v5.save(v5_path, quality=95)

print('All 5 mascot variations generated successfully!')
