#!/bin/bash
# expr_montage.sh — 검수용 몽타주 생성 (ImageMagick)
# candidates <char>: raw 후보 18장(9표정×2) 라벨 그리드 → review/expr/<char>-candidates.png
# final <char>:      base + 픽된 9표정 webp 그리드 → review/expr/<char>-grid.png
set -euo pipefail
ROOT=/mnt/d/miyensi
RAW=$ROOT/pipeline/raw/expr
REVIEW=$ROOT/pipeline/review/expr
CHARDIR=$ROOT/app/public/assets/char
EXPRS=(neutral smile laugh blush sad worry surprise serious closed)
mkdir -p "$REVIEW"

mode=$1; char=$2
case $mode in
  candidates)
    args=()
    for e in "${EXPRS[@]}"; do
      for c in 1 2; do
        f=$RAW/$char-$e-$c.png
        [ -f "$f" ] && args+=(-label "$e-$c" "$f")
      done
    done
    montage "${args[@]}" -tile 6x -geometry 256x384+4+4 -background '#222' -fill white "$REVIEW/$char-candidates.png"
    echo "$REVIEW/$char-candidates.png"
    ;;
  final)
    args=(-label "base" "$CHARDIR/$char/base.webp")
    for e in "${EXPRS[@]}"; do
      args+=(-label "$e" "$CHARDIR/$char/expr_$e.webp")
    done
    montage "${args[@]}" -tile 5x2 -geometry 256x384+4+4 -background '#555' -fill white "$REVIEW/$char-grid.png"
    echo "$REVIEW/$char-grid.png"
    ;;
  *) echo "usage: expr_montage.sh candidates|final <char>" >&2; exit 1;;
esac
