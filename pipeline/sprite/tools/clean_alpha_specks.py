#!/usr/bin/env python3
"""clean_alpha_specks.py — 추출 프레임에서 본체와 떨어진 미세 알파 찌꺼기를 제거한다.

sprite-gen extract 는 컴포넌트 병합 단계에서 노이즈 임계(largest*0.002) 아래의
파편을 버리지만, 다운스케일(LANCZOS) 이후 셀 안에 알파 1~20 수준의 1~수 픽셀
잔재가 남는 경우가 있다. 눈에는 안 보여도 "알파 찌꺼기 없음" 게이트에는 걸린다.

본체(최대 컴포넌트)에 연결되지 않은 컴포넌트 중 크기가 --max-size 이하인 것을
완전 투명으로 지운다. 결정론적이고 멱등하다.

사용: python3 clean_alpha_specks.py RUN_DIR [--max-size 16] [--dry-run]
"""
from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image


def clean(path: Path, max_size: int, dry_run: bool) -> int:
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    seen = [[False] * width for _ in range(height)]
    components: list[list[tuple[int, int]]] = []
    for y in range(height):
        for x in range(width):
            if seen[y][x] or pixels[x, y][3] == 0:
                continue
            queue = deque([(y, x)])
            seen[y][x] = True
            group: list[tuple[int, int]] = []
            while queue:
                cy, cx = queue.popleft()
                group.append((cy, cx))
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < height and 0 <= nx < width and not seen[ny][nx] and pixels[nx, ny][3]:
                            seen[ny][nx] = True
                            queue.append((ny, nx))
            components.append(group)
    if not components:
        return 0
    components.sort(key=len, reverse=True)
    removed = 0
    for group in components[1:]:
        if len(group) > max_size:
            continue
        removed += len(group)
        if not dry_run:
            for cy, cx in group:
                pixels[cx, cy] = (0, 0, 0, 0)
    if removed and not dry_run:
        image.save(path)
    return removed


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("run_dir", type=Path)
    ap.add_argument("--max-size", type=int, default=16)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    total = 0
    for frame in sorted((args.run_dir / "frames").rglob("frame-*.png")):
        removed = clean(frame, args.max_size, args.dry_run)
        if removed:
            total += removed
            print(f"[speck] {frame.relative_to(args.run_dir)}: -{removed}px")
    print(f"[speck] total removed: {total}px ({'dry-run' if args.dry_run else 'written'})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
