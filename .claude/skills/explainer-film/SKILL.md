---
name: explainer-film
description: Build narrated, interactive learning videos ("explainer films") as a web page with a 3D diorama and mascot, subtitles, a pre-recorded narrator voice, a lesson-notes or terminal panel, quizzes, a recap and player controls, then publish it (claude.ai Artifact in Claude, Sites in Codex, or any static host). Use it whenever the user wants a learning video, explainer, animated or narrated lesson, training module, course chapter, tutorial film or "a video like this" on any subject and in any language (including Vietnamese), even if they only say "video". Also use it to edit, re-voice, translate or extend such a film.
---

# Explainer films

A film is one HTML page: a three.js stage on the left where a mascot acts out the idea, a docked **board** on the right that fills with lesson notes (or a terminal), subtitles in the lower left, and a narrator voice made of one pre-recorded MP3 per line. Scenes are short async scripts on a pausable clock, so the viewer can pause, scrub scenes, change speed, mute the voice or jump anywhere. It ships as a static site, `index.html` plus `vo/*.mp3`, published as a claude.ai Artifact (Claude), a Site (Codex) or on any static host.

The same folder works in **Claude Code** (`~/.claude/skills/`) and **Codex** (`~/.agents/skills/`); only the publish step differs.

Everything reusable is already built:

| path | what |
|---|---|
| `assets/engine.html` | the player engine: clock, narration and voice sync, board, quiz, recap, guide character, props, camera, FX, UI, mobile layout. **Don't edit it per film.** |
| `assets/story-starter.js` | a complete five-scene example film (photosynthesis): the starting point for every new story.js |
| `scripts/new_film.py` | scaffold a film folder |
| `scripts/build_vo.py` | synthesize narration clips, write vo.json (run with `uv run`) |
| `scripts/build.py` | inline story + voice map into index.html, lint, syntax-check, write publish.json; `--dist <dir>` exports a hostable folder |
| `scripts/preview.mjs` | headless Chrome check: screenshots per scene, console errors, real scene lengths |
| `references/storyboarding.md` | how to structure and write a film that teaches. **Read before writing a script** |
| `references/engine-api.md` | every helper story.js can call. **Read before writing story.js** |
| `references/props-cookbook.md` | ready-made visual recipes (atoms, timelines, networks, terminals, graphs…) |
| `references/voices.md` | TTS providers, voices per language, pronunciation lexicon |
| `references/i18n-vi.md` | full Vietnamese UI block; pattern for any language |

`<skill>` below means this skill's directory.

## Workflow

### 1. Pin down the brief (briefly)
You need the topic, audience (kids / students / professionals / team), language, length (default 4–6 minutes, 5–7 scenes) and voice. Infer what you can and pick sensible defaults: an English film uses `en-US-AndrewMultilingualNeural`, a Vietnamese one `vi-VN-HoaiMyNeural`. Ask only about what you can't infer, in one round. If the user supplied source material (notes, a doc, a syllabus), the film should teach *that* content, accurately.

### 2. Storyboard
Read `references/storyboarding.md`. Write the storyboard (scene list, one idea per scene, the visual metaphor, the board entries, the narration lines, one quiz, the recap). For long or ambiguous topics, show it to the user before building. For a clear request, go straight on.

Get the facts right: this is learning material. If you're unsure of a fact, check it or leave it out.

### 3. Scaffold and write story.js
```bash
python3 <skill>/scripts/new_film.py films/<slug> --voice <voice-id>
```
Rewrite `films/<slug>/story.js` from the starter: the FILM config (id, title, brand, lang, colors, concepts, recap, `ui` for non-English) and SCENES. Read `references/engine-api.md` first; borrow visuals from `references/props-cookbook.md`.

Rules that keep it working:
- Narration only through `beat('literal', async () => {...})`, `N('literal')` or `Narr.set('literal')`, using plain string literals. build_vo.py finds lines by reading the source, so template literals, variables and concatenation don't get a voice.
- Prefer `beat()` so each visual starts with the line that explains it; use `until()` only for the opening delay.
- Time only through `wait/until/anim`. setTimeout breaks pause, speed and seeking.
- `setup()` is synchronous and builds the whole scene, so every scene works as a starting point. Keep handles in `S.*`.
- Read colors and `THREE` inside `setup()`/`run()`, not at the top level.
- First scene: `hero: true, hold: true, dock: false`. Last: `hold: true, dock: false, titleCard: false` with `Recap.show()`.
- Optional `style.css` next to story.js for extra CSS.

### 4. Voice, build, preview
```bash
uv run <skill>/scripts/build_vo.py films/<slug>          # synthesizes only new or changed lines
python3 <skill>/scripts/build.py films/<slug>            # → index.html + publish.json, fails on errors
node <skill>/scripts/preview.mjs films/<slug>            # screenshots + timing + console errors
```
Then **look at the screenshots** (Read the PNGs) and fix what you see: subject out of frame, labels overlapping the board, empty stage, unreadable text. Fix every console error and timing warning (set each scene's `dur` to the reported length). Run `--mobile` once for the phone layout; there, the transport bar appears mid-page in the full-page screenshot, which is expected. Iterate until it's clean. A film that hasn't been previewed isn't finished.

If edge-tts keeps failing (throttling), rerun with `--jobs 1`; finished clips are kept. With no network for TTS, run `python3 <skill>/scripts/build_vo.py films/<slug> --provider none` (plain python3, no uv download; subtitles only) and say so.

If no browser can run (a sandbox blocks it, or Chrome isn't installed), build.py still lints and estimates each scene's narration time. Use that for `dur`, and tell the user the visuals weren't screenshot-checked.

The page loads three.js from jsDelivr and fonts from Google Fonts, so viewers need internet. Without it, the board, subtitles and voice still play, and the stage shows a fallback note.

### 5. Publish
Pick the route for the agent you are running in. Each film is a static site: `index.html` plus `vo/*.mp3`.

**Claude (claude.ai Artifact tool available):** load the `artifact-design` skill if the Artifact tool asks for it (the engine already meets the page contract: dark theme, title, scripts only from jsDelivr, Google Fonts, 16px gutters on phones). Then call the Artifact tool with:
- `file_path`: `films/<slug>/index.html`
- `files`: the map in `films/<slug>/publish.json` (`{"vo/<id>.mp3": "<path>"}`)
- `icon`: e.g. `film`; `description`: one sentence about what the film teaches.

Source files must be inside the working directory or the scratchpad. More than 250 clips: publish in batches to the same URL. To update, republish **the same file path** (same URL) with the changed clips.

**Codex (`sites` skill available):** it's a buildless HTML site. Export it with `python3 <skill>/scripts/build.py films/<slug> --dist <site-project>/dist`, then follow the `sites` skill for a new Site (buildless HTML/JS: `dist/` holds index.html and assets, `.openai/hosting.json` gets `"static": {"directory": "dist"}`, packaging uses `commands: []`). New Sites start private. To update, rebuild into the same `dist/` and publish a new version of the same Site.

**Neither available:** `build.py --dist <dir>` gives a folder that any static host serves as-is (GitHub Pages, Cloudflare Pages, Netlify, an S3 bucket). To watch locally, serve it over http (`python3 -m http.server -d <dir>`) rather than opening the file directly.

**Sandboxes:** build_vo.py needs network access (TTS), and preview.mjs needs to launch Chrome. In a sandboxed agent (e.g. Codex `workspace-write` without network), request approval or escalation for those two commands; don't skip the preview silently.

### 6. Hand over
Give the link (or the local folder) and a short summary: scenes, runtime, voice, what the quiz checks. Mention that changes are one sentence away: another voice or language, a new scene, a different mascot color.

## Adapting the template

- **Coding or CLI topics:** set `board: { mode: 'term' }` and use `Board.type/tool/out/code`; a laptop in front of the guide with `c.typing = 1`.
- **Kids:** warmer sky presets (`dawn`, `day`, `forest`), more character emotion, shorter lines, a slower voice rate, simpler quizzes.
- **Corporate or onboarding:** a story arc with a character over a week or a project (`chip: ['MON', '09:04']`), concept chips for each skill, a recap with "when to use what" rows and a team challenge.
- **Series:** one folder per chapter with distinct `FILM.id`s; reuse custom props by copying functions between story.js files.
- **Translating a film:** copy the folder, translate narration, board text, titles, blurbs, quiz and recap, add the `ui` block, pick a native voice, then rebuild.

Don't fork engine.html for one film. If a film genuinely needs a new engine capability, add it to `assets/engine.html` generically (and to engine-api.md) so every future film gets it.
