#!/usr/bin/env python3
"""apply_idle_recipe.py — 정지 자세(static-pose) idle 레시피 자동 적용.

docs/static-pose-recipe.md 대로:
  정지 1컷 + 링크 복제(recommended_breathe_frames-1) @4fps
  + 허리선 split·amplitude 1px·breaths 3 호흡 사이드카.
깜빡임은 자동 생성하지 않음(사람 몫으로 보고).

사용: .venv/bin/python apply_idle_recipe.py --run-dir RUN [--state idle] [--still N]
"""
import argparse
import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "sprite-gen"))
from sprite_gen.breathe import recommended_breathe_frames  # noqa: E402
from sprite_gen.curation import curation_path, load_curation, stamp_curation  # noqa: E402


def waist_split_from(img: Image.Image) -> float | None:
    """curator breathe.js waistSplitFrom 포팅 — ① 벨트 warm 액센트 ② 행간 색분포 급변점."""
    rgba = img.convert("RGBA")
    W, H = rgba.size
    px = rgba.load()
    warm = [0] * H
    hist = []
    top, bot = H, 0
    for y in range(H):
        c: dict[int, int] = {}
        n = 0
        for x in range(W):
            r, g, b, a = px[x, y]
            if a < 40:
                continue
            n += 1
            if r > 200 and g > 140 and b < 110 and r > b + 100:
                warm[y] += 1
            k = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5)
            c[k] = c.get(k, 0) + 1
        hist.append((c, n))
        if n:
            top = min(top, y)
            bot = y + 1
    h = bot - top
    if h < 8:
        return None
    y0 = top + int(h * 0.45)
    y1 = top + int(h * 0.8)

    def clamp(y: int) -> float:
        return min(0.75, max(0.3, (y - top) / h))

    for y in range(y0, y1):
        if warm[y] >= 1:
            return clamp(y)  # ① 벨트 위
    best, besty = 0.35, None
    for y in range(y0, y1):
        (ca, na), (cb, nb) = hist[y - 1], hist[y]
        if not na or not nb:
            continue
        d = 0.0
        for k in set(ca) | set(cb):
            d += abs(ca.get(k, 0) / na - cb.get(k, 0) / nb)
        if d > best:
            best, besty = d, y
    return None if besty is None else clamp(besty)  # ② 급변점


def chest_fallback(img: Image.Image) -> float:
    """③ 가슴 폴백: 상위 55% 최광폭 행 = 어깨, split = (어깨y + h*0.1 - top)/h."""
    rgba = img.convert("RGBA")
    W, H = rgba.size
    px = rgba.load()
    widths = []
    top, bot = H, 0
    for y in range(H):
        n = sum(1 for x in range(W) if px[x, y][3] >= 40)
        widths.append(n)
        if n:
            top = min(top, y)
            bot = y + 1
    h = max(1, bot - top)
    upper = widths[top:top + int(h * 0.55)]
    shoulder_y = top + max(range(len(upper)), key=lambda i: upper[i]) if upper else top
    return min(0.75, max(0.3, (shoulder_y + h * 0.1 - top) / h))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-dir", required=True, type=Path)
    ap.add_argument("--state", default="idle")
    ap.add_argument("--still", type=int, default=0, help="정지 원본 프레임 인덱스")
    args = ap.parse_args()
    run_dir = args.run_dir.resolve()

    request = json.loads((run_dir / "sprite-request.json").read_text(encoding="utf-8"))
    frames_declared = int(request["states"][args.state]["frames"])
    frame_png = run_dir / "frames" / args.state / f"frame-{args.still}.png"
    if not frame_png.is_file():
        raise SystemExit(f"still frame not found: {frame_png}")

    img = Image.open(frame_png)
    split = waist_split_from(img)
    source = "waist"
    if split is None:
        split = chest_fallback(img)
        source = "chest-fallback"

    breathe = {"splits": [round(split, 2)], "amplitude": 1, "breaths": 3, "subpixel": False}
    total = recommended_breathe_frames(breathe)  # breaths 3 → 18
    clone_count = total - 1
    clone_ids = list(range(frames_declared, frames_declared + clone_count))

    doc = load_curation(run_dir) or {"kind": "sprite-gen-curation", "states": {}}
    doc.setdefault("states", {})
    # state_plan 은 `selected` 를 재생 시퀀스로 굽는다 (`order` 는 웹뷰 표시 전용,
    # "복제는 명시 선택으로만 굽는다") — 정지 원본 + 링크 복제 전부를 selected 에 나열.
    doc["states"][args.state] = {
        "selected": [args.still] + clone_ids,
        "order": [args.still] + clone_ids,
        "clones": {str(i): args.still for i in clone_ids},
        "breathe": breathe,
    }
    stamped = stamp_curation(run_dir, doc)
    path = curation_path(run_dir)
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(stamped, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)
    print(f"[idle-recipe] {run_dir.name}: still={args.still} split={split:.2f}({source}) "
          f"seq={total} clones={clone_count} -> {path}")
    print("[idle-recipe] blink NOT auto-generated (human step, per static-pose-recipe)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
