/* ============================================================
   Codex, Fully Loaded — one ticket (SHOP-142), three days, nine features.
   The board copies the real Codex CLI (reference/codex-tui.md: captured from Codex v0.160.1
   doing this same ticket in a scratch repo). The mascot is the Codex pet: a blue cloud head
   with a >_ screen face. Unofficial team explainer; facts as of Codex CLI 0.160, Oct 2026.
   ============================================================ */

const FILM = {
  id: 'codex-features-v2',
  title: 'Codex, Fully Loaded',
  brand: 'Codex Crew',
  lang: 'en',
  colors: { hero: 0x4d7cff, heroHi: 0xa9c0ff, heroInk: 0x07122e },
  board: { title: '~/shop — codex', mode: 'term' },
  concepts: [
    ['mon', 'MON', 'Brief: /init · /permissions · skills'],
    ['tue', 'TUE', 'Build: subagents · worktrees · /goal'],
    ['wed', 'WED', 'Ship: /review · hooks · MCP & plugins'],
  ],
  recap: {
    title: 'SHOP-142, start to Done',
    lede: 'One ticket, three days, nine features. The one in <b>gold</b> is the habit to keep. As of Codex CLI 0.160, October 2026.',
    rows: [
      ['MON', 'AGENTS.md', 'Standing rules; the closest file wins', '/init'],
      ['MON', 'Permissions', 'Ask for approval for everyday work', '/permissions', 1],
      ['MON', 'Skills', 'Team know-how in .agents/skills, loaded when needed', '$skill-name'],
      ['TUE', 'Subagents', 'Parallel jobs that report back; roles in .codex/agents', 'ask in plain words'],
      ['TUE', 'Worktrees', 'Each task gets its own Git checkout', 'codex --worktree'],
      ['TUE', 'Goals', 'A finish line Codex can check', '/goal'],
      ['WED', 'Review', 'See every change, then review it', '/diff · /review'],
      ['WED', 'Hooks', 'Your scripts at fixed moments, e.g. PreToolUse', '.codex/hooks.json'],
      ['WED', 'MCP & plugins', 'Connect tools; share one team setup', '/mcp · /plugins'],
    ],
    challenge: [
      'Run /init in your main repo and trim the AGENTS.md it writes to rules you would tell a new teammate.',
      'Take your next ticket through the same three days: subagent to explore, /goal for the docs, /review before the PR.',
      'Add one PreToolUse hook the whole team agrees on, and commit it in .codex/hooks.json.',
    ],
  },
  // the Codex pet replaces the default block mascot on every character
  guideSkin: codexPet,
  world() {
    Board.el.classList.add('cx');
    document.querySelector('.bi-caret').textContent = '›';
  },
};

/* ---------- the Codex pet: cloud head, >_ screen face, small body ---------- */
const PET_FACE = { neutral: '>_', focused: '>_', happy: '^_^', proud: '^_^', surprised: 'o_o', worried: '>_<', thinking: '·_·', sad: 'T_T' };
function codexPet(g) {
  g.skinned = true;
  g.body.children.forEach(c => { if (!g.arms.includes(c)) c.visible = false; });
  const mat = g.mat;                                   // shared tint, so tint() and minis' colors still work
  mat.roughness = .5; mat.emissive = g.color.clone().multiplyScalar(.28);
  const pet = new THREE.Group(); g.body.add(pet);
  // torso with a >_ print
  mesh(rbox(.46, .34, .34, .13, 3), mat, { y: .37, parent: pet });
  const chest = canvasTex(128, 64, (c, w, h) => { c.fillStyle = '#d9e2ff'; c.font = `700 40px ${FONT_M}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('>_', w / 2, h / 2 + 2); });
  const cp = new THREE.Mesh(new THREE.PlaneGeometry(.2, .1), new THREE.MeshBasicMaterial({ map: chest, transparent: true, toneMapped: false }));
  cp.position.set(0, .37, .172); pet.add(cp);
  // cloud head: one big puff and a ring of smaller ones
  const head = new THREE.Group(); head.position.y = 1.0; pet.add(head);
  const big = mesh(sphere(.4, 28, 20), mat, { parent: head }); big.scale.set(1.18, .92, .9);
  [[-.34, .2, -.02, .25], [.34, .2, -.02, .25], [0, .33, -.04, .27], [-.18, .3, .06, .2], [.18, .3, .06, .2], [-.44, -.08, -.02, .22], [.44, -.08, -.02, .22], [-.3, -.26, 0, .19], [.3, -.26, 0, .19], [0, -.3, 0, .22]]
    .forEach(([x, y, z, r]) => mesh(sphere(r, 20, 14), mat, { x, y, z, parent: head }));
  // the screen
  mesh(rbox(.6, .4, .12, .12, 3), std(0x081026, { rough: .25, metal: .2 }), { y: -.02, z: .36, parent: head });
  let shown = '', cur = true, curT = 0;
  const draw = (txt, on) => (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.shadowColor = '#6fa4ff'; c.shadowBlur = 6; c.fillStyle = '#c4dbff';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (txt === '>_') {                                  // the terminal face: chevron + blinking cursor, drawn apart
      c.font = `700 104px ${FONT_M}`; c.fillText('>', w * .36, h * .5);
      if (on) c.fillRect(w * .52, h * .66, w * .2, 13);
    } else { c.font = `700 84px ${FONT_M}`; c.fillText(txt, w / 2, h / 2 + 4); }
  };
  const tex = canvasTex(256, 160, draw('>_', true));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(.54, .34), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  face.position.set(0, -.02, .425); head.add(face);
  const setFace = () => { const t = PET_FACE[g.expr] || '>_'; if (t !== shown) { shown = t; redraw(tex, draw(t, cur)); } };
  g.onExpr = () => setFace();
  // the cursor blinks on real time, like a terminal
  g.onTick = dt => { curT += dt; if (curT > .53) { curT = 0; cur = !cur; if (shown === '>_') redraw(tex, draw('>_', cur)); } head.rotation.z = Math.sin(performance.now() / 900) * .03; };
  // shorter arms and legs under the smaller body
  g.arms.forEach(a => { a.position.set(a.userData.s * .29, .5, 0); a.scale.setScalar(.72); });
  g.legs.forEach(l => { l.position.x = Math.sign(l.position.x) * .13; l.position.y = .18; l.scale.setScalar(.8); });
  g.head.position.y = 1.62;
}

/* ---------- Codex CLI lines (see style.css) ---------- */
const CX = { model: 'GPT-6-Astra high', cwd: '~/shop', thread: 'SHOP-142 discount codes', badge: '' };
const cxFooter = () => Board.footer(`<span class="cx-model">${CX.model}</span> · <span class="cx-cwd">${CX.cwd}</span> · <span class="cx-thread">${esc(CX.thread)}</span>${CX.badge ? `<span class="cx-badge">${esc(CX.badge)}</span>` : ''}<div class="cx-hint"><b>←</b> for agents · <b>?</b> for shortcuts</div>`);
// shell command highlighting, the way Codex colors "• Ran …" lines
function hl(cmd) {
  const out = []; let first = true;
  for (const tok of cmd.match(/'[^']*'|"[^"]*"|&&|\|\||[;|]|\S+/g) || []) {
    if (/^(;|&&|\|\||\|)$/.test(tok)) { out.push(`<span class="sh-p">${esc(tok)}</span>`); first = true; continue; }
    const cls = first ? 'sh-c' : /^['"]/.test(tok) ? 'sh-s' : /^-/.test(tok) ? 'sh-f' : 'sh-a';
    out.push(`<span class="${cls}">${esc(tok)}</span>`); first = false;
  }
  return out.join(' ');
}
const sub = (lines, cls = '') => [].concat(lines).map((l, i) => `<div class="cx-sub ${cls}"><span class="el">${i ? '&nbsp;' : '└'}</span> ${l}</div>`).join('');
function cxHeader(perm = 'Ask for approval') {
  Board.raw(`<div class="cx-hdr"><span class="cx-mark">&gt;_</span> <b>OpenAI Codex</b> <span class="d">(v0.160.1)</span><br><span class="d">&nbsp;&nbsp;&nbsp;${CX.cwd}</span><br>permissions: ${esc(perm)}</div>`);
  Board.placeholder('Ask Codex to do anything'); cxFooter();
}
const cxUser = s => Board.raw(`<span class="chev">›</span>${esc(s)}`, 'cx-user');
const cxSay = (s, cls = '') => Board.raw(`<span class="dot">•</span><span class="tx">${s}</span>`, 'cx-row ' + cls);
const cxAgent = (verb, name) => cxSay(`<b>${verb}</b>${name ? ` <span class="cx-agent">\`${esc(name)}\`</span>` : ''}`);
function cxRan(cmd, out = [], more = 0, cls = 'ok') {
  return Board.raw(`<div class="cx-row ${cls}"><span class="dot">•</span><span class="tx">Ran ${hl(cmd)}</span></div>${out.length ? sub(out.map(esc), cls === 'err' ? 'err' : '') : ''}${more ? `<div class="cx-more">+ ${more} lines (ctrl+t to expand)</div>` : ''}`);
}
// files: [{ p, a, d, rows: [[n, '+'|'-'|' ', code]] }]
function cxEdited(title, files, more = true) {
  const body = files.map(f => `<div class="cx-sub"><span class="el">└</span> ${esc(f.p)} (<span class="cx-plus">+${f.a}</span> <span class="cx-minus">-${f.d}</span>)</div>` +
    (f.rows || []).map(([n, s, code]) => `<div class="r ${s === '+' ? 'add' : s === '-' ? 'del' : ''}"><span class="n">${n}</span><span class="s">${s}</span><span>${esc(code)}</span></div>`).join('')).join('');
  return Board.raw(`<div class="cx-row ok"><span class="dot">•</span><span class="tx">${title}</span></div><div class="cx-diff">${body}</div>${more ? '<div class="cx-more">+ Show details</div>' : ''}`);
}
function cxDone(first, rest = [], worked = '') {
  return Board.raw(`<div class="cx-row"><span class="dot">•</span><span class="tx">${first}</span></div>${rest.map(r => `<div class="cx-body">${r}</div>`).join('')}${worked ? `<div class="cx-worked">Worked for ${worked}</div>` : ''}`);
}
// live "• Working (Ns • esc to interrupt)" line on the scene clock; returns { stop }
function cxWorking() {
  const el = Board.raw('<span class="dot">•</span><span class="tx"></span>', 'cx-row cx-work');
  const tx = el.querySelector('.tx'), t0 = D.t, tok = D.token; let on = true;
  run(async () => { while (on && D.token === tok) { tx.innerHTML = `Working (${Math.max(1, Math.floor(D.t - t0))}s • <b>esc</b> to interrupt)`; await wait(.25); } });
  return { stop() { on = false; el.remove(); } };
}
// type into the composer like a person, then post it as a user message
async function cxType(s, cps = 38) { await Board.typeOnly(s, { cps }); await wait(.25); Board.placeholder('Ask Codex to do anything'); return cxUser(s); }
function cxMenu(title, opts, sel = 0, hint = 'enter select · esc back') {
  return Board.raw(`<div class="t">${esc(title)}</div>${opts.map(([l, ds], i) => `<div class="o${i === sel ? ' sel' : ''}"><span class="l">${i === sel ? '›' : '&nbsp;'} ${i + 1}. ${esc(l)}</span><span class="ds">${esc(ds || '')}</span></div>`).join('')}<div class="h">${esc(hint)}</div>`, 'cx-menu');
}
const cxMarker = s => Board.raw(esc(s), 'cx-marker');

/* ---------- props for this film ---------- */
function ticketCard(done = false) {
  return makeCard({ w: 2, h: 1.3, d: .06, res: 1024, draw: cardDraw({ kicker: 'SHOP-142', title: 'Discount codes at checkout', lines: ['SAVE10 · 10% off', 'FREESHIP · no shipping', 'unknown codes rejected'], accent: '#5b78f2', done, tSize: 70, lSize: 38 }) });
}
function fileCard(title, lines, accent = '#5b78f2', w = 1.6, h = 1.1) {
  return makeCard({ w, h, d: .05, res: 1024, draw: cardDraw({ kicker: 'file', title, lines, accent, tSize: 76, lSize: 40 }) });
}
function gate(label, color) {
  const g = new THREE.Group();
  const p = makePedestal({ r: .5, h: .22, trim: color }); g.add(p);
  const ring = makeRing(color, .62); ring.position.y = .2; ring.scale.setScalar(.85); g.add(ring);
  g.userData.ring = ring; g.userData.label = label;
  return g;
}
function shield(color = 0x9fb3ff) {
  const g = new THREE.Group();
  const m = mesh(new THREE.CircleGeometry(.9, 6), glow(color, .9, { transparent: true, opacity: .22, depthWrite: false, side: THREE.DoubleSide }), { y: 1.1, parent: g, cast: false });
  const rim = mesh(torus(.9, .03, 6, 6), glow(color, 2), { y: 1.1, parent: g, cast: false });
  rim.rotation.z = Math.PI / 6; m.rotation.z = Math.PI / 6;
  g.userData.face = m;
  return g;
}
const narrow = () => matchMedia('(max-width: 900px)').matches;

const SCENES = [
/* ======================= 00 · title ======================= */
{
  id: 'start', num: '00', group: 'INTRO', hero: true, hold: true, dock: false, sky: 'dusk', dur: 30,
  name: 'Codex, Fully Loaded',
  title: 'Codex,<br>Fully Loaded', eyebrow: 'One ticket · three days · nine features',
  sub: 'Follow SHOP-142, a discount-code ticket, from the first prompt to Done, and meet the Codex features that carry it.',
  blurb: 'Meet the pet, and the ticket.',
  setup() {
    const c = W.guide; c.at(0, 0, 0); c.typing = 1; c.set('focused');
    S.t = add(ticketCard(), 1.7, 0, -1.6); S.t.rotation.y = -.35;
    if (narrow()) Cam.set([3.6, 2.1, 6.6], [.4, .6, -.4]); else Cam.set([3.2, 1.8, 7.6], [-1.3, 1.0, -.3]);
  },
  async run() {
    Narr.set('');
    run(async () => { const c = W.guide; for (;;) { await wait(rand(3.5, 5.5)); c.typing = 0; c.set('happy'); c.look(.4, .3); await wait(1.4); c.set('focused'); c.typing = 1; } });
    for (;;) { await Cam.orbit(-20, 12); await Cam.orbit(20, 12); }
  },
},

/* ======================= 01 · Monday: brief ======================= */
{
  id: 'brief', num: '01', group: 'MONDAY', chip: ['MON', '09:00'], sky: 'dawn', dur: 66, concept: 'mon',
  name: 'Monday: Brief Codex', title: 'Monday:<br>Brief Codex', eyebrow: 'AGENTS.md · permissions · skills', sub: 'Rules, freedom and know-how, before a line of code.',
  blurb: 'SHOP-142 arrives. /init writes AGENTS.md, /permissions sets the freedom, a skill brings team know-how.',
  setup() {
    const c = W.guide; c.at(-2.4, .5, .55); c.typing = 0;
    S.ticket = add(ticketCard(), -.4, 6, -1.4); S.ticket.rotation.y = .2;
    S.agents = add(fileCard('AGENTS.md', ['build: npm test', 'style: ES modules', 'tests for every rule']), .9, 0, -.2); S.agents.rotation.y = -.15; S.agents.scale.setScalar(.001);
    S.sub = add(fileCard('AGENTS.md', ['src/checkout/', 'money in cents'], '#8fa3ff', 1.1, .8), 2.1, 0, .5); S.sub.rotation.y = -.35; S.sub.scale.setScalar(.001);
    S.gates = [['Ask for approval', OKC], ['Approve for me', GOLD], ['Full Access', BAD]].map(([l, col], i) => { const g = add(gate(l, col), -1.2 + i * 1.5, 0, 2.0); g.scale.setScalar(.001); return g; });
    S.books = add(makeStack(5, { colors: [0x5b78f2, SIGNAL] }), -3.4, 0, -1.6); S.books.scale.setScalar(.001);
    Cam.set([3.6, 3.4, 10.8], [-.4, .9, .2]);
  },
  async run() {
    const c = W.guide;
    cxHeader();
    await until(2.4);
    await beat('Monday, nine a.m. Ticket SHOP-142 lands: discount codes at checkout.', async () => {
      await drop(S.ticket, 0, { h: 6, dur: .6 }); Cam.shake(.15); FX.burst([-.4, .1, -1.4], { n: 18 });
      c.typing = 0; c.set('surprised'); await c.face({ x: -.4, z: -1.4 }, .4); bubble(c, 'SHOP-142!', 1.8);
    });
    await beat('Before any code, Codex needs the house rules. Type <code>/init</code>.', async () => {
      c.set('focused'); await c.face(.55, .4); c.typing = 0;
      await cxType('/init');
    });
    await beat('Codex reads the repo and writes an <em>AGENTS.md</em>: the commands, the conventions, how to test.', async () => {
      const w = cxWorking();
      cxRan('git status --short; cat package.json src/checkout/cart.js src/checkout/checkout.js', ['- Unknown codes are rejected with a clear error.', '- Free-shipping threshold uses the subtotal before the discount.'], 23);
      await wait(2.2); w.stop();
      cxDone('Created AGENTS.md after confirming it did not exist.', ['The 315-word guide covers repository structure, commands, coding conventions, testing, and commit/PR guidance. npm test passes.'], '42s • 9:02 AM');
      await grow(S.agents, .6); tag(S.agents, '<span class="dot" style="color:var(--hero-hi)"></span>repo root', [0, 1.35, 0]);
    });
    await beat('Every session reads it: your global file first, then each folder down from the repo root. The closest one wins.', async () => {
      await wait(1.6); await grow(S.sub, .5); tag(S.sub, 'src/checkout · wins here', [0, 1.0, 0], 'tag hero');
      send([.9, 1.2, -.2], [2.1, .9, .5], { color: 0x8fa3ff, r: .07 });
    });
    await beat('Next, how much freedom? <code>/permissions</code> offers three choices.', async () => {
      await cxType('/permissions');
      cxMenu('Update Model Permissions', [['Ask for approval', 'Read and edit workspace files and run commands, with approval for internet access or edits outside the workspace'], ['Approve for me', 'Only ask for actions detected as potentially unsafe'], ['Full Access', 'Codex can edit files outside this workspace and access the internet without approval']], 0);
      Cam.to([3.2, 3.6, 11.6], [-.2, .6, 1.2], 3, E.inOutSine);
      for (const g of S.gates) { grow(g, .5); tag(g, esc(g.userData.label), [0, 1.65, 0]); await wait(.35); }
    });
    await beat('Ask for approval edits and runs commands inside the repo, and asks before going online or outside it.', async () => {
      await c.walk(-1.2, 1.4, 1.2); c.set('happy'); FX.ring([-1.2, .25, 2.0], OKC);
    });
    await beat('Approve for me only stops for actions that look unsafe. Full Access never asks, so keep it for throwaway machines.', async () => {
      FX.ring([.3, .25, 2.0], GOLD); await wait(2.4);
      c.set('worried'); Cam.shake(.2); FX.burst([1.8, .6, 2.0], { n: 20, colors: [BAD, CREAM] });
    });
    await beat('Last, team know-how. A skill is a folder with a <code>SKILL.md</code>, loaded only when a task needs it.', async () => {
      c.set('neutral'); await c.walk(-2.6, -.6, 1.1);
      await grow(S.books, .5); tag(S.books, '.agents/skills/checkout-rules', [0, .8, 0]);
      Cam.to([3.6, 3.4, 10.8], [-.6, .9, -.2], 3, E.inOutSine);
    });
    await beat('Call one with a dollar sign, and Codex applies the team rules to this ticket.', async () => {
      await cxType('$checkout-rules check SHOP-142 before we start');
      cxSay('Using checkout-rules: discounts apply before shipping is checked, and every rule needs a test.');
      c.set('happy'); c.hop(.3, .4);
    });
    await wait(1.5);
  },
},

/* ======================= 02 · Tuesday: build ======================= */
{
  id: 'build', num: '02', group: 'TUESDAY', chip: ['TUE', '10:30'], sky: 'day', dur: 50, concept: 'tue',
  name: 'Tuesday: Build It', title: 'Tuesday:<br>Build It', eyebrow: 'subagents · worktrees · /goal', sub: 'Split the work, keep it apart, give it a finish line.',
  blurb: 'An explorer subagent maps checkout, Codex edits and tests, worktrees keep parallel work apart, /goal finishes the docs.',
  setup() {
    const c = W.guide; c.at(-2.2, .6, .5); c.typing = 0;
    S.files = [[.4, -1.6], [1.4, -1.2], [2.2, -.4]].map(([x, z], i) => add(makeStack(4 + i, { colors: [0x5b78f2, SIGNAL] }), x, 0, z));
    S.mini = mini(SIGNAL, -1.2, .1, { scale: .5 });
    S.trees = [[-1.4, 1.9, VIOLET], [.6, 1.9, GOLD]].map(([x, z, col]) => { const g = add(gate('worktree', col), x, 0, z); g.scale.setScalar(.001); return g; });
    S.tank = add(makeTank({ color: 0x5b78f2 }), 2.4, 0, 1.2); S.tank.userData.set(0); S.tank.visible = false;
    Cam.set([3.8, 3.4, 10.8], [-.2, .9, 0]);
  },
  async run() {
    const c = W.guide, m = S.mini;
    CX.thread = 'Implement SHOP-142'; CX.badge = ''; cxHeader();
    await until(2.4);
    await beat('Tuesday. Time to build, and one prompt asks Codex to split the work.', async () => {
      await cxType('Implement SHOP-142. First spawn one explorer subagent to map how checkout totals are computed, then implement it and add tests for every rule.', 60);
    });
    await beat('Codex starts a subagent, an explorer, to trace the checkout math.', async () => {
      cxSay('I’ll first spawn one explorer to trace checkout totals. After it reports back, I’ll implement SHOP-142.');
      cxAgent('Started', '/root/explore_checkout');
      await popIn(m); bubble(m, 'explorer', 1.6);
      for (const f of S.files) { await m.walk(f.position.x - .5, f.position.z + .5, .9); send(f.position.clone().setY(.6), [m.root.position.x, .7, m.root.position.z], { color: SIGNAL, r: .06, h: .6, dur: .6 }); await wait(.4); }
    });
    await beat('Each subagent takes one job and reports back. Built-in roles are default, worker and explorer, and your own go in <code>.codex/agents</code>.', async () => {
      cxAgent('Waiting for agents');
      await m.walk(-1.5, .4, 1.4);
      send([-1.5, .7, .4], [-2.2, 1.2, .6], { color: SIGNAL, r: .1 });
      cxAgent('Completed', '/root/explore_checkout');
      await wait(.6); await poof(m);
    });
    await beat('With the report in hand, Codex edits two files and adds the tests.', async () => {
      c.set('focused');
      const w = cxWorking(); await wait(1.6); w.stop();
      cxEdited('Edited 2 files (<span class="cx-plus">+60</span> <span class="cx-minus">-3</span>)', [
        { p: 'src/checkout/checkout.js', a: 8, d: 2, rows: [[4, '+', '  const { discountCode } = cart;'], [5, '+', "  if (discountCode && !['SAVE10', 'FREESHIP'].includes(discountCode)) {"]] },
        { p: 'test/checkout.test.js', a: 52, d: 1, rows: [[7, '-', '  assert.equal(r.total, 60);'], [7, '+', '  assert.deepEqual(r, { subtotal: 60, shipping: 0, total: 60 });']] },
      ]);
      cxRan('npm test; git diff --stat', ['src/checkout/checkout.js | 10 +++++++--', 'test/checkout.test.js    | 53 ++++++++++++++++'], 23);
      c.set('happy');
    });
    await beat('Two tasks editing at once? Start each with <code>codex --worktree</code>, and each gets its own Git checkout.', async () => {
      Board.shellLine('~/shop', 'codex --worktree');
      Cam.to([3.4, 3.6, 11.4], [-.4, .7, 1.0], 3, E.inOutSine);
      for (const g of S.trees) { grow(g, .5); await wait(.3); }
      tag(S.trees[0], 'checkout', [0, 1.65, 0]); tag(S.trees[1], 'docs', [0, 1.65, 0]);
    });
    await beat('For the docs, give Codex a finish line it can check, with <code>/goal</code>.', async () => {
      await cxType('/goal docs/checkout.md documents SAVE10 and FREESHIP with one example each, and npm test passes', 70);
      Board.raw('<div class="cx-row cx-goal"><span class="dot">•</span><span class="tx">Goal active <span class="o">Objective: docs/checkout.md documents SAVE10 and FREESHIP with one example each, and npm test passes</span></span></div>');
      S.tank.visible = true; grow(S.tank, .5);
      S.meter = tag(S.tank, 'goal · working…', [0, 2.0, 0]);
      S.tank.userData.to(.7, 3.5);
    });
    await beat('It keeps working until the condition holds: docs written, all eleven tests green.', async () => {
      cxEdited('Added docs/checkout.md (<span class="cx-plus">+43</span> <span class="cx-minus">-0</span>)', [{ p: 'docs/checkout.md', a: 43, d: 0, rows: [[1, '+', '# Checkout discount codes']] }]);
      await S.tank.userData.to(1, 1.2);
      S.meter.set('<span style="color:var(--ok)">✓</span> goal achieved · 23s');
      cxDone('Added docs/checkout.md documenting SAVE10 and FREESHIP, with one example each.', ['All 11 tests pass with npm test. Goal completed in 23 seconds.'], '29s • 10:41 AM');
      CX.badge = 'Goal achieved (23s)'; cxFooter();
      FX.burst([2.4, 1.8, 1.2], { n: 24 }); c.set('proud'); c.hop(.3, .4);
    });
    await wait(1.5);
  },
},

/* ======================= 03 · Wednesday: ship ======================= */
{
  id: 'ship', num: '03', group: 'WEDNESDAY', chip: ['WED', '15:00'], sky: 'afternoon', dur: 54, concept: 'wed',
  name: 'Wednesday: Ship It', title: 'Wednesday:<br>Ship It', eyebrow: '/review · hooks · MCP & plugins', sub: 'Check it, guard it, close the loop.',
  blurb: '/diff and /review check the work, a hook blocks a risky command, MCP moves the ticket to Done.',
  setup() {
    const c = W.guide; c.at(-2.3, .5, .5); c.typing = 0;
    S.pr = add(makeCard({ w: 1.8, h: 1.2, d: .06, res: 1024, draw: cardDraw({ kicker: 'pull request', title: 'SHOP-142: discount codes', lines: ['shop · 3 files', '+103 −3'], accent: '#5b78f2', tSize: 70, lSize: 40 }) }), -.2, 0, -1.3); S.pr.rotation.y = .15;
    S.stamp = makeStamp('REVIEWED', '#2f8f5b', 1.8, .62); S.stamp.visible = false; add(S.stamp, -.2, 3, -1.1);
    S.shield = add(shield(), 1.2, 0, .9); S.shield.scale.setScalar(.001);
    S.sign = add(makeSign('TRACKER', { color: 0x5b78f2, w: 1.5 }), 3.0, 0, -2.1); S.sign.scale.setScalar(.001);
    S.ticket = add(ticketCard(true), 2.2, 0, 1.3); S.ticket.rotation.y = -.5; S.ticket.scale.setScalar(.001);
    Cam.set([3.8, 3.4, 10.8], [-.2, .9, -.2]);
  },
  async run() {
    const c = W.guide;
    CX.thread = 'Implement SHOP-142'; CX.badge = ''; cxHeader();
    await until(2.4);
    await beat('Wednesday. Before shipping, look at everything that changed. <code>/diff</code> shows it all, untracked files included.', async () => {
      await cxType('/diff');
      cxEdited('src/checkout/checkout.js', [{ p: '@@ -1,7 +1,13 @@', a: 6, d: 2, rows: [[4, '+', '  const { discountCode } = cart;'], [8, '-', '  const shipping = subtotal >= 50 ? 0 : 5;'], [11, '+', "  const shipping = subtotal >= 50 || discountCode === 'FREESHIP' ? 0 : 5;"]] }], false);
    });
    await beat('Then <code>/review</code>. Pick uncommitted changes, and Codex reviews them the way a colleague would.', async () => {
      await cxType('/review');
      cxMenu('Select a review preset', [['Review against a base branch', '(PR Style)'], ['Review uncommitted changes'], ['Review a commit'], ['Custom review instructions']], 1);
      await wait(1.6);
      cxMarker('>> Code review started: current changes <<');
      cxRan('git diff HEAD; cat AGENTS.md docs/TICKET-SHOP-142.md; npm test', ['ℹ pass 11', 'ℹ fail 0'], 20);
      cxMarker('<< Code review finished >>');
      cxSay('The changes implement the discount-code rules while preserving shipping behavior. All 11 tests pass, and no actionable defects were found.');
      await slam(S.stamp, 3, .75); c.set('happy');
    });
    await beat('Some rules must hold every time, not only when Codex remembers. That is what hooks are for.', async () => {
      c.set('neutral'); await grow(S.shield, .6); tag(S.shield, '.codex/hooks.json', [0, 2.2, 0]);
    });
    await beat('A PreToolUse hook runs before each tool call. This one blocks a force push to main.', async () => {
      cxRan('git push --force origin main', ['Blocked by PreToolUse hook: no force pushes to main'], 0, 'err');
      await send([-2.3, 1, .5], [1.0, 1.1, .9], { color: BAD, r: .1, burst: false });
      FX.burst([1.1, 1.1, .9], { n: 22, colors: [BAD, CREAM] }); Cam.shake(.18);
      anim(.5, k => (S.shield.userData.face.material.opacity = .22 + Math.sin(k * Math.PI) * .5));
      c.set('surprised');
    });
    await beat('Last, close the loop. MCP servers connect Codex to outside tools, and <code>/mcp</code> lists them.', async () => {
      c.set('focused');
      await cxType('/mcp');
      Board.raw('<div>🔌&nbsp; <b>MCP Tools</b></div><div class="cx-tbl"><span>• tracker:</span><span class="cx-ok">connected (24 tools)</span><span>• github:</span><span class="cx-ok">connected (31 tools)</span><span>• railway:</span><span class="cx-no">disabled (0 tools)</span></div><div class="cx-d">&nbsp;&nbsp;Use /mcp verbose for tools and resources.</div>');
      await grow(S.sign, .5);
      const t = add(makeTube([-2.1, 1.1, .5], [3.0, 1.25, -2.1], { h: 1.4, color: 0x8fa3ff, k: 1.4 })); await growTube(t, 1.2); pulseTube(t, CREAM);
    });
    await beat('With the tracker connected, Codex moves SHOP-142 to Done and links the pull request.', async () => {
      await cxType('Move SHOP-142 to Done and link the PR');
      cxSay('Moved <b>SHOP-142</b> to Done and linked the pull request.');
      await grow(S.ticket, .5); FX.burst([2.2, 1, 1.3], { n: 26 }); c.set('proud'); c.hop(.3, .4);
    });
    await beat('And plugins bundle skills and MCP servers, so the whole team installs one setup from <code>/plugins</code>.', async () => {
      await cxType('/plugins');
      Board.raw('<b>Plugins</b><div class="cx-d">Browse plugins from available marketplaces.</div><div class="cx-tbl" style="padding-left:0"><span>› [*] shop-team</span><span class="cx-d">Installed · checkout-rules skill · tracker MCP</span><span>&nbsp; [ ] release-notes</span><span class="cx-d">Workspace</span></div>');
      Cam.to([3.2, 3.0, 9.6], [.2, .9, -.3], 4, E.inOutSine);
    });
    await wait(1.5);
  },
},

/* ======================= 04 · quick check ======================= */
{
  id: 'check', num: '04', group: 'CHECK', chip: ['THU', 'quiz'], sky: 'dusk', dur: 36,
  name: 'Quick Check', title: 'Quick Check', eyebrow: 'One question', sub: 'Which permission fits everyday work?',
  blurb: 'One question about /permissions.',
  board: { title: '~/shop — codex', mode: 'term' },
  setup() {
    const c = W.guide; c.at(-2.4, .6, .4); c.set('thinking');
    S.gates = [['Ask for approval', OKC], ['Approve for me', GOLD], ['Full Access', BAD]].map(([l, col], i) => { const g = add(gate(l, col), -.6 + i * 1.6, 0, -.4); tag(g, esc(l), [0, 1.65, 0]); return g; });
    Cam.set([3.6, 3.2, 10.2], [.2, .8, -.2]);
  },
  async run() {
    const c = W.guide;
    CX.badge = ''; cxHeader();
    await until(2.2);
    await N('Quick check. Codex should edit files and run tests inside the repo, and ask before anything else. Which permission fits?');
    const r = await Quiz.ask({
      q: 'Edit and test inside the repo; ask before going online or outside it. Which /permissions option?',
      choices: ['Ask for approval', 'Approve for me', 'Full Access'],
      answer: 0,
      explain: 'Ask for approval reads, edits and runs commands in the workspace, and asks before internet access or edits outside it.',
      timeout: 12,
    });
    run(async () => { await c.walk(-.6, .5, 1.2); FX.ring([-.6, .25, -.4], OKC); });
    if (r.correct) { c.set('proud'); await N('Right. Ask for approval is the everyday choice.'); }
    else { c.set('surprised'); await N('It is Ask for approval. Approve for me skips most prompts, and Full Access skips them all.'); }
    c.set('happy');
    await N('The least freedom that still gets the job done. That is the habit to keep.');
    await wait(1);
  },
},

/* ======================= 05 · recap ======================= */
{
  id: 'recap', num: '05', group: 'RECAP', hold: true, dock: false, titleCard: false, sky: 'sunset', dur: 30,
  name: 'Recap', title: 'Recap', blurb: 'The whole ticket on one page.',
  setup() {
    const c = W.guide; c.set('happy');
    S.cx = narrow() ? 0 : -3.1;
    c.at(S.cx, .3, .4);
    S.t = add(ticketCard(true), narrow() ? 1.4 : -1.6, 0, -1.2); S.t.rotation.y = .3;
    if (narrow()) Cam.set([0, 2.4, 8.4], [0, 1.0, 0]); else Cam.set([0, 2.5, 9.2], [0, 1.15, 0]);
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
