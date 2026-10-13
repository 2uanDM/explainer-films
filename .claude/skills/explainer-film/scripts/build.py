#!/usr/bin/env python3
"""Assemble <film-dir>/index.html from the engine template, story.js and vo.json, and lint the story.

    python3 <skill>/scripts/build.py <film-dir>

Inputs (in <film-dir>):  story.js (required), vo.json (optional), style.css (optional extra CSS)
Outputs:                 index.html, publish.json (the `files` map for the Artifact publish call)

Checks: required globals, duplicate scene ids, narration without a voice clip, template-literal
narration, setTimeout/setInterval in the story, and a JavaScript syntax check with node when available.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_vo import extract_lines  # noqa: E402  (pure-python helper, no third-party deps)


def field(src: str, name: str) -> str | None:
    m = re.search(r"const\s+FILM\s*=\s*\{", src)
    if not m:
        return None
    m2 = re.search(r"\b" + name + r"""\s*:\s*(['"])((?:\\.|(?!\1).)*)\1""", src[m.end():])
    return m2.group(2) if m2 else None


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film", type=Path)
    ap.add_argument("--template", type=Path, default=SKILL / "assets" / "engine.html")
    ap.add_argument("--out", type=Path, help="default <film-dir>/index.html")
    ap.add_argument("--dist", type=Path, help="also copy index.html + vo/*.mp3 into this folder (a ready-to-host static site, e.g. a Codex Sites dist/)")
    a = ap.parse_args()

    film = a.film.resolve()
    story = (film / "story.js").read_text(encoding="utf-8")
    tpl = a.template.read_text(encoding="utf-8")
    vo_path = film / "vo.json"
    vo = json.loads(vo_path.read_text(encoding="utf-8")) if vo_path.exists() else {}
    extra_css = (film / "style.css").read_text(encoding="utf-8") if (film / "style.css").exists() else ""

    errors, warns = [], []
    for g in ("const FILM", "const SCENES"):
        if g not in story:
            errors.append(f"story.js must define `{g} = ...`")
    scenes_src = story[story.find("const SCENES"):] if "const SCENES" in story else story
    ids = re.findall(r"""\bid\s*:\s*['"]([\w-]+)['"]""", scenes_src)
    dup = sorted({i for i in ids if ids.count(i) > 1})
    if dup:
        errors.append(f"duplicate scene ids: {', '.join(dup)}")
    if re.search(r"\b(setTimeout|setInterval)\s*\(", story):
        warns.append("story uses setTimeout/setInterval; use wait()/until()/anim() so pause, speed and scene jumps stay in sync")
    if re.search(r"\b(?:N|beat|Narr\.set)\(\s*`", story):
        warns.append("narration with a `template literal` cannot be voiced; use a plain '...' string")
    lines = extract_lines(story)
    if vo:
        missing = [t for t, _ in lines if t not in vo]
        if missing:
            warns.append(f"{len(missing)} narration line(s) have no clip yet; run build_vo.py. First: {missing[0][:80]!r}")
        stale = [t for t in vo if t not in {x for x, _ in lines}]
        if stale:
            warns.append(f"{len(stale)} clip(s) in vo.json no longer match a line (re-run build_vo.py to prune)")
        for t, (cid, _, _) in vo.items():
            if not (film / "vo" / f"{cid}.mp3").exists():
                errors.append(f"vo/{cid}.mp3 is missing (line {t[:60]!r})")
                break

    # estimated narration time per scene (clip length + 0.45s, or reading time without a clip), vs. its dur
    durs = dict(re.findall(r"""\bid\s*:\s*['"]([\w-]+)['"][^{}]*?\bdur\s*:\s*(\d+(?:\.\d+)?)""", scenes_src))
    est = {}
    for t, sc in lines:
        sec = vo[t][1] + .45 if t in vo else 1.6 + len(t.split()) * .32
        est[sc] = est.get(sc, 0) + sec
    for sc, sec in est.items():
        d = float(durs.get(sc, 0) or 0)
        if d and sec > d + 1:
            warns.append(f"scene {sc}: narration alone takes about {sec:.0f}s but dur is {d:.0f}s (raise dur; preview.mjs gives the exact length)")

    title = field(story, "title") or "Explainer"
    lang = field(story, "lang") or "en"
    title_plain = re.sub(r"<[^>]+>", " ", title)
    out = tpl.replace("__TITLE__", html.escape(re.sub(r"\s+", " ", title_plain).strip()))
    out = out.replace("__LANG__", html.escape(lang))
    out = out.replace("/*__VO__*/", "const VO = " + json.dumps(vo, ensure_ascii=False) + ";")
    out = out.replace("/*__STYLE__*/", extra_css)
    out = out.replace("/*__STORY__*/", story)

    # syntax check of the module script
    node = shutil.which("node")
    if node:
        js = out.split('<script type="module">', 1)[1].rsplit("</script>", 1)[0]
        with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False, encoding="utf-8") as f:
            f.write(js)
            tmp = f.name
        r = subprocess.run([node, "--check", tmp], capture_output=True, text=True)
        Path(tmp).unlink(missing_ok=True)
        if r.returncode:
            msg = r.stderr.strip()
            m = re.search(r":(\d+)\n", msg)
            if m:  # map the line back to story.js when the error is inside the story
                ln = int(m.group(1))
                start = js[: js.find(story)].count("\n") + 1 if story in js else None
                if start and start <= ln < start + story.count("\n") + 1:
                    msg += f"\n(story.js line {ln - start + 1})"
            errors.append("JavaScript syntax error:\n" + msg)
    else:
        warns.append("node not found; skipped the JavaScript syntax check")

    for w in warns:
        print("warning:", w)
    if errors:
        for e in errors:
            print("error:", e)
        sys.exit(1)

    dest = a.out or film / "index.html"
    dest.write_text(out, encoding="utf-8")
    files = {f"vo/{cid}.mp3": str((film / "vo" / f"{cid}.mp3")) for cid, _, _ in vo.values()}
    # portable: paths relative to the film folder, which is passed as the Artifact `root`
    try:
        root = str(film.relative_to(Path.cwd()))
    except ValueError:
        root = str(film)
    rel = {k: k for k in files}
    (film / "publish.json").write_text(json.dumps({"root": root, "file_path": f"{root}/{dest.name}" if dest.parent == film else str(dest), "files": rel}, indent=1) + "\n")
    n_scenes = len(ids)
    secs = sum(v[1] for v in vo.values())
    size = dest.stat().st_size + sum(Path(p).stat().st_size for p in files.values())
    print(f"built {dest} · {n_scenes} scenes · {len(lines)} narration lines · {len(files)} clips ({secs / 60:.1f} min) · {size / 1e6:.1f} MB total")
    if a.dist:
        d = a.dist.resolve()
        (d / "vo").mkdir(parents=True, exist_ok=True)
        shutil.copy(dest, d / "index.html")
        keep = set()
        for rel, src in files.items():
            shutil.copy(src, d / rel)
            keep.add(Path(rel).name)
        for f in (d / "vo").glob("*.mp3"):
            if f.name not in keep:
                f.unlink()
        print(f"static site ready in {d} (index.html + {len(files)} clips)")
    if len(files) > 250:
        print("note: more than 250 clips; publish in batches (one publish carries at most 255 files)")


if __name__ == "__main__":
    main()
