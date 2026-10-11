"""Prepare web-sized artwork from a supplied PNG; never modify the source."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil

from PIL import Image, ImageStat


configurations = {
    "digital": {
        "stem": "digital-humanities",
        "record": "artwork.json",
        "focus": (0.17, 0.27, 0.98, 0.94),
        "thumbnail": (0.35, 0.38, 0.94, 0.89),
    },
    "thinking": {
        "stem": "humanities-thinking",
        "record": "artwork-thinking.json",
        "focus": (0.0, 0.32, 0.98, 1.0),
        "thumbnail": (0.02, 0.62, 0.47, 0.99),
    },
    "narrative": {
        "stem": "narrative-content",
        "record": "artwork-narrative.json",
        "focus": (0.03, 0.40, 0.99, 0.94),
        "thumbnail": (0.34, 0.56, 0.92, 0.89),
    },
    "culture": {
        "stem": "cultural-social-design",
        "record": "artwork-culture.json",
        "focus": (0.12, 0.24, 0.98, 0.90),
        "thumbnail": (0.30, 0.28, 0.77, 0.71),
    },
}
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("source", type=Path)
parser.add_argument("--area", choices=configurations, default="digital")
arguments = parser.parse_args()
configuration = configurations[arguments.area]
task_dir = Path(__file__).resolve().parent
project_dir = task_dir.parents[2]
source_path = arguments.source.resolve()
if not source_path.is_file():
    raise FileNotFoundError(source_path)
source_hash = hashlib.sha256(source_path.read_bytes()).hexdigest().upper()
public_dir = project_dir / "public/images/worlds"
original_path = public_dir / f"originals/{configuration['stem']}-original.png"
with Image.open(source_path) as supplied_image:
    if supplied_image.format != "PNG":
        raise ValueError("Supply a PNG original; do not rename another format as PNG.")
original_path.parent.mkdir(parents=True, exist_ok=True)
if original_path.exists():
    existing_hash = hashlib.sha256(original_path.read_bytes()).hexdigest().upper()
    if existing_hash != source_hash:
        raise RuntimeError("A different original already exists; preserve it before replacing.")
else:
    shutil.copy2(source_path, original_path)

assets_dir = task_dir / "assets"
assets_dir.mkdir(exist_ok=True)
with Image.open(original_path) as source_image:
    image = source_image.convert("RGB")
width, height = image.size
corners = {}
for name, x, y in (
    ("topLeft", 0, 0), ("topRight", width - 16, 0),
    ("bottomLeft", 0, height - 16), ("bottomRight", width - 16, height - 16),
):
    corners[name] = [round(v) for v in ImageStat.Stat(image.crop((x, y, x + 16, y + 16))).mean]

specs = [
    ("scene", None, (1280, 960), f"{arguments.area}-mother.webp"),
    ("focus", configuration["focus"], (1100, 720), f"{arguments.area}-focus.webp"),
    ("thumbnail", configuration["thumbnail"], (320, 240), f"{arguments.area}-thumbnail.webp"),
]
outputs = []
for name, box, max_size, task_name in specs:
    frame = image.copy()
    pixel_box = None
    if box:
        pixel_box = tuple(round(value * (width if i % 2 == 0 else height)) for i, value in enumerate(box))
        frame = frame.crop(pixel_box)
    frame.thumbnail(max_size, Image.Resampling.LANCZOS)
    target = public_dir / f"{configuration['stem']}-{name}.webp"
    frame.save(target, "WEBP", quality=88, method=6)
    shutil.copy2(target, assets_dir / task_name)
    outputs.append({
        "name": name, "publicPath": str(target.relative_to(project_dir)).replace("\\", "/"),
        "taskPath": f"assets/{task_name}", "dimensions": list(frame.size),
        "cropPixels": pixel_box, "bytes": target.stat().st_size,
    })

record = {
    "sourcePath": str(source_path), "originalPath": str(original_path.relative_to(project_dir)).replace("\\", "/"),
    "originalSHA256": source_hash, "originalDimensions": [width, height], "cornerRGB": corners,
    "processing": "RGB conversion, crop, Lanczos downsample and WebP quality 88; no drawing or generative editing",
    "outputs": outputs,
}
(assets_dir / configuration["record"]).write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(record, ensure_ascii=False, indent=2))
