/* ============================================================
   story.js — "Codex, Fully Loaded": the features that turn a Codex chat into a crew.
   One week with the team's Codex on an app called "shop".
   Facts follow films/codex-features/BRIEF.md (verified 2026-10-14, Codex CLI 0.160).
   Narration goes through beat()/N()/Narr.set() with plain string literals only.
   ============================================================ */

const FILM = {
  id: 'codex-features',
  title: 'Codex, Fully Loaded',
  brand: 'Codex Crew',
  lang: 'en',
  colors: { hero: 0x6c8cff, heroHi: 0xa9bbff, heroInk: 0x0b1030 },
  board: { title: '~/shop — codex', mode: 'term' },
  concepts: [
    ['rules', 'RULE', 'House rules: AGENTS.md and skills'],
    ['sandbox', 'BOX', 'Sandbox, approvals and review'],
    ['crew', 'CREW', 'Subagents and worktrees'],
    ['longhaul', 'GOAL', 'Goals, cloud tasks and PR reviews'],
    ['plugin', 'PLUG', 'MCP, plugins, hooks and headless runs'],
  ],
  recap: {
    title: 'Codex, fully loaded',
    lede: 'Rules it remembers, a sandbox that fits the job, a crew in parallel, a finish line, and your own tools wired in. As of Codex CLI 0.160, October 2026. The row in <b>gold</b> is the habit to keep.',
    rows: [
      ['RULE', 'House rules', '/init writes AGENTS.md; root first, so the closest file wins (32 KiB cap). Skills: SKILL.md folders, loaded only when needed', '/init · $skill-name'],
      ['BOX', 'Sandbox', 'read-only, workspace-write or danger-full-access; switch with /permissions. Check /diff and /review before committing; --yolo only on throwaway machines', '-s workspace-write', 1],
      ['CREW', 'Many hands', 'Ask for subagents in plain words (more tokens); custom agents in .codex/agents/*.toml; one worktree per task', 'codex --worktree'],
      ['GOAL', 'Long haul', 'A checkable /goal; remote tasks with codex cloud exec; @codex review on a PR', '/goal · codex apply'],
      ['PLUG', 'Plug it in', 'codex mcp add for tools, /plugins from a marketplace, /hooks at fixed moments, headless runs for CI', 'codex exec --json'],
    ],
    challengeTitle: 'Team challenge',
    challenge: [
      'Run /init in your repo, then add the one rule your team keeps repeating in chat.',
      'Turn a workflow you do every week into a skill, and call it with $ and its name.',
      'Add a PreToolUse hook that blocks one command you never want Codex to run.',
    ],
  },
};

/* ---------- helpers for this film ---------- */
const narrowView = () => matchMedia('(max-width: 900px)').matches;
// a mini guide standing on a pedestal (y = pedestal top)
function miniOn(color, x, z, y = .3) { const m = mini(color, x, z, { scale: .5, ry: Math.PI / 2 }); m.root.position.y = y; return m; }
// laptop beside a character that faces +x (ry = PI/2), screen turned toward it, so neither hides the other
function lapOn(x, z, y = .3) { const l = laptopAt(x + .42, z, -Math.PI / 2); l.position.y = y; return l; }

const SCENES = [
/* ======================= 00 · title ======================= */
{
  id: 'start', num: '00', group: 'INTRO', hero: true, hold: true, dock: false, sky: 'dusk', dur: 30,
  name: 'Codex, Fully Loaded',
  title: 'Codex,<br>Fully Loaded', eyebrow: 'A six-minute film for teams who already chat with Codex',
  sub: 'Rules, sandboxes, parallel agents, goals, cloud and hooks: the features that turn a chat into a crew.',
  blurb: 'One week, one app, and the features that turn a chat into a crew.',
  setup() {
    const c = W.guide; c.at(-1.1, .3, .35); c.set('focused'); c.typing = 1;
    S.lap = laptopAt(-1.1 + .26, .3 + .5, Math.PI + .35);
    S.crew = [[1, -1.1, 0x6fe3d0], [2.1, -.2, 0xf2c46d], [1.3, .9, 0xab9cff]].map(([x, z, col]) => { const m = mini(col, x, z, { scale: .42, hidden: false, ry: Math.PI / 2 }); m.typing = 1; lapOn(x - .04, z, 0); return m; });
    if (narrowView()) Cam.set([4.6, 2.3, 7.2], [.3, .4, 0]);
    else Cam.set([3.6, 2, 8], [-1.2, .9, 0]);
  },
  async run() {
    Narr.set('');
    run(async () => { for (;;) { await wait(rand(3, 5)); W.guide.typing = 0; W.guide.look(.5, .3); await wait(1.4); W.guide.look(0, 0); W.guide.typing = 1; } });
    for (;;) { await Cam.orbit(-18, 12); await Cam.orbit(18, 12); }
  },
},

/* ======================= 01 · house rules ======================= */
{
  id: 'rules', num: '01', group: 'MONDAY', chip: ['MON', '09:04'], sky: 'dawn', dur: 65, concept: 'rules',
  name: 'House Rules', title: 'House Rules', eyebrow: 'Part 1 · Monday', sub: 'Tell Codex once, not every morning.',
  blurb: '/init writes AGENTS.md, the closest file wins, and skills hold your workflows.',
  setup() {
    const c = W.guide; c.at(-2.6, .9, .45);
    S.card = add(makeCard({ w: 1.7, h: 1.25, draw: cardDraw({ kicker: 'shop/', title: 'AGENTS.md', lines: ['build: npm run build', 'test: npm test', 'never edit vendor/'], tSize: 84, lSize: 46 }) }), -.2, 0, -.9);
    S.card.visible = false;
    S.sub = add(makeCard({ w: 1.15, h: .85, draw: cardDraw({ kicker: 'shop/web/', title: 'AGENTS.md', lines: ['closest file wins'], tSize: 92, lSize: 54 }) }), 1.55, 0, -.35);
    S.sub.rotation.y = -.25; S.sub.visible = false;
    S.books = add(makeStack(5, { colors: [HERO, SIGNAL, GOLD] }), 2.7, 0, .7);
    S.books.scale.setScalar(.001); S.books.visible = false;
    if (narrowView()) Cam.set([1, 3.8, 12.8], [-.4, .9, -.2]);
    else Cam.set([1.8, 3.4, 11.6], [-.3, 1, -.2]);
  },
  async run() {
    const c = W.guide;
    await until(2.4);
    await beat('Monday. The team opens Codex on the shop app, and it knows nothing about the project yet.', async () => {
      c.set('thinking'); bubble(c, 'Which test command?', 2.6, 'think');
      Board.say('Monday: Codex meets the [o]shop[/] repo');
    });
    await beat('Type <code>/init</code>, and Codex writes a starter <em>AGENTS.md</em> for the repo.', async () => {
      await Board.type('/init');
      const h = Board.tool('Write', 'AGENTS.md');
      drop(S.card, 0); await wait(.5); Cam.shake(.12);
      FX.burst([-.2, .3, -.9], { n: 14 });
      tag(S.card, '<span class="dot" style="color:var(--hero)"></span>AGENTS.md', [0, 1.55, 0], 'tag big');
      h.ok('[g]Wrote[/] AGENTS.md · build, test and style rules');
      c.set('happy');
    });
    await beat('It holds your standing rules: how to build, how to test, and what never to touch.', async () => {
      Board.code(['# AGENTS.md', '- Build with [t]npm run build[/]', '- Run [t]npm test[/] before you finish', ['- Never edit vendor/', 'mark']], { title: 'shop/AGENTS.md' });
    });
    await beat('Codex reads a global file in your home folder first, then one per folder from the Git root down to where you are.', async () => {
      drop(S.sub, 0); await wait(.5);
      tag(S.sub, 'shop/web/', [0, 1.15, 0], 'tag');
      Board.out(['[d]1[/] ~/.codex/AGENTS.md  [d](or AGENTS.override.md)[/]', '[d]2[/] shop/AGENTS.md', '[d]3[/] shop/web/AGENTS.md  [d]← you are here[/]']);
      c.look(.5, .2);
    });
    await beat('They are joined root first, so the closest file wins. Together they are capped at 32 KiB.', async () => {
      FX.ring([1.55, .05, -.35], HERO, { r1: 1.2 });
      Board.out(['joined root first → [o]closest file wins[/] · cap [y]32 KiB[/]']);
    });
    await beat('For a workflow you repeat, write a <em>skill</em>: a folder with a SKILL.md that has a name and a description.', async () => {
      c.set('focused');
      await grow(S.books, .6);
      tag(S.books, 'skills', [0, .75, 0], 'tag');
      Board.code(['---', 'name: [t]release-notes[/]', 'description: Draft release notes from merged PRs', '---'], { title: '.agents/skills/release-notes/SKILL.md' });
    });
    await beat('Team skills live in the repo under .agents/skills, and personal ones under the same folder in your home.', async () => {
      Board.out(['repo  [t].agents/skills/[/]', 'user  [t]~/.agents/skills/[/]']);
      spinY(S.books, .5, 1.2);
    });
    await beat('Call one with a dollar sign and its name, like <code>$release-notes</code>, or pick it from <code>/skills</code>.', async () => {
      tag(S.books, '<b>$release-notes</b>', [0, 1.15, 0], 'tag hero');
      await Board.type('$release-notes for this week');
      send([2.7, .6, .7], [-2.6, 1.2, .9], { color: GOLD, h: 1.2 });
      Board.did('Skill', 'release-notes', '[g]loaded[/] · SKILL.md');
    });
    await beat('A skill loads only when it is needed, so a big library stays cheap.', async () => {
      c.set('proud'); c.hop(.3, .42);
      if (!narrowView()) Cam.to([1.6, 3, 10.4], [-.3, .9, -.1], 4, E.inOutSine);
    });
    await wait(1.2);
  },
},

/* ======================= 02 · sandbox ======================= */
{
  id: 'sandbox', num: '02', group: 'TUESDAY', chip: ['TUE', '10:30'], sky: 'day', dur: 63, concept: 'sandbox',
  name: 'The Sandbox', title: 'The Sandbox', eyebrow: 'Part 2 · Tuesday', sub: 'How far may Codex act?',
  blurb: 'Three sandbox modes, /permissions, auto-review, and checking the diff before you commit.',
  setup() {
    const c = W.guide; c.at(-3.5, 1.3, .6);
    S.peds = [[-2.4, OKC, 'read-only'], [0, SIGNAL, 'workspace-write'], [2.4, BAD, 'danger-full-access']].map(([x, trim, name], i) => {
      const p = add(makePedestal({ r: .75, trim }), x, 0, -.5);
      tag(p, name, [0, narrowView() && i === 1 ? 2 : .3, 1.05], i === 2 ? 'tag warn' : 'tag');   // phones: lift the middle tag so the three don't collide
      return p;
    });
    S.lock = add(lockIcon(), 0, 1.05, -.5); S.lock.scale.setScalar(2.2);
    S.stamp = add(makeStamp('REVIEWED', '#2f8f5b', 2.4, .85)); S.stamp.position.set(0, 3, .9); S.stamp.visible = false;
    if (narrowView()) Cam.set([0, 4.2, 13.2], [-.3, .8, -.2]);
    else Cam.set([1, 3.8, 12.6], [-.2, .8, -.2]);
  },
  async run() {
    const c = W.guide;
    await until(2.4);
    await beat('Tuesday. Before Codex touches anything, decide how far it may act. That is the <em>sandbox</em>.', async () => {
      Board.say('Tuesday: pick the [o]sandbox[/]');
      c.set('thinking'); c.look(.6, 0);
    });
    await beat('Read-only lets it look around and answer, but not change a file.', async () => {
      await c.walk(-2.4, .6, 1.2); c.set('neutral');
      FX.ring([-2.4, .32, -.5], OKC, { r1: 1.1 });
      Board.out(['[g]read-only[/]        look and answer, no edits']);
    });
    await beat('Workspace-write lets it edit files and run commands inside your project.', async () => {
      await c.walk(0, .6, 1.2); c.set('happy');
      await unlockIcon(S.lock);
      Board.out(['[t]workspace-write[/]  edit and run inside the project']);
    });
    await beat('Danger full access takes the walls away completely.', async () => {
      await c.walk(1.4, 1, 1); c.set('worried');
      Cam.shake(.35); FX.burst([2.4, .5, -.5], { n: 26, colors: [BAD, 0xff9a7a], speed: 1.6, up: 1.4 });
      FX.ring([2.4, .32, -.5], BAD, { r1: 1.6 });
      Board.out(['[r]danger-full-access[/] no limits at all']);
    });
    await beat('Pick one with the s flag when you start, or switch in the middle of a session with <code>/permissions</code>.', async () => {
      await c.walk(0, .9, 1); c.set('focused');
      Board.shellLine('~/shop', 'codex -s workspace-write');
      await Board.type('/permissions');
      Board.out(['  read-only', '[t]❯ workspace-write[/]', '  danger-full-access']);
    });
    await beat('Tired of approval prompts? With <code>--approve-for-me</code>, a reviewer model answers eligible requests for you.', async () => {
      bubble(c, 'Fewer prompts', 2.4, 'good');
      Board.shellLine('~/shop', 'codex --approve-for-me');
      Board.out(['[d]eligible approval requests → reviewer model[/]']);
    });
    await beat('The full bypass flag, nicknamed yolo, is not recommended. Keep it for throwaway machines.', async () => {
      Board.out(['[r]--dangerously-bypass-approvals-and-sandbox[/]  [d](alias --yolo)[/]', '[d]throwaway machines only[/]']);
      FX.spark([2.4, 1.2, -.5], BAD);
    });
    await beat('Before you commit, <code>/diff</code> shows every change, untracked files included.', async () => {
      await Board.type('/diff');
      Board.out(['[g]M[/] src/cart.ts', '[g]M[/] src/cart.test.ts', '[y]?[/] src/coupon.ts  [d](untracked)[/]']);
    });
    await beat('Then <code>/review</code> has Codex review that diff, the way a colleague would.', async () => {
      await Board.type('/review');
      const h = Board.tool('Review', 'working tree');
      await slam(S.stamp, 3, 1.5);
      h.ok(['[y]1 finding[/] · coupon.ts: expiry check uses local time', '[g]tests cover the cart change[/]']);
      c.set('proud');
    });
    await beat('Outside a session, <code>codex review --base main</code> does the same from your shell.', async () => {
      Board.shellLine('~/shop', 'codex review --base main');
      if (!narrowView()) Cam.to([.8, 3.4, 11.4], [-.2, .9, -.2], 4, E.inOutSine);
    });
    await wait(1.2);
  },
},

/* ======================= 03 · many hands ======================= */
{
  id: 'crew', num: '03', group: 'WEDNESDAY', chip: ['WED', '14:00'], sky: 'afternoon', dur: 49, concept: 'crew',
  name: 'Many Hands', title: 'Many Hands', eyebrow: 'Part 3 · Wednesday', sub: 'Three bugs, three agents, three checkouts.',
  blurb: 'Subagents in plain words, built-in and custom agents, and a worktree per task.',
  setup() {
    const c = W.guide; c.at(-3, 1.4, .5);
    S.spots = [[-1.3, -1, SIGNAL], [.6, -1.6, GOLD], [2.5, -1, VIOLET]];
    S.peds = S.spots.map(([x, z, col]) => add(makePedestal({ r: .62, trim: col }), x, 0, z));
    S.minis = S.spots.map(([x, z, col]) => miniOn(col, x, z));
    S.laps = [];
    if (narrowView()) Cam.set([.4, 4.2, 13.6], [-.3, .8, -.4]);
    else Cam.set([1.2, 3.8, 12.4], [-.3, .8, -.4]);
  },
  async run() {
    const c = W.guide;
    await until(2.4);
    await beat('Wednesday. Three bugs land at once. One agent would fix them one at a time.', async () => {
      Board.say('Wednesday: bugs [r]#41[/] [r]#42[/] [r]#43[/]');
      c.set('worried'); bubble(c, 'Three at once?', 2.4, 'alert');
    });
    await beat('Instead, ask in plain words: spawn one agent per bug.', async () => {
      c.set('focused');
      await Board.type('Spawn one agent per bug, #41, #42 and #43, and report back.');
      for (const m of S.minis) { popIn(m); await wait(.35); }
    });
    await beat('These are <em>subagents</em>. Each one takes its own job, works in parallel, and reports back.', async () => {
      S.minis.forEach((m, i) => { const [x, z] = S.spots[i]; send([-3, 1.2, 1.4], [x, .9, z], { color: S.spots[i][2], h: 1.4, dur: 1 }); m.typing = 1; S.laps.push(lapOn(x, z)); });
      const hs = ['#41', '#42', '#43'].map(b => Board.tool('Agent', 'fix bug ' + b));
      await wait(2.2);
      S.minis.forEach((m, i) => { const [x, z] = S.spots[i]; send([x, .9, z], [-3, 1.2, 1.4], { color: S.spots[i][2], h: 1.2, dur: 1 }); });
      await wait(1.1);
      hs.forEach(h => h.ok('[g]done[/] · reported back'));
      c.set('happy');
    });
    await beat('Codex has built-in agents: default, worker and explorer.', async () => {
      S.names = ['default', 'worker', 'explorer'].map((n, i) => tag(S.minis[i].head, n, [0, .25, 0], 'tag'));
      Board.out(['built-in: [t]default[/] · [t]worker[/] · [t]explorer[/]']);
    });
    await beat('Add your own as TOML files in the .codex/agents folder.', async () => {
      Board.code(['name = [t]"reviewer"[/]', 'description = [t]"Reviews diffs for the shop app"[/]'], { title: '.codex/agents/reviewer.toml' });
    });
    await beat('Subagents use more tokens, so save them for jobs that really are independent.', async () => {
      c.set('thinking'); c.look(.4, .3);
      Board.out(['[y]more tokens[/] → only for independent jobs']);
    });
    await beat('When they all edit files, give each task its own checkout with <code>codex --worktree</code>.', async () => {
      c.set('focused');
      Board.shellLine('~/shop', 'codex --worktree');
      S.names.forEach((L, i) => L.set('worktree ' + (i + 1)));
      S.spots.forEach(([x, z, col]) => FX.ring([x, .32, z], col, { r1: 1 }));
    });
    await beat('Every worktree is its own Git checkout, so parallel edits never collide.', async () => {
      c.set('proud'); c.hop(.3, .42);
      Board.out(['[g]3 checkouts · 0 collisions[/]']);
      if (!narrowView()) Cam.to([1, 3.2, 10.8], [-.3, .8, -.4], 4, E.inOutSine);
    });
    await wait(1.2);
  },
},

/* ======================= 04 · the long haul ======================= */
{
  id: 'longhaul', num: '04', group: 'THURSDAY', chip: ['THU', '09:00'], sky: 'day', dur: 37, concept: 'longhaul',
  name: 'The Long Haul', title: 'The Long Haul', eyebrow: 'Part 4 · Thursday', sub: 'A finish line, a remote run, a review on the PR.',
  blurb: '/goal for long work, Codex Cloud with codex apply, and @codex review on pull requests.',
  setup() {
    const c = W.guide; c.at(-2.9, 1.2, .5);
    S.tank = add(makeTank({ r: .5, h: 1.7, color: HERO }), -1.1, 0, -.6);
    S.goal = tag(S.tank, 'goal · tests pass <b>0%</b>', [0, 2.2, 0], 'tag');
    S.ring = add(makeRing(SIGNAL, .7), .8, 2.3, -2.2); S.ring.scale.setScalar(.001); S.ring.visible = false;
    S.pr = add(makeCard({ w: 1.6, h: 1.05, draw: cardDraw({ kicker: 'Pull request', title: 'Move tests to new runner', lines: ['shop · 14 files'], tSize: 74, lSize: 44 }) }), 1.9, 0, .4);
    S.pr.rotation.y = -.3; S.pr.visible = false;
    S.stamp = add(makeStamp('REVIEWED', '#2f8f5b', 1.6, .56)); S.stamp.position.set(1.9, 3, .7); S.stamp.rotation.y = -.3; S.stamp.visible = false;
    if (narrowView()) Cam.set([.2, 3.9, 13.8], [-.5, 1.3, -.3]);
    else Cam.set([1, 3.6, 12.4], [-.4, 1.3, -.3]);
  },
  async run() {
    const c = W.guide;
    await until(2.4);
    await beat('Thursday brings a long job: move the whole test suite to a new runner.', async () => {
      Board.say('Thursday: migrate the test suite');
      c.set('thinking');
    });
    await beat('Give Codex a finish line it can check, with <code>/goal</code>.', async () => {
      c.set('focused');
      await Board.type('/goal all tests pass on the new runner');
      FX.ring([-1.1, .1, -.6], HERO, { r1: 1 });
    });
    await beat('It keeps working toward that goal, step after step, until the condition holds.', async () => {
      const s = Board.spin('Working toward goal');
      for (const f of [.25, .5, .75, 1]) { await S.tank.userData.to(f, .7); S.goal.set('goal · tests pass <b>' + Math.round(f * 100) + '%</b>'); await wait(.25); }
      S.goal.set('<b>✓ goal met</b> · tests pass');
      s.stop(); Board.out(['[g]✓ goal met[/] · 214 tests pass']);
      c.set('happy'); c.hop(.25, .4);
    });
    await beat('Some tasks don’t need your laptop at all. <em>Codex Cloud</em> runs them remotely.', async () => {
      await grow(S.ring, .7);
      tag(S.ring, 'Codex Cloud', [0, 1.9, 0], 'tag big');
      Board.shellLine('~/shop', 'codex cloud exec --env <ID> "update the docs"');
      send([-2.9, 1.2, .5], [.8, 3.1, -2.2], { color: SIGNAL, h: 1.6, dur: 1.4 });
    });
    await beat('When it’s finished, <code>codex apply</code> brings the changes back to your checkout.', async () => {
      Board.shellLine('~/shop', 'codex apply  [d]# or codex cloud apply[/]');
      await send([.8, 3.1, -2.2], [-2.9, 1.2, .5], { color: GOLD, h: 1.2, dur: 1.3 });
      Board.out(['[g]applied[/] cloud changes to ~/shop']);
    });
    await beat('And on GitHub, comment <code>@codex review</code> on a pull request, once code review is enabled for the repo.', async () => {
      await drop(S.pr, 0);
      Board.out(['[b]PR comment:[/] @codex review']);
      await wait(.6);
      await slam(S.stamp, 3, 1.3);
      c.set('proud');
      if (!narrowView()) Cam.to([.9, 3.2, 11.2], [-.3, 1.2, -.3], 4, E.inOutSine);
    });
    await wait(1.2);
  },
},

/* ======================= 05 · plug it in ======================= */
{
  id: 'plugin', num: '05', group: 'FRIDAY', chip: ['FRI', '16:00'], sky: 'sunset', dur: 67, concept: 'plugin',
  name: 'Plug It In', title: 'Plug It In', eyebrow: 'Part 5 · Friday', sub: 'Your tools, your scripts, your pipeline.',
  blurb: 'MCP servers, plugins, hooks, headless runs for CI, and resume or fork.',
  setup() {
    const c = W.guide; c.at(-3, 1.3, .5);
    S.signs = [['docs', -1.5, -1.8], ['tickets', .4, -2.2], ['database', 2.3, -1.8]].map(([t, x, z]) => { const s = add(makeSign(t, { w: 1.5, h: .5, color: VIOLET, post: 1.3 }), x, 0, z); s.scale.setScalar(.001); s.visible = false; return s; });
    S.tubes = S.signs.map(s => add(makeTube([-3, .8, .5], [s.position.x, .55, s.position.z + .05], { h: 1, r: .03, color: VIOLET, head: true })));
    S.gate = add(new THREE.Mesh(rbox(.18, 1.4, 1.5, .04), std(BAD, { rough: .4, emissive: BAD, ei: .5 })), -1.4, .7, .9); S.gate.visible = false;
    S.pipe = ['build', 'codex exec', 'deploy'].map((t, i) => { const p = add(makePedestal({ r: .55, trim: [SIGNAL, HERO, GOLD][i] }), -1 + i * 1.6, 0, 1.5); p.scale.setScalar(.001); p.visible = false; p.userData.name = t; return p; });
    if (narrowView()) Cam.set([.2, 4.2, 13.8], [-.4, 1, -.3]);
    else Cam.set([1, 3.8, 12.6], [-.4, 1, -.3]);
  },
  async run() {
    const c = W.guide;
    await until(2.4);
    await beat('Friday is for wiring Codex into everything else.', async () => {
      Board.say('Friday: connect the rest of the toolbox');
      c.set('happy');
    });
    await beat('<em>MCP</em> servers connect outside tools. Add one with <code>codex mcp add</code>, and check them with <code>/mcp</code>.', async () => {
      Board.shellLine('~/shop', 'codex mcp add docs -- <cmd>');
      Board.shellLine('~/shop', 'codex mcp add tickets --url <url>');
      for (let i = 0; i < 3; i++) { grow(S.signs[i], .5); growTube(S.tubes[i], .8); await wait(.45); }
      await Board.type('/mcp');
      Board.out(['[g]●[/] docs  [g]●[/] tickets  [g]●[/] database']);
      S.tubes.forEach(t => pulseTube(t, CREAM));
    });
    await beat('<em>Plugins</em> bundle skills, connectors and MCP servers, so the whole team shares one setup.', async () => {
      Board.out(['plugin = [t]skills[/] + [t]connectors[/] + [t]MCP servers[/]']);
      S.tubes.forEach(t => pulseTube(t, GOLD, { rev: true }));
      bubble(c, 'One setup for everyone', 2.4, 'good');
    });
    await beat('Add a marketplace with codex plugin marketplace add, then browse it with <code>/plugins</code>.', async () => {
      Board.shellLine('~/shop', 'codex plugin marketplace add owner/repo');
      await Board.type('/plugins');
    });
    await beat('<em>Hooks</em> run your own scripts at fixed moments, like before a tool runs or when a session stops.', async () => {
      for (const s of S.signs) shrink(s, .4);
      S.tubes.forEach(t => (t.visible = false));
      Board.out(['events: [v]PreToolUse[/] · [v]PostToolUse[/] · [v]PermissionRequest[/] · [v]SessionStart[/] · [v]Stop[/]']);
      c.set('focused');
    });
    await beat('Here, a PreToolUse hook blocks a dangerous command before it ever runs.', async () => {
      grow(S.gate, .4);
      const h = Board.tool('Bash', 'rm -rf build/ ~/');
      const w = add(makeWord('rm -rf ~/', { color: '#ff8a7a', size: .3, font: FONT_M }), -2.8, 1.4, .9);
      await moveTo(w, [-1.6, 1.4, .9], 1, E.inQuad);
      FX.burst([-1.5, 1.4, .9], { n: 24, colors: [BAD, CREAM], speed: 1.4, up: .8 });
      Cam.shake(.2); W.stage.remove(w);
      h.err('[r]blocked by PreToolUse hook[/]');
      c.set('proud');
    });
    await beat('Hooks live in .codex/hooks.json, and project hooks only run in a trusted project. <code>/hooks</code> shows them.', async () => {
      Board.code(['.codex/hooks.json   [d]# or ~/.codex/hooks.json[/]', '[y]project hooks need a trusted project[/]'], { title: 'hooks' });
    });
    await beat('For CI and scripts, <code>codex exec</code> runs headless, with JSON events and the last message saved to a file.', async () => {
      shrink(S.gate, .35);
      for (const p of S.pipe) { grow(p, .45); tag(p, p.userData.name, [0, .3, .95], 'tag'); await wait(.3); }
      Board.shellLine('ci', 'codex exec "check the release" --json -o last.txt');
      const o = add(makeOrb(CREAM, .14), -1, .6, 1.5);
      await FX.fly(o, [-1, .6, 1.5], [.6, .6, 1.5], { h: .8, dur: .8 }); FX.ring([.6, .32, 1.5], HERO);
      await FX.fly(o, [.6, .6, 1.5], [2.2, .6, 1.5], { h: .8, dur: .8 }); FX.ring([2.2, .32, 1.5], GOLD);
    });
    await beat('And when the week ends, <code>codex resume</code> picks a session back up, and <code>codex fork</code> branches it.', async () => {
      Board.shellLine('~/shop', 'codex resume');
      Board.shellLine('~/shop', 'codex fork');
      c.wave(1);
      if (!narrowView()) Cam.to([.9, 3.4, 11.4], [-.4, .9, -.2], 4, E.inOutSine);
    });
    await wait(1.2);
  },
},

/* ======================= 06 · quick check ======================= */
{
  id: 'check', num: '06', group: 'CHECK', chip: ['CHECK', 'Sandbox'], sky: 'dusk', dur: 35,
  name: 'Quick Check', title: 'Quick Check', eyebrow: 'Part 6 · Quiz', sub: 'Just enough access, and no more.',
  blurb: 'Which sandbox lets Codex edit and test, and nothing else?',
  setup() {
    const c = W.guide; c.at(-3, 1.2, .5); c.set('thinking');
    S.peds = [[-1.3, OKC, 'read-only'], [.6, SIGNAL, 'workspace-write'], [2.5, BAD, 'danger-full-access']].map(([x, trim, name], i) => {
      const p = add(makePedestal({ r: .7, trim }), x, 0, -.6);
      tag(p, name, [0, narrowView() && i === 1 ? 1.6 : .3, 1], i === 2 ? 'tag warn' : 'tag');
      return p;
    });
    if (narrowView()) Cam.set([.2, 4, 13.6], [-.3, .8, -.3]);
    else Cam.set([1, 3.6, 12.2], [-.3, .8, -.3]);
  },
  async run() {
    const c = W.guide;
    await until(2.4);
    Board.say('Quick check');
    await N('Quick check. Codex must edit files and run tests in the repo, and nothing else. Which sandbox fits?');
    const r = await Quiz.ask({
      q: 'Codex must edit files and run tests in the repo, and nothing else. Which sandbox?',
      choices: ['read-only', 'workspace-write', 'danger-full-access'],
      answer: 1,
      explain: 'workspace-write lets Codex edit and run commands inside the project. Read-only can’t edit, and full access removes every limit.',
      timeout: 12,
    });
    FX.ring([.6, .32, -.6], SIGNAL, { r1: 1.4 }); FX.burst([.6, .6, -.6], { n: 24, colors: [SIGNAL, CREAM] });
    run(() => c.walk(.1, .7, 1.4));
    if (r.correct) {
      c.set('proud'); c.hop(.3, .42);
      Board.out(['[g]✓ workspace-write[/] · edit and run inside the project']);
      await N('Right. Workspace-write is exactly enough, and no more.');
    } else {
      c.set('surprised');
      Board.out(['[y]→ workspace-write[/] · read-only can’t edit, full access is too much']);
      await N('It’s workspace-write. Read-only can’t edit, and full access is far too much.');
    }
    c.set('happy');
    await N('The least access that still gets the job done. That’s the habit to keep.');
    await wait(1);
  },
},

/* ======================= 07 · recap ======================= */
{
  id: 'recap', num: '07', group: 'RECAP', hold: true, dock: false, titleCard: false, sky: 'night', dur: 30,
  name: 'Recap', title: 'Recap', blurb: 'The whole week on one page, plus a team challenge.',
  setup() {
    const c = W.guide; c.set('happy');
    const narrow = narrowView();
    c.at(narrow ? 0 : -3.1, .3, .4);
    if (narrow) Cam.set([0, 2.4, 8.4], [0, 1.0, 0]); else Cam.set([0, 2.5, 9.2], [0, 1.15, 0]);
  },
  async run() {
    Narr.set('');
    Recap.show();
    const c = W.guide;
    await wait(1);
    for (;;) { await c.wave(2); await wait(rand(4, 6)); await c.hop(.3, .42); await wait(rand(3, 5)); }
  },
},
];
