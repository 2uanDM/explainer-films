#!/usr/bin/env python3
"""Start a new film folder from the starter story.

    python3 <skill>/scripts/new_film.py <film-dir> [--voice vi-VN-HoaiMyNeural] [--provider edge]

Creates <film-dir>/story.js (a complete, working five-scene example to rewrite) and voice.json.
Refuses to overwrite an existing story.js.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film", type=Path)
    ap.add_argument("--provider", default="edge", choices=["edge", "openai", "elevenlabs", "none"])
    ap.add_argument("--voice", default="en-US-AndrewMultilingualNeural")
    ap.add_argument("--rate", default="+0%")
    a = ap.parse_args()

    film = a.film.resolve()
    film.mkdir(parents=True, exist_ok=True)
    story = film / "story.js"
    if story.exists():
        sys.exit(f"{story} already exists; edit it instead")
    shutil.copy(SKILL / "assets" / "story-starter.js", story)
    (film / "voice.json").write_text(json.dumps({"provider": a.provider, "voice": a.voice, "rate": a.rate, "pitch": "+0Hz", "lexicon": {}}, indent=2) + "\n")
    print(f"created {story} and voice.json in {film}")
    print("next: rewrite story.js for your topic, then run build_vo.py, build.py and preview.mjs")


if __name__ == "__main__":
    main()
