#!/usr/bin/env python3
# expr_postprocess.py — 표정 배리언트 후처리 파이프라인
#   크로마 그린 제거(코너 샘플 기반 소프트 키 + 디스필) → 투명 PNG
#   → 베이스 머리꼭대기 y 기준 세로 정렬(best-effort) → webp(q85) 적재
# 사용:
#   측정만:  python3 expr_postprocess.py measure <png...>
#   적재:    python3 expr_postprocess.py load <picks.json>
# picks.json 형식: {"sea": {"base": "<png>", "smile": "<png>", ...}, ...}
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image

APP_CHAR = Path("/mnt/d/miyensi/app/public/assets/char")

def key_chroma(im: Image.Image) -> Image.Image:
    """코너 4점 평균으로 배경색 추정 → 색거리 소프트 알파 + 그린 디스필."""
    rgb = np.asarray(im.convert("RGB"), dtype=np.float32)
    h, w = rgb.shape[:2]
    corners = np.stack([rgb[4, 4], rgb[4, w - 5], rgb[h - 5, 4], rgb[h - 5, w - 5]])
    bg = corners.mean(axis=0)
    dist = np.linalg.norm(rgb - bg, axis=2)
    # 그린 우세(배경 계열)만 키 대상 — 캐릭터 내 유사 밝기 색 보호
    g_dom = (rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2]))
    keyable = (g_dom > 20) & (rgb[..., 1] > 60)
    LO, HI = 40.0, 110.0  # dist<LO 완전투명, dist>HI 완전불투명
    alpha = np.clip((dist - LO) / (HI - LO), 0.0, 1.0)
    alpha = np.where(keyable, alpha, 1.0)
    # 디스필: 반투명·경계 픽셀의 초과 그린을 이웃 채널 최대치로 클램프
    spill = (alpha < 1.0) | ((g_dom > 8) & (dist < 200) & keyable)
    g = rgb[..., 1]
    cap = np.maximum(rgb[..., 0], rgb[..., 2])
    rgb[..., 1] = np.where(spill, np.minimum(g, cap + 8), g)
    out = np.dstack([rgb, alpha[..., None] * 255.0]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")

def head_metrics(rgba: Image.Image):
    """중앙 50% 컬럼에서 알파 임계 상단 y(머리꼭대기)와 상체 중심 x를 잰다."""
    a = np.asarray(rgba)[:, :, 3]
    h, w = a.shape
    mid = a[:, w // 4 : w * 3 // 4] > 128
    rows = np.flatnonzero(mid.any(axis=1))
    top_y = int(rows[0]) if rows.size else -1
    if top_y >= 0:
        band = a[top_y : min(top_y + h // 4, h), :] > 128
        xs = np.flatnonzero(band.any(axis=0))
        cx = int((xs[0] + xs[-1]) // 2) if xs.size else w // 2
    else:
        cx = w // 2
    return top_y, cx

def shift_canvas(rgba: Image.Image, dy: int) -> Image.Image:
    """dy>0이면 아래로 이동. 동일 캔버스 크기 유지, 빈 곳은 투명."""
    if dy == 0:
        return rgba
    out = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    out.paste(rgba, (0, dy))
    return out

def process_one(src: Path):
    im = Image.open(src)
    rgba = key_chroma(im)
    top_y, cx = head_metrics(rgba)
    return rgba, top_y, cx

def cmd_measure(paths):
    print(f"{'file':<40} {'head_top_y':>10} {'center_x':>9}")
    for p in paths:
        _, ty, cx = process_one(Path(p))
        print(f"{Path(p).name:<40} {ty:>10} {cx:>9}")

def cmd_load(picks_path):
    picks = json.loads(Path(picks_path).read_text())
    report = []
    for char, mapping in picks.items():
        dst_dir = APP_CHAR / char
        dst_dir.mkdir(parents=True, exist_ok=True)
        base_rgba, base_y, base_cx = process_one(Path(mapping["base"]))
        base_rgba.save(dst_dir / "base.webp", "WEBP", quality=85)
        report.append((char, "base", 0, base_y))
        for expr, src in mapping.items():
            if expr == "base":
                continue
            rgba, ty, cx = process_one(Path(src))
            dy = base_y - ty if (ty >= 0 and base_y >= 0) else 0
            rgba = shift_canvas(rgba, dy)
            rgba.save(dst_dir / f"expr_{expr}.webp", "WEBP", quality=85)
            report.append((char, expr, dy, ty))
    print(f"{'char':<9} {'expr':<10} {'dy':>5} {'raw_top_y':>9}")
    for char, expr, dy, ty in report:
        print(f"{char:<9} {expr:<10} {dy:>5} {ty:>9}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit("usage: expr_postprocess.py measure <png...> | load <picks.json>")
    if sys.argv[1] == "measure":
        cmd_measure(sys.argv[2:])
    elif sys.argv[1] == "load":
        cmd_load(sys.argv[2])
    else:
        sys.exit(f"unknown command {sys.argv[1]}")
