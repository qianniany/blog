# -*- coding: utf-8 -*-
"""把主页背景图和加载幕布图压缩为 200-300KB 的 JPEG"""
import io
import os

from PIL import Image

TARGETS = [
    "source/img/day-snow-anime.png",
    "source/img/hero-miku.png",
    "source/img/loading-curtain-left.png",
    "source/img/loading-curtain-right.png",
]
MAX_WIDTH = 1920
MIN_KB, MAX_KB = 200, 300

def compress(path):
    img = Image.open(path).convert("RGB")
    if img.width > MAX_WIDTH:
        img = img.resize((MAX_WIDTH, int(img.height * MAX_WIDTH / img.width)), Image.LANCZOS)
    buf = io.BytesIO()
    best = None
    for q in (90, 85, 80, 75, 70, 60, 50, 40, 30):
        buf.seek(0); buf.truncate()
        img.save(buf, "JPEG", quality=q, optimize=True, progressive=True)
        size = buf.tell()
        if MIN_KB * 1024 <= size <= MAX_KB * 1024:
            return buf.getvalue(), q
        if size < MAX_KB * 1024 and best is None:
            best = (buf.getvalue(), q)
        if size < MIN_KB * 1024:
            return best
    return buf.getvalue(), 30

for src in TARGETS:
    data, q = compress(src)
    out = os.path.splitext(src)[0] + ".jpg"
    with open(out, "wb") as f:
        f.write(data)
    print(f"{src}: {os.path.getsize(src)//1024}KB -> {len(data)//1024}KB (q={q})")
