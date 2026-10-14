# Props and scene cookbook

Copy and adapt. Every recipe uses only engine helpers (see engine-api.md). Define `make*` functions at the top of story.js and call them inside `setup()`.

## Contents
- Orbiting system (atom, solar system, cell)
- Process line (stages a thing travels through)
- Timeline (history, versions)
- Network / graph (nodes and links)
- Before/after comparison
- Code / terminal scene (programming, CLI tools)
- Math on the board + a 3D graph
- Crowd of workers (parallelism, roles)
- Map-ish ground plan
- Spectacle beats

---

### Orbiting system (atom, solar system, cell)

```js
function makeAtom({ core = GOLD, electron = SIGNAL, shells = [[.9, 2], [1.5, 6]] } = {}) {
  const g = new THREE.Group();
  g.add(makeOrb(core, .28));
  const es = [];
  shells.forEach(([r, n], si) => {
    const ring = mesh(torus(r, .008, 4, 96), glow(electron, .9, { transparent: true, opacity: .45 }), { parent: g, cast: false });
    ring.rotation.x = Math.PI / 2 + si * .5;
    for (let i = 0; i < n; i++) { const e = makeOrb(electron, .07); g.add(e); es.push({ e, r, a: i / n * Math.PI * 2, tilt: si * .5, speed: 1.4 - si * .4 }); }
  });
  g.userData.tick = (sdt) => es.forEach(o => { o.a += sdt * o.speed; const x = Math.cos(o.a) * o.r, z = Math.sin(o.a) * o.r; o.e.position.set(x, -z * Math.sin(o.tilt), z * Math.cos(o.tilt)); });
  return g;
}
// setup(): S.atom = add(makeAtom(), 0, 1.6, -.5); tick(sdt => S.atom.userData.tick(sdt));
```

### Process line (stages a thing travels through)

```js
// setup()
S.stages = ['Collect', 'Clean', 'Train', 'Test'].map((name, i) => {
  const p = add(makePedestal({ r: .55, trim: [SIGNAL, GOLD, VIOLET, HERO][i] }), -3 + i * 2, 0, -.4);
  tag(p, esc(name), [0, .9, 0], 'tag');
  return p;
});
S.item = add(makeOrb(CREAM, .16), -3, .6, -.4);
// run(): move the item along, one beat per stage
for (let i = 1; i < S.stages.length; i++) await beat(LINES[i], async () => { await FX.fly(S.item, S.item.position.clone(), [-3 + i * 2, .6, -.4], { h: .8, dur: 1 }); FX.ring([-3 + i * 2, .3, -.4], SIGNAL); });
```
(`LINES[i]` must still be literal strings in the source for voicing. Write the beats out one by one rather than looping over an array of narration.)

### Timeline (history, versions)

```js
function makeTimeline(events, { from = -4, to = 4, z = .8 } = {}) {   // events: [[label, year]]
  const g = new THREE.Group();
  mesh(box(to - from, .03, .06), sglow(0x3b5aa8, 1.4), { x: (from + to) / 2, y: .03, z, parent: g, cast: false });
  g.userData.marks = events.map(([label, year], i) => {
    const x = from + (to - from) * (i / Math.max(1, events.length - 1));
    const m = mesh(cyl(.07, .07, .3, 12), glow(GOLD, 1.6), { x, y: .15, z, parent: g, cast: false });
    m.visible = false; m.userData.label = `${label} · ${year}`;
    return m;
  });
  return g;
}
// run(): const m = S.tl.userData.marks[0]; await grow(m); tag(m, `<b>${esc(m.userData.label)}</b>`, [0, .5, 0], 'tag big'); chip('1776', 'Independence');
```

### Network / graph

```js
// setup()
S.nodes = [[-2.5, 1.2, -1], [0, 2.2, -1.5], [2.5, 1.2, -1], [0, .6, .5]].map((p, i) => add(makeOrb([SIGNAL, GOLD, VIOLET, HERO][i], .22), ...p));
S.links = [[0, 1], [1, 2], [2, 3], [3, 0], [1, 3]].map(([a, b]) => add(makeTube(S.nodes[a].position, S.nodes[b].position, { h: .4, r: .02, color: 0x6f8cff, k: 1.2 })));
// run(): for (const t of S.links) { growTube(t, .6); await wait(.25); }  later: pulseTube(S.links[0], GOLD)
```

### Before/after comparison

```js
// setup(): two characters and two cards, a sign between them
S.before = guide({ color: 0x8d93a9, scale: .8 }, -2.6, .3, .4); S.before.set('worried');
S.after  = guide({ color: HERO, scale: .8 }, 2.6, .3, -.4);     S.after.set('happy');
S.cardA = add(makeCard({ w: 1.8, h: 1.1, draw: cardDraw({ kicker: 'Before', title: '3 hours', lines: ['manual copy-paste'] }) }), -2.6, 0, -1.2);
S.cardB = add(makeCard({ w: 1.8, h: 1.1, draw: cardDraw({ kicker: 'After', title: '4 minutes', lines: ['one script'], done: true }) }), 2.6, 0, -1.2);
```

### Code / terminal scene

```js
{ id: 'git', board: { title: '~/project — bash', mode: 'term' }, /* … */
  async run() {
    await beat('First, we check what changed.', async () => { await Board.type('git status'); Board.out(['On branch main', '[r]modified:   app.js[/]']); });
    await beat('Then we stage it and commit with a message.', async () => {
      await Board.type('git add app.js && git commit -m "Fix login"');
      const h = Board.tool('git', 'commit'); await wait(.8); h.ok('[main 3f2a1c9] Fix login · 1 file changed');
    });
    Board.code(['function login(user) {', ['  if (!user) return null;', 'add'], ['  return user.name', 'del'], '}'], { title: 'app.js' });
  } }
```
Mirror the code in 3D with a `makeLaptop(codeDraw(rows, { title }))` in front of the guide (`laptopAt(x, z)`, `c.typing = 1`).

### Math on the board + a 3D graph

```js
Board.math('a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup>');
// a parabola as a tube through points:
const pts = []; for (let x = -2; x <= 2; x += .1) pts.push(V(x, .2 + x * x * .45, 0));
const curve = new THREE.CatmullRomCurve3(pts);
const t = add(new THREE.Mesh(new THREE.TubeGeometry(curve, 120, .03, 8), glow(SIGNAL, 1.8)));
t.userData.curve = curve; t.geometry.setDrawRange(0, 0); await growTube(t, 1.6);
```

### Crowd of workers (parallelism, roles)

```js
S.crew = [[-2, -1, SIGNAL], [0, -1.6, GOLD], [2, -1, VIOLET]].map(([x, z, col]) => mini(col, x, z, { scale: .5 }));
for (const c of S.crew) { await popIn(c); laptopAt(c.root.position.x, c.root.position.z + .5); c.typing = 1; }
bubble(S.crew[1], 'Done!', 2, 'good');
```

### Map-ish ground plan

Hide the decoration and draw on a big flat card lying on the island:
```js
W.deco.visible = false;
const map = add(makeCard({ w: 8, h: 5, d: .02, res: 2048, draw: (c, w, h) => { c.fillStyle = '#16233f'; c.fillRect(0, 0, w, h); /* draw regions, rivers, labels */ } }), 0, 0, 0);
map.rotation.x = -Math.PI / 2; map.position.set(0, .02, 2.5);
```

### Spectacle beats (use sparingly, one per scene)

- Arrival: `await drop(obj, 0)` + `Cam.shake(.2)` + `FX.burst(pos)`.
- Approval stamp: `const st = add(makeStamp('PASSED')); st.position.set(0, 3, 0); await slam(st, 3, 1.2);`
- Unlock: `const l = add(lockIcon(), x, 1.5, z); await unlockIcon(l);`
- Reveal: `await Cam.orbit(30, 4)` around the finished diorama while the last line plays.
- Mood shift: `await sky('dusk', 3)` as the story turns.

### Replicating a real CLI or app (capture it first)

When the film teaches a real tool, make the board look like that tool. Capture the real thing doing the film's own task, then copy it:

```bash
tmux new-session -d -s cap -x 150 -y 46 -c <scratch-repo> "<tool command>"
tmux send-keys -t cap "<input>" Enter; sleep 5
tmux capture-pane -t cap -e -p > frame.ansi     # -e keeps colors; repeat while it works
```

Read the frames for the layout (prefixes such as `•`, `└`, `›`, menus and status lines), and pull the truecolor codes (`\x1b[38;2;R;G;Bm`) for the palette. Write the findings to a reference file in the film folder, because scratch captures don't survive a reboot. Then:
- add a skin class to the board in `FILM.world()` (`Board.el.classList.add('cx')`) and style it in the film's `style.css`
- write small helpers in story.js that emit the tool's line types with `Board.raw(html, cls)`
- put the tool's status bar in `Board.footer(html)`

Use the captured wording for real menus and messages. Run the tool in a throwaway repo, and check its effective permissions (e.g. a `/status` screen) before letting it act.
