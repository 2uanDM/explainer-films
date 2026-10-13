# Engine API (everything story.js can use)

story.js is pasted into the engine's module script, so all of this is in scope with no imports.
`THREE` is the full three.js 0.160 namespace once the world has loaded, so use it inside `setup()` and `run()`.

## Contents
1. FILM config
2. Scene object
3. Time: the scene clock
4. Narration
5. Board (docked panel)
6. Quiz, Note, Recap, Toast, chips
7. The guide character
8. Stage: add, props, helpers
9. Camera, sky, FX, labels
10. Canvas draw recipes
11. Colors, materials, geometry helpers
12. Dev hooks

---

## 1. FILM config

```js
const FILM = {
  id: 'unique-slug',            // localStorage namespace (resume point, voice/auto prefs, quiz answers)
  title: 'Page <title> and HUD fallback',
  brand: 'Short HUD brand',     // top-left
  lang: 'en',                   // <html lang>; 'vi' for Vietnamese, and so on
  colors: { hero: 0xd97757, heroHi: 0xf2a383, heroInk: 0x1b0f0a, signal: 0x6fe3d0, gold: 0xf2c46d, violet: 0xab9cff },
  board: { title: 'lesson notes', mode: 'notes' },   // default board for every scene ('notes' | 'term')
  concepts: [['id', 'CHIP', 'Full name'], ...],      // HUD chips; scene.concept unlocks one when the scene ends
  ui: { start: 'Start ▸', ... },                     // override any UI string (full list in engine.html, `let UI = {`)
  recap: { kicker, title, lede, rows: [[chip, name, desc, hint, gold?]], challengeTitle, challenge: ['...'] },
  world() { /* optional: runs once after the 3D world exists (extra persistent props, lights) */ },
};
```

For a non-English film, translate **every** `ui` string, including `keys` (an array of `[key, description]`), `runtime` (keep the `{m}` placeholder) and `fallback`.
Example Vietnamese UI block: `references/i18n-vi.md`.

## 2. Scene object

```js
{
  id: 'slug',            // unique; also the URL hash (#slug) and the voice-clip scene key
  num: '03',             // shown in the HUD, menu and counter
  group: 'PART 1',       // timeline groups consecutive scenes with the same group
  name: 'Menu name',     // HUD + menu (plain text)
  title: 'Title<br>Card', eyebrow: 'small caps line', sub: 'italic subtitle',   // title card (HTML allowed)
  blurb: 'one line for the scene menu',
  sky: 'day',            // preset: night dawn day afternoon dusk sunset void lab forest ocean
  dur: 40,               // seconds; drives the progress bar and runtime estimate. preview.mjs tells you the real value
  chip: ['PART 1', 'Ingredients'],  // optional HUD pill
  concept: 'id',         // unlock this FILM.concepts chip when run() finishes
  board: { title, mode },// override the board for this scene
  dock: false,           // hide the board (full-width stage), e.g. title and finale scenes
  hero: true,            // big title card with call-to-action (default: Start / All scenes / Resume / sound note)
  hold: true,            // never auto-advance (title, finale)
  titleCard: false,      // skip the title card
  titleHold: 3.4,        // seconds the title card stays
  after: 1.6,            // pause after narration ends before auto-advancing
  cta: () => '<button data-go="1">…</button>',  // custom title-card buttons; data-go="i" jumps, data-menu opens the menu
  setup() { },           // build the world: synchronous, runs before the fade-in. Put props in S.* and position the camera
  async run() { },       // the performance. When it resolves, the scene is done (auto-advance waits for narration too)
}
```

Every scene starts from a clean world: the guide is reset to the origin, `W.stage` is emptied, labels/FX/tickers are cleared, `S` is emptied, the board is reset, and the camera defaults to `Cam.set([4.2, 3.2, 10.4], [0, .8, 0])`. So any scene can be the first one watched.

## 3. Time: the scene clock

The clock `D` pauses, changes speed and resets on scene change. **Never use setTimeout/setInterval in a story.**

| call | meaning |
|---|---|
| `await wait(s)` | wait s scene-seconds |
| `await until(t)` | wait until scene time t (absolute within the scene) |
| `await anim(dur, k => {...}, ease)` | tween k 0→1 over dur, eased (default `E.inOutCubic`) |
| `run(async () => {...})` | start a parallel track (don't await it) |
| `await all(p1, p2, [p3])` | wait for several |
| `const c = cue(); ... c.fire(); await c` | one track waits for another |
| `D.t` | current scene time |
| `typeOn(str, cps, show)` | typewriter helper on the clock |

Easings `E.`: linear inQuad outQuad inOutQuad inCubic outCubic inOutCubic outQuart inOutSine outSine walk inBack outBack outElastic outBounce.

Infinite loops are fine for `hold` scenes (`for (;;) { await Cam.orbit(20, 12); }`). Scene changes simply abandon them, because pending waits never resolve.

## 4. Narration

| call | meaning |
|---|---|
| `await beat('line', async () => { visuals })` | **preferred.** Starts the visuals in parallel, shows and voices the line, resolves when the clip (+0.45s) ends |
| `await N('line', hold?)` | show and voice a line; hold = minimum seconds |
| `Narr.set('line')` / `Narr.set('')` | show without waiting / clear |
| `Narr.busy()` | scene time when the current line finishes |

Lines may contain `<em>` (hero color), `<b>` (gold) and `<code>`. **Arguments must be plain string literals** (`'...'` or `"..."`) so `build_vo.py` can find them. No `${}` or concatenation. The voice clip is looked up by the line's plain text (tags stripped, entities decoded, whitespace collapsed).

Without a clip (voice off, above 2× speed, or no vo.json) a line holds for its reading time: 1.6s + 0.32s per word.

## 5. Board (docked panel)

Two looks: `notes` (serif lesson notes) and `term` (monospace terminal). Board text accepts mini markup:
`**bold**`, `*em*`, `` `code` ``, and colors `[g]green[/] [r]red[/] [b]blue[/] [v]violet[/] [t]teal[/] [y]yellow[/] [o]hero[/] [d]dim[/] [w]white[/]`.

Notes: `Board.k(kicker)`, `.h(heading)`, `.p(text)`, `.li(text, 'ok'|'bad'|'dim')`, `.step(n, text)`, `.def(term, meaning)`, `.math(html)` (trusted HTML: `H<sub>2</sub>O`, `x<sup>2</sup>`), `.quote(text)`, `.kv([[k, v], ...])`, `.hr()`, `.media(svgHtml)`, `await .write(text, {as:'p'|'li'|'h', cps})` (typewriter), `.mark(el)` (flash highlight), `.code(rows, {title})`, where rows are strings or `[text, 'add'|'del'|'mark']`.

Terminal: `await Board.type(cmd)` (typed into the input line, then echoed), `.placeholder(s)`, `.user(s)`, `.say(s)`, `.out(lines)`, `.shellLine(cwd, s)`, `const h = Board.tool(name, arg)`, then `h.ok(lines)` / `h.err(lines)` / `h.sub(lines)`, `.did(name, arg, result)`, `await Board.spin(verb, secs)` or `const s = Board.spin(verb); ... s.stop()`.

General: `Board.title(s)`, `Board.mode('notes'|'term')`, `Board.clear()`, `Board.input(true|false)`, `Board.raw(html, cls)`. Each method returns the entry element.

## 6. Quiz, Note, Recap, Toast, chips

```js
const r = await Quiz.ask({ q, choices: ['A', 'B', 'C'], answer: 1, explain: 'why', timeout: 10, kicker: 'Quick check' });
// r = { picked, correct, revealed }.  With Auto on it reveals itself after `timeout` scene-seconds;
// with Auto off it waits for a click. Narrate both outcomes with literal lines:
if (r.correct) await N('Exactly.'); else await N('The answer is B, because …');
```

- `Note.show({ title, when: 'html', rows: [[left, right], ...], kicker })` adds a takeaway card under the board. `Note.hide()`.
- `Recap.show(FILM.recap)` shows the finale panel (use it in a `hold`, `dock: false` scene). It has Watch again and All scenes buttons.
- `Toast.show(chip, name, kicker)` shows a top-center toast. `unlock(conceptId)` lights a concept chip and toasts it (automatic when a scene with `concept` ends).
- `chip('PART 2', 'detail')` sets the HUD pill (automatic from `scene.chip`).
- `Title.show({...}) / Title.hide()`, used for mid-scene captions.

## 7. The guide character

`W.guide` is the always-present mascot (tinted `FILM.colors.hero`). Extra characters: `guide({ color, scale }, x, z, ry)` (visible), or `mini(color, x, z, { scale: .46, hidden: true })`, which **starts hidden** by default so you can reveal it with `await popIn(c)`. Pass `hidden: false` for a mini that is there from the start. Remove one with `await poof(c)`.

| call | effect |
|---|---|
| `c.at(x, z, ry)` | place instantly (y stays) |
| `c.set(expr)` | neutral happy surprised worried focused thinking sad proud |
| `c.look(x, y)` | eyes, -1..1 |
| `await c.face(angle \| {x, z}, dur)` | turn |
| `await c.walk(x, z, dur?)` | turn, then walk with leg swing |
| `await c.hop(h, dur)` | squash-and-stretch hop |
| `await c.wave(n)` · `c.point(true)` · `c.typing = 1` | arm poses |
| `await c.appear()` · `await c.vanish()` | scale in/out |
| `await c.tint(color)` | recolor |
| `bubble(c, 'text', secs, 'think'\|'alert'\|'good')` | speech bubble above the head |
| `c.head` | Object3D above the head, for labels |

The guide is about 1.3 units tall; the island is 10×10 centered on the origin (x and z from -4.8 to 4.8).

## 8. Stage: add, props, helpers

`add(obj, x, y, z)` puts any Object3D on the per-scene stage (cleared on scene change). Keep handles in `S.*`.

Props (each returns a Group; userData holds its controls):

| maker | notes |
|---|---|
| `makeCard({ w, h, d, draw, res })` | slab with a canvas face; `card.userData.redraw(drawFn)` |
| `makeSign(text, { w, h, color, post })` | signpost |
| `makeWord(text, { color: '#fff', size, font, bg })` | camera-facing 3D text |
| `makeOrb(color, r)` | glowing sphere |
| `makeTank({ r, h, color })` | `userData.set(f)`, `await userData.to(f, dur)`, `userData.fill`; pair with `meterOn(tank, 'Label')` |
| `makeStack(n, { colors })` | papers/books; `userData.slabs` |
| `makeLaptop(draw?)` / `laptopAt(x, z, ry)` | screen canvas, `userData.redraw(draw)` |
| `makeBars([0..1], { colors, labels, maxH })` | `await userData.grow(dur)`, `await userData.set(values, dur)` |
| `makeTube(from, to, { h, r, color, head })` | curved glowing link; `await growTube(t)`, `showTube(t)`, `pulseTube(t, color)` |
| `makePedestal({ r, h, trim })` | display platform; `userData.top` |
| `makeRing(color, r)` | portal/cycle ring |
| `makeTree(scale)`, `lockIcon()` + `await unlockIcon(l)`, `makeStamp(text, color)` + `await slam(m, y0, y1)` | |

Motion helpers: `await grow(o)`, `await shrink(o)`, `await drop(o, y)`, `await moveTo(o, [x, y, z], dur)`, `await spinY(o, turns, dur)`, `await send(from, to, { color, r, h, dur })` (an orb flies along an arc and bursts), `tick((sdt, dt, t) => ...)` (per-frame function for this scene).

3D labels: `tag(obj, html, [dx, dy, dz], 'tag'|'tag big'|'tag warn'|'tag ok'|'tag hero'|'card3d')` returns `L` with `.set(html)`, `.show()`, `.hide()`, `.remove()`. `meterOn(obj, 'Title', off)` returns `{ set(f) }`. Labels are clamped to the stage area left of the board.

Write your own `make*` functions in story.js for topic-specific props (see `props-cookbook.md`).

## 9. Camera, sky, FX

- `Cam.set(pos, look)`, `await Cam.to(pos, look, dur, ease)`, `await Cam.orbit(deg, dur)`, `Cam.shake(k)`, `Cam.drift = 0..1` (idle sway).
- `await sky('dusk', 2)` cross-fades the lighting preset.
- `FX.burst(pos, { n, colors, speed, up, size })`, `FX.spark(pos, color)`, `await FX.ring(pos, color, { r1, dur })`, `await FX.fly(obj, from, to, { h, dur, color, trail })`.
- `W.island`, `W.deco` (background trees/rocks; set `.visible = false` for a cleaner stage), `W.key`, `W.rim`, `W.hemi` (lights), `W.scene`, `W.camera`.

The camera's view is offset so the subject sits in the stage area left of the board; aim `look` at the subject and it will be framed there. On phones the stage is a shorter band above the board, so check `matchMedia('(max-width: 900px)').matches` in `setup()` to pick a closer shot when needed.

## 10. Canvas draw recipes (for makeCard faces and laptop screens)

`cardDraw({ kicker, title, lines: ['text' | ['text', '#color']], accent, bg, fg, num, done })`, `codeDraw([[text, color], ...], { title, hl: { rowIndex: 'rgba(...)' } })`, `bigDraw('42%', { sub })`, `stampDraw(text, color)`. A draw function is `(ctx, w, h) => {}`. Use `FONT_D` (display), `FONT_M` (mono) and `FONT_N` (serif) for font families, and `rr(ctx, x, y, w, h, r)` for rounded rectangles.

## 11. Colors, materials, geometry

Colors (numbers): `HERO CREAM SIGNAL GOLD VIOLET OKC BAD SKYBLUE`. `css(0xff0000)` gives `'#ff0000'`.
Materials: `std(color, { rough, metal, emissive, ei, transparent, opacity })`, `glow(color, k)` (unlit and blooms), `sglow(color, k)` (shared, cached), `MAT.{eye, gold, dark, slate, slate2, cream, wood, leaf, leaf2, rock, glass}`.
Geometry (cached): `rbox(w, h, d, radius)`, `box(w, h, d)`, `sphere(r)`, `cyl(rTop, rBottom, h)`, `cone(r, h)`, `torus(r, tube, rs, ts, arc)`. Use `mesh(geo, mat, { x, y, z, parent, cast, recv })`, `V(x, y, z)` and `toV([x, y, z])`.
CSS custom properties for extra styling (style.css next to story.js): `--hero --hero-hi --signal --gold --cream --mist --ok --bad --f-display --f-narr --f-mono`.

## 12. Dev hooks (index.html?dev)

`goScene(id, t?)`, `seek(t)` (fast-forwards the clock deterministically, then pauses), `sceneInfo()`, plus `S W Cam D Narr Voice Show SCENES VO setSpeed setVoice setAuto` on `window`. The console warns about any narration line without a clip and logs each scene's real end time. `scripts/preview.mjs` drives these.
