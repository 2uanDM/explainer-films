#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["edge-tts>=7", "mutagen>=1.47"]
# ///
"""Synthesize one narration clip per line of story.js and write vo.json.

Run with uv so the dependencies install themselves:

    uv run <skill>/scripts/build_vo.py <film-dir> [--provider edge] [--voice en-US-AndrewMultilingualNeural]

Reads   <film-dir>/story.js   every N('...') / beat('...') / Narr.set('...') string literal
        <film-dir>/voice.json provider, voice, rate, pitch, lexicon (created on first run)
Writes  <film-dir>/vo/<id>.mp3, <film-dir>/vo.json  {plain text: [id, seconds, scene id]}

Clip ids hash the provider, voice settings and spoken text, so re-running only
synthesizes lines that changed. Clips no longer referenced are deleted (--keep to skip).

Providers:
  edge        Microsoft Edge neural voices. Free, no key, 400+ voices incl. vi-VN. (default)
  openai      needs OPENAI_API_KEY. voice e.g. alloy, coral, sage; model gpt-4o-mini-tts.
  elevenlabs  needs ELEVENLABS_API_KEY. voice = a voice id; model eleven_multilingual_v2.
  none        no audio; vo.json is emptied and the film plays as subtitles only.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import html
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

DEFAULTS = {
    "provider": "edge",
    "voice": "en-US-AndrewMultilingualNeural",
    "rate": "+0%",
    "pitch": "+0Hz",
    "model": "",
    "instructions": "",
    "lexicon": {},
}

STR = r"""(?P<q>['"])(?P<s>(?:\\.|(?!(?P=q)).)*)(?P=q)"""
CALL_RE = re.compile(r"\b(?:N|beat|Narr\.set)\(\s*" + STR, re.S)
TEMPLATE_CALL_RE = re.compile(r"\b(?:N|beat|Narr\.set)\(\s*`")
ID_RE = re.compile(r"""\bid\s*:\s*['"]([\w-]+)['"]""")


def js_unescape(s: str) -> str:
    def rep(m: re.Match) -> str:
        e = m.group(1)
        if e.startswith("u{"):
            return chr(int(e[2:-1], 16))
        if e.startswith("u"):
            return chr(int(e[1:], 16))
        if e.startswith("x"):
            return chr(int(e[1:], 16))
        return {"n": "\n", "t": "\t", "r": "", "0": "\0"}.get(e, e)

    return re.sub(r"\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)", rep, s, flags=re.S)


def plain_text(h: str) -> str:
    """Mirror the engine's plainText(): drop tags, decode entities, collapse whitespace."""
    t = re.sub(r"<[^>]+>", "", h)
    t = html.unescape(t)
    return re.sub(r"\s+", " ", t).strip()


def strip_comments(src: str) -> str:
    """Blank out // and /* */ comments (keeping string and template literals intact)."""
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c in "'\"`":
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == "\\" else 1
            out.append(src[i:j + 1]); i = j + 1
        elif src.startswith("//", i):
            j = src.find("\n", i); j = n if j < 0 else j
            out.append(" " * (j - i)); i = j
        elif src.startswith("/*", i):
            j = src.find("*/", i + 2); j = n if j < 0 else j + 2
            out.append(re.sub(r"[^\n]", " ", src[i:j])); i = j
        else:
            out.append(c); i += 1
    return "".join(out)


def extract_lines(story: str) -> list[tuple[str, str]]:
    """Return [(plain text, scene id)] in story order, de-duplicated by text."""
    story = strip_comments(story)
    for m in TEMPLATE_CALL_RE.finditer(story):
        line = story.count("\n", 0, m.start()) + 1
        print(f"warning: story.js:{line} narration uses a `template literal`; use a plain '...' string so it can be voiced", file=sys.stderr)
    ids = [(m.start(), m.group(1)) for m in ID_RE.finditer(story)]
    seen, out = set(), []
    for m in CALL_RE.finditer(story):
        text = plain_text(js_unescape(m.group("s")))
        if not text or text in seen:
            continue
        seen.add(text)
        scene = ""
        for pos, sid in ids:
            if pos < m.start():
                scene = sid
            else:
                break
        out.append((text, scene))
    return out


def spoken(text: str, lexicon: dict[str, str]) -> str:
    """Apply pronunciation fixes (subtitles keep the original spelling)."""
    for k in sorted(lexicon, key=len, reverse=True):
        text = re.sub(r"(?<!\w)" + re.escape(k) + r"(?!\w)", lexicon[k], text)
    return text


def clip_id(cfg: dict, say: str) -> str:
    key = "|".join([cfg["provider"], cfg["voice"], cfg["rate"], cfg["pitch"], cfg.get("model", ""), cfg.get("instructions", ""), say])
    return hashlib.sha1(key.encode("utf-8")).hexdigest()[:10]


def duration(path: Path) -> float:
    from mutagen.mp3 import MP3

    return round(MP3(path).info.length, 2)


async def synth_edge(cfg: dict, say: str, path: Path) -> None:
    import edge_tts

    # the free endpoint throttles bursts (NoAudioReceived); back off and retry
    for attempt in range(7):
        try:
            await edge_tts.Communicate(say, cfg["voice"], rate=cfg["rate"], pitch=cfg["pitch"]).save(str(path))
            if path.stat().st_size > 0:
                return
        except Exception as e:
            if attempt == 6:
                raise
            print(f"  retry {attempt + 1} ({e.__class__.__name__}) …", file=sys.stderr)
        await asyncio.sleep(1.5 * 2 ** min(attempt, 4))


def synth_http(cfg: dict, say: str, path: Path) -> None:
    p = cfg["provider"]
    if p == "openai":
        key = os.environ.get("OPENAI_API_KEY") or sys.exit("OPENAI_API_KEY is not set")
        body = {"model": cfg.get("model") or "gpt-4o-mini-tts", "voice": cfg["voice"], "input": say, "response_format": "mp3"}
        if cfg.get("instructions"):
            body["instructions"] = cfg["instructions"]
        req = urllib.request.Request("https://api.openai.com/v1/audio/speech", data=json.dumps(body).encode(), headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    elif p == "elevenlabs":
        key = os.environ.get("ELEVENLABS_API_KEY") or sys.exit("ELEVENLABS_API_KEY is not set")
        body = {"text": say, "model_id": cfg.get("model") or "eleven_multilingual_v2"}
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{cfg['voice']}?output_format=mp3_44100_64", data=json.dumps(body).encode(), headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    else:
        sys.exit(f"unknown provider {p!r}")
    with urllib.request.urlopen(req, timeout=120) as r:
        path.write_bytes(r.read())


async def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film", type=Path)
    ap.add_argument("--provider", choices=["edge", "openai", "elevenlabs", "none"])
    ap.add_argument("--voice")
    ap.add_argument("--rate", help="edge only, e.g. +8%% or -5%%")
    ap.add_argument("--pitch", help="edge only, e.g. +0Hz")
    ap.add_argument("--model")
    ap.add_argument("--instructions", help="openai only: speaking style, e.g. 'warm, unhurried teacher'")
    ap.add_argument("--keep", action="store_true", help="keep clips that are no longer referenced")
    ap.add_argument("--jobs", type=int, default=3)
    a = ap.parse_args()

    film = a.film.resolve()
    story_path = film / "story.js"
    if not story_path.exists():
        sys.exit(f"{story_path} not found")
    cfg_path = film / "voice.json"
    cfg = {**DEFAULTS, **(json.loads(cfg_path.read_text()) if cfg_path.exists() else {})}
    for k in ("provider", "voice", "rate", "pitch", "model", "instructions"):
        v = getattr(a, k)
        if v is not None:
            cfg[k] = v
    cfg_path.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n")

    lines = extract_lines(story_path.read_text(encoding="utf-8"))
    vo_dir = film / "vo"
    vo_json = film / "vo.json"
    if cfg["provider"] == "none":
        vo_json.write_text("{}\n")
        print(f"provider none: {len(lines)} lines will play as subtitles only")
        return
    vo_dir.mkdir(exist_ok=True)

    plan = []
    for text, scene in lines:
        say = spoken(text, cfg.get("lexicon") or {})
        cid = clip_id(cfg, say)
        plan.append((text, scene, say, cid, vo_dir / f"{cid}.mp3"))
    todo = [p for p in plan if not p[4].exists() or p[4].stat().st_size == 0]
    print(f"{len(plan)} narration lines, {len(todo)} to synthesize with {cfg['provider']}:{cfg['voice']}")

    sem = asyncio.Semaphore(max(1, a.jobs))
    done = 0

    async def one(item):
        nonlocal done
        text, scene, say, cid, path = item
        async with sem:
            tmp = path.with_suffix(".part")
            if cfg["provider"] == "edge":
                await synth_edge(cfg, say, tmp)
            else:
                await asyncio.to_thread(synth_http, cfg, say, tmp)
            tmp.replace(path)
            done += 1
            print(f"  [{done}/{len(todo)}] {cid}  {text[:70]}")

    results = await asyncio.gather(*(one(p) for p in todo), return_exceptions=True)
    failed = [(p, r) for p, r in zip(todo, results) if isinstance(r, BaseException)]
    if failed:
        for (text, *_), r in failed:
            print(f"  FAILED {r.__class__.__name__}: {text[:70]}", file=sys.stderr)
        sys.exit(f"{len(failed)} clip(s) failed; the rest are saved. Re-run to retry only the missing ones (try --jobs 1).")

    vo = {}
    total = 0.0
    for text, scene, say, cid, path in plan:
        d = duration(path)
        total += d
        vo[text] = [cid, d, scene]
    vo_json.write_text(json.dumps(vo, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    if not a.keep:
        live = {p[3] for p in plan}
        for f in vo_dir.glob("*.mp3"):
            if f.stem not in live:
                f.unlink()
        for f in vo_dir.glob("*.part"):
            f.unlink()
    size = sum(f.stat().st_size for f in vo_dir.glob("*.mp3"))
    print(f"wrote {vo_json.name}: {len(vo)} clips, {total / 60:.1f} min of voice, {size / 1e6:.1f} MB")


if __name__ == "__main__":
    asyncio.run(main())
