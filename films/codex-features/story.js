/* ============================================================
   story.js — one explainer film. build.py inlines this into the engine.
   Everything here runs inside the engine's module, so every engine helper
   (N, wait, until, anim, run, Board, Quiz, Note, Recap, Cam, FX, add, make*, W.guide …)
   is in scope. See references/engine-api.md for the full list.

   Rules that keep the film in sync with its voice track:
   - Narration goes through beat('literal', visuals), N('literal') or Narr.set('literal').
     Use plain string literals (no ${} templates, no string concatenation): build_vo.py
     reads them straight from this file to synthesize one clip per line.
   - Time only through wait / until / anim (the scene clock), never setTimeout.
   - Read HERO/SIGNAL/GOLD colors inside setup()/run(), not at the top level,
     because FILM.colors is applied at boot.
   ============================================================ */

const FILM = {
  id: 'photosynthesis',                 // localStorage namespace; keep it unique per film
  title: 'Where Plants Get Their Lunch',
  brand: 'Plant Kitchen',
  lang: 'en',
  colors: { hero: 0x5fbf6a, heroHi: 0x9be3a2, heroInk: 0x0b1a0d },   // tint the guide + UI accent
  board: { title: 'lesson notes', mode: 'notes' },                  // default board for every scene
  // concept chips in the HUD; a scene with `concept: 'x'` unlocks its chip when it ends
  concepts: [
    ['in', 'IN', 'The three ingredients'],
    ['eq', 'EQ', 'The recipe'],
    ['mass', 'AIR', 'Mass from air'],
  ],
  // ui: { start: 'Bắt đầu ▸', … }   // override any engine UI string (see UI in engine.html)
  recap: {
    title: 'Photosynthesis on one page',
    lede: 'Light powers it, water and air feed it, and the plant keeps the sugar. The one in <b>gold</b> surprises most people.',
    rows: [
      ['IN', 'Ingredients', 'Sunlight for energy, water from the roots, carbon dioxide from the air', 'light + H₂O + CO₂'],
      ['EQ', 'The recipe', 'Six of each in, one sugar and six oxygen out', '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂'],
      ['AIR', 'Mass from air', 'Most of a tree is carbon it pulled out of the air', 'not from soil', 1],
    ],
    challenge: [
      'Put a glass jar over a small plant in sunlight. What collects on the inside?',
      'Explain to someone why a forest is called a carbon sink, in two sentences.',
    ],
  },
};

/* ---------- custom props for this film (any make* recipe can live here) ---------- */
function makePlant(s = 1) {
  const g = new THREE.Group();
  mesh(cyl(.06, .09, 1.4, 10), MAT.wood, { y: .7, parent: g });
  const leafMat = std(0x4fae5c, { rough: .6, emissive: 0x0f2a12 });
  const leaves = [];
  [[.0, 1.5, 0, 0], [.32, 1.15, .1, -.7], [-.34, .95, -.05, .8], [.25, .7, -.12, -.9]].forEach(([x, y, z, rz]) => {
    const l = mesh(rbox(.62, .05, .32, .02), leafMat, { x, y, z, parent: g });
    l.rotation.z = rz; leaves.push(l);
  });
  mesh(cyl(.42, .32, .4, 18), std(0x8a4b32, { rough: .9 }), { y: .2, parent: g });
  g.scale.setScalar(s);
  g.userData.leaves = leaves;
  return g;
}

const SCENES = [
/* ======================= 00 · title ======================= */
{
  id: 'start', num: '00', group: 'INTRO', hero: true, hold: true, dock: false, sky: 'dawn', dur: 30,
  name: 'Where Plants Get Their Lunch',
  title: 'Where Plants<br>Get Their Lunch', eyebrow: 'A four-minute film about photosynthesis',
  sub: 'Plants never eat, yet a tree can weigh a few tonnes. Here is where all of that comes from.',
  blurb: 'A plant, a sunrise, and a question.',
  setup() {
    const c = W.guide; c.at(-1.1, .4, .5); c.set('happy');
    S.plant = add(makePlant(1.3), .9, 0, -.2);
    if (matchMedia('(max-width: 900px)').matches) Cam.set([4.3, 2.1, 6.4], [0, .2, 0]);
    else Cam.set([3.4, 1.7, 7.6], [-1.6, .9, 0]);
  },
  async run() {
    Narr.set('');
    run(async () => { for (;;) { await wait(rand(3, 5)); await W.guide.face({ x: .9, z: -.2 }, .5); W.guide.look(.3, .4); await wait(1.4); await W.guide.face(.5, .5); W.guide.look(0, 0); } });
    for (;;) { await Cam.orbit(-20, 12); await Cam.orbit(20, 12); }
  },
},

/* ======================= 01 · ingredients ======================= */
{
  id: 'inputs', num: '01', group: 'HOW', chip: ['PART 1', 'Ingredients'], sky: 'day', dur: 31, concept: 'in',
  name: 'Three Ingredients', title: 'Three Ingredients', eyebrow: 'Part 1 · What goes in', sub: 'Light, water, air.',
  blurb: 'Sunlight, water and carbon dioxide meet in a leaf.',
  setup() {
    const c = W.guide; c.at(-2.2, 1.2, .6);
    S.plant = add(makePlant(1.5), .6, 0, -.4);
    S.sun = add(makeOrb(GOLD, .5), 2.6, 4.2, -3);
    S.sun.scale.setScalar(.001);
    Cam.set([5.2, 3.4, 10.5], [0, 1.4, -.4]);
  },
  // beat-driven: each line starts its own visuals, so pictures stay on the words whatever the clip length
  async run() {
    const c = W.guide;
    await until(2.4);
    await beat('A plant needs three things to make its own food.', async () => {
      await wait(1.2); Board.k('Part 1'); Board.h('Ingredients');
    });
    await beat('The first is <em>sunlight</em>. It is the energy that powers everything else.', async () => {
      grow(S.sun, .8); c.set('happy'); c.look(.6, .7);
      Board.li('**Sunlight**: the energy source');
      for (let i = 0; i < 6; i++) { send([2.6, 4.2, -3], [.6 + rand(-.4, .4), 1.6, -.4], { color: GOLD, r: .06, h: .4, dur: .9 }); await wait(.5); }
    });
    await beat('The second is <em>water</em>, pulled up from the roots all the way to the leaves.', async () => {
      c.set('neutral'); c.look(0, -.4);
      Board.li('**Water** (H₂O): up from the roots');
      for (let i = 0; i < 5; i++) { send([.6 + rand(-.3, .3), .05, -.4], [.6, 1.4, -.4], { color: 0x6fb8ff, r: .07, h: .2, dur: 1.1 }); await wait(.45); }
    });
    await beat('The third is invisible: <em>carbon dioxide</em>, breathed in from the air through tiny pores.', async () => {
      c.set('thinking'); bubble(c, 'Air is food?', 2.2, 'think');
      Board.li('**Carbon dioxide** (CO₂): in from the air');
      for (let i = 0; i < 6; i++) { send([rand(-4, 4), rand(1, 3), 3], [.6, 1.3, -.4], { color: 0xb8c2dc, r: .07, h: .8, dur: 1.3 }); await wait(.4); }
      Board.def('stomata', 'tiny pores under the leaf that let CO₂ in and O₂ out');
    });
    await beat('All three meet inside the leaf.', async () => {
      c.set('happy');
      Cam.to([2.8, 2.5, 7.8], [-.7, 1.1, 0], 4, E.inOutSine);   // push in, keeping the guide in shot
    });
    await wait(1.5);
  },
},

/* ======================= 02 · the recipe ======================= */
{
  id: 'recipe', num: '02', group: 'HOW', chip: ['PART 2', 'The recipe'], sky: 'lab', dur: 33, concept: 'eq',
  name: 'The Recipe', title: 'The Recipe', eyebrow: 'Part 2 · Inside the leaf', sub: 'A kitchen too small to see.',
  blurb: 'The chloroplast turns light, water and air into sugar and oxygen.',
  setup() {
    const c = W.guide; c.at(-1.7, 1.7, .5);
    S.ring = add(makeRing(SIGNAL, 1.1), 0, 0, -.6);
    S.ring.scale.setScalar(.001);
    S.ped = add(makePedestal({ r: .9, trim: SIGNAL }), 2.6, 0, .4);
    S.sugars = [];
    Cam.set([4.8, 3.2, 10.2], [0, 1.2, -.3]);
  },
  async run() {
    const c = W.guide;
    await until(2.2);
    await beat('Inside each leaf cell are chloroplasts, tiny green kitchens.', async () => {
      await grow(S.ring, .9);
      tag(S.ring, '<span class="dot" style="color:var(--signal)"></span>chloroplast', [0, 2.5, 0], 'tag big');
      Board.k('Part 2'); Board.h('The recipe');
    });
    await beat('Light splits water apart, and the plant keeps the hydrogen.', async () => {
      Board.step(1, 'Light splits water: H₂O → H + O');
      for (let i = 0; i < 4; i++) { send([-3.5, 3, 2], [0, 1.2, -.6], { color: 0x6fb8ff, r: .08, dur: 1 }); await wait(.35); }
    });
    await beat('Then it joins that hydrogen with carbon dioxide to build sugar.', async () => {
      Board.step(2, 'Hydrogen + CO₂ → sugar');
      for (let i = 0; i < 4; i++) { send([3.5, 3, 2], [0, 1.2, -.6], { color: 0xb8c2dc, r: .08, dur: 1 }); await wait(.3); }
      // sugar cubes pop out onto the pedestal
      for (let i = 0; i < 3; i++) {
        const cube = add(new THREE.Mesh(rbox(.32, .32, .32, .05), std(GOLD, { rough: .3, emissive: 0x4a3410 })), 0, 1.2, -.6);
        cube.castShadow = true;
        await FX.fly(cube, [0, 1.2, -.6], [2.4 + i * .25, .46 + (i === 2 ? .32 : 0), .4 + (i === 1 ? -.2 : 0)], { h: 1.4, dur: .8, color: GOLD });
        FX.burst(cube.position, { n: 8, colors: [GOLD, CREAM], speed: .8, up: .8, size: .04 });
      }
      c.set('surprised'); c.hop(.3, .4);
    });
    await beat('Oxygen is left over, so the plant lets it go. That is the air we breathe.', async () => {
      c.set('happy');
      Board.step(3, 'Oxygen leaves through the stomata');
      for (let i = 0; i < 6; i++) { send([0, 1.6, -.6], [rand(-3, 3), 5, rand(-3, 1)], { color: 0xd8f5ff, r: .06, h: .6, dur: 1.4, burst: false }); await wait(.3); }
    });
    await beat('Six carbon dioxide and six water in. One sugar and six oxygen out.', async () => {
      Board.hr();
      Board.math('6CO<sub>2</sub> + 6H<sub>2</sub>O <span class="c-y">+ light</span> → C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> + 6O<sub>2</sub>');
      Note.show({ title: 'The recipe', when: 'Light is the energy, not an ingredient that ends up in the sugar.', rows: [['in', 'CO₂ · H₂O · light'], ['out', 'glucose · O₂']] });
      Cam.to([3.4, 2.7, 8.6], [.1, 1, 0], 6, E.inOutSine);
    });
    await wait(2.5);   // let the equation and field note sit for a moment
  },
},

/* ======================= 03 · quick check ======================= */
{
  id: 'check', num: '03', group: 'CHECK', chip: ['PART 3', 'Quick check'], sky: 'afternoon', dur: 36, concept: 'mass',
  name: 'Where Does a Tree Come From?', title: 'Where Does a<br>Tree Come From?', eyebrow: 'Part 3 · Quick check', sub: 'Most people get this one wrong.',
  blurb: 'A one-question quiz with a surprising answer.',
  setup() {
    const c = W.guide; c.at(-2.4, 1, .6); c.set('thinking');
    S.tree = add(makeTree(2.2), .8, 0, -.8);
    S.soil = add(new THREE.Mesh(cyl(1.3, 1.5, .2, 24), std(0x5a3a26, { rough: 1 })), .8, 0, -.8);
    S.bars = add(makeBars([.04, .2, .95, 0], { colors: [0x8a4b32, 0x6fb8ff, 0xb8c2dc, GOLD], labels: ['soil', 'water', 'air', 'light'] }), 3.2, 0, .6);
    Cam.set([5.4, 3.2, 10.2], [.6, 1.4, -.2]);
  },
  async run() {
    const c = W.guide;
    await until(2.4);
    await N('Quick check. A tree can weigh a few tonnes. Where did most of that mass come from?');
    const r = await Quiz.ask({
      q: 'Where does most of a tree’s mass come from?',
      choices: ['Minerals from the soil', 'Water from the roots', 'Carbon dioxide from the air', 'Sunlight'],
      answer: 2,
      explain: 'Dry wood is about half carbon, and every bit of it came in through the leaves as CO₂.',
      timeout: 12,
    });
    if (r.correct) { c.set('proud'); FX.burst([-2.4, 1.6, .6], { n: 30 }); await N('Exactly right. Most of a tree is made from air.'); }
    else { c.set('surprised'); await N('The answer is the air. Most of a tree is made from carbon dioxide.'); }
    await S.bars.userData.grow(1.4);
    await N('The soil only gives a little: minerals like nitrogen. The carbon, the bulk of the wood, came from the sky.');
    c.set('happy');
    await wait(1);
  },
},

/* ======================= 04 · recap ======================= */
{
  id: 'recap', num: '04', group: 'RECAP', hold: true, dock: false, titleCard: false, sky: 'dusk', dur: 30,
  name: 'Recap', title: 'Recap', blurb: 'The whole film on one page.',
  setup() {
    const c = W.guide; c.set('happy');
    const narrow = matchMedia('(max-width: 900px)').matches;
    c.at(narrow ? 0 : -3.1, .3, .4);
    S.plant = add(makePlant(1.1), narrow ? 1.2 : -1.8, 0, -.8);
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
