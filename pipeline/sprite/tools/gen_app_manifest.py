#!/usr/bin/env python3
"""gen_app_manifest.py — sprite-gen manifest.json(frame_layout) → 앱 SpritePlayer 어댑터.

앱 형식: { "actions": { "<state>": { "frames": [{x,y,w,h}...], "fps": N, "loop": bool } } }
좌표는 sprite-sheet-alpha.png 픽셀 그대로 (webp 무리사이즈 변환이므로 그대로 유효).

사용: python3 gen_app_manifest.py --manifest RUN/manifest.json --out OUT.json [--states idle,attack]
"""
import argparse
import json
from pathlib import Path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--states", default="idle,attack")
    args = ap.parse_args()

    src = json.loads(args.manifest.read_text(encoding="utf-8"))
    layout_rows = src["frame_layout"]["rows"]
    anim_rows = src["animation"]["rows"]
    wanted = [s.strip() for s in args.states.split(",") if s.strip()]

    actions = {}
    for state in wanted:
        if state not in layout_rows:
            raise SystemExit(f"state {state!r} not in frame_layout.rows ({list(layout_rows)})")
        anim = anim_rows[state]
        actions[state] = {
            "frames": [{"x": r["x"], "y": r["y"], "w": r["w"], "h": r["h"]}
                       for r in layout_rows[state]],
            "fps": anim["fps"],
            "loop": bool(anim["loop"]),
        }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps({"actions": actions}, indent=2), encoding="utf-8")
    counts = {s: len(a["frames"]) for s, a in actions.items()}
    print(f"[app-manifest] {args.out} states={counts}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
