#!/usr/bin/env bash
# Nanum Myeongjo 원본 TTF(pipeline/fonts-backup/)를 앱 번들용 woff2 서브셋으로 재생성한다.
# 서브셋 범위: 완성형 한글 전체(U+AC00-D7A3) + 기본 라틴 + 게임 본문에서 쓰는 문장부호/기호.
# 완성형 전체를 유지하는 이유: 플레이어 이름 입력이 임의 한글을 받으므로 폴백(고딕) 노출을 막는다.
# 사용: pip install --user "fonttools[woff]" 후 bash pipeline/scripts/subset_fonts.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SRC="$ROOT/pipeline/fonts-backup"
DEST="$ROOT/app/src/assets/fonts"

UNICODES="U+0020-007E,U+00A0,U+00A7,U+00AB,U+00B0,U+00B7,U+00BB,U+00D7,U+2013-2015,U+2018-201D,U+2020,U+2022,U+2026,U+2030,U+2039,U+203A,U+2190-2193,U+2212,U+25A0-25A1,U+25B2,U+25B6,U+25BC,U+25C0,U+25CB,U+25CF,U+2605-2606,U+3001-3002,U+300C-300F,U+3010-3011,U+FF01,U+FF08-FF09,U+FF1A,U+FF1F,U+AC00-D7A3"

for weight in Regular Bold ExtraBold; do
  pyftsubset "$SRC/NanumMyeongjo-$weight.ttf" \
    --output-file="$DEST/NanumMyeongjo-$weight.woff2" \
    --flavor=woff2 \
    --layout-features='*' \
    --unicodes="$UNICODES"
  echo "  ✓ NanumMyeongjo-$weight.woff2 $(stat -c%s "$DEST/NanumMyeongjo-$weight.woff2") bytes"
done
