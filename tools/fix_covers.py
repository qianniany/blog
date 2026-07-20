# -*- coding: utf-8 -*-
"""下载文章封面图并压缩到 100-200KB，保存为 source/img/covers/<文章名>.jpg"""
import io
import os
import re
import urllib.request

from PIL import Image

POSTS_DIR = "source/_posts"
OUT_DIR = "source/img/covers"
MAX_WIDTH = 1200
MIN_KB, MAX_KB = 100, 200

os.makedirs(OUT_DIR, exist_ok=True)

def download(url):
    url = re.sub(r"(?<!:)//+", "/", url)  # 修正链接里的双斜杠
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
        if data[:2] == b"\x1f\x8b":  # gzip 压缩的响应体
            import gzip
            data = gzip.decompress(data)
        return data

def compress(data):
    img = Image.open(io.BytesIO(data)).convert("RGB")
    if img.width > MAX_WIDTH:
        img = img.resize((MAX_WIDTH, int(img.height * MAX_WIDTH / img.width)), Image.LANCZOS)
    buf = io.BytesIO()
    # 从质量 85 开始递减，直到落入 100-200KB；低于 100KB 就保持最接近的质量
    best = None
    for q in (85, 75, 65, 55, 45, 35, 25):
        buf.seek(0); buf.truncate()
        img.save(buf, "JPEG", quality=q, optimize=True, progressive=True)
        size = buf.tell()
        if MIN_KB * 1024 <= size <= MAX_KB * 1024:
            return buf.getvalue(), q
        if size < MAX_KB * 1024 and best is None:
            best = (buf.getvalue(), q)  # 已低于上限的第一个结果（质量最高）
        if size < MIN_KB * 1024:
            return best[0], best[1] if best else (buf.getvalue(), q)[1]
    return buf.getvalue(), 25

for fname in sorted(os.listdir(POSTS_DIR)):
    if not fname.endswith(".md"):
        continue
    path = os.path.join(POSTS_DIR, fname)
    text = open(path, encoding="utf-8").read()
    m = re.search(r"^cover:\s*(\S+)", text, re.M)
    if not m or "haowallpaper.com" not in m.group(1):
        continue
    name = os.path.splitext(fname)[0]
    if not name or name.startswith("."):  # 跳过 ".md" 之类的异常文件
        continue
    out = os.path.join(OUT_DIR, name + ".jpg")
    data = download(m.group(1))
    compressed, q = compress(data)
    with open(out, "wb") as f:
        f.write(compressed)
    print(f"{name}: {len(data)//1024}KB -> {len(compressed)//1024}KB (q={q})")
