#!/usr/bin/env python3
"""gen_rows.py — 3캐릭터 × (idle, attack) 행 생성. 4동시(스킬 확정), resume(존재 시 스킵)."""
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

SPRITE = Path("/mnt/d/miyensi/pipeline/sprite")
PY = SPRITE / ".venv/bin/python"
GEN = SPRITE / "sprite-gen/scripts/generate_sprite_image.py"
CHARS = ["sea", "riwon", "yunseul"]
STATES = ["idle", "attack"]


def one(char: str, state: str):
    run = SPRITE / "runs" / char
    out = run / "raw" / f"{state}.png"
    if out.exists():
        return (char, state, "skip", 0.0)
    t0 = time.time()
    r = subprocess.run(
        [str(PY), str(GEN), "--provider", "codex",
         "--prompt-file", str(run / "prompts" / f"{state}.txt"),
         "--out", str(out),
         "--ref", str(run / "base-source.png"),
         "--ref", str(run / "references/layout-guides" / f"{state}.png"),
         "--report", str(run / "raw" / f"{state}.report.json")],
        capture_output=True, text=True, timeout=600)
    status = "ok" if r.returncode == 0 and out.exists() else f"fail rc={r.returncode}: {r.stderr[-300:]}"
    return (char, state, status, time.time() - t0)


def main() -> int:
    jobs = [(c, s) for c in CHARS for s in STATES]
    fails = 0
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(one, c, s): (c, s) for c, s in jobs}
        for f in as_completed(futs):
            char, state, status, el = f.result()
            print(f"[{char}/{state}] {status} ({el:.0f}s)", flush=True)
            if status not in ("ok", "skip"):
                fails += 1
    print(f"done fails={fails}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
