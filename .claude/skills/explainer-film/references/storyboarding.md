# Storyboarding a learning film

The engine makes anything move. What makes a film teach is the script. Write the storyboard before any code.

## Contents
1. Shape of a film
2. Writing narration
3. One idea per scene: the scene recipe
4. Choosing the visual metaphor
5. The board is the notebook
6. Checks for understanding
7. Pacing and length
8. Storyboard template

## 1. Shape of a film

A good default is **title → hook → 3–6 teaching scenes → quick check → recap**.

- **Title (hero, hold):** the promise of the film in one sentence (`sub`), with the guide in an idle loop. It waits for Start.
- **Hook:** a puzzle, a surprising fact or a familiar pain ("Plants never eat, yet a tree weighs tonnes"). It makes the viewer want the answer.
- **Teaching scenes:** one concept each, building on the previous one. Name them like chapters ("Three Ingredients", "The Recipe").
- **Quick check:** a quiz on the idea most people get wrong. Narrate both outcomes.
- **Recap (hold, dock: false):** the whole lesson on one page, plus 2–3 "try it yourself" tasks.

A story arc (a character with a problem who gets better over time, like a week in the life of a worker) suits processes, tools and skills. A guided tour suits science, history and concepts. Pick one and keep it for the whole film.

## 2. Writing narration

- **Short lines:** 6–20 words, one thought per line. Each line becomes one subtitle and one voice clip.
- Use spoken language: contractions, plain words, no parentheses, no lists read aloud.
- Write numbers and symbols **as they should be spoken** when TTS might stumble ("carbon dioxide", not "CO₂"). Or keep the symbol in the subtitle and add a pronunciation in `voice.json` → `lexicon` (`{"CO₂": "C O two"}`).
- Use `<em>` to emphasize the key term the first time it appears. That term should also appear on the board.
- Don't narrate what's on screen word for word; narration explains why, the visuals show what.
- Vietnamese and other languages: write the narration natively. Don't translate English idioms literally. Keep lines short; Vietnamese TTS reads compound words better without hyphens or slashes.

## 3. One idea per scene: the scene recipe

Each teaching scene is about 25–50 seconds and 4–7 narration beats:

1. **Set the stage** (setup): props in place, camera framed, sky that matches the mood.
2. **Name the idea**: a board kicker and heading, a title card (automatic).
3. **Show, then tell**: each beat starts a visual action and the line that explains it, using `beat(line, visuals)`.
4. **Write it down**: a board entry per beat (bullet, step, definition, formula).
5. **Land it**: a camera push-in, a `Note.show` takeaway, or the guide reacting (`happy`, `hop`).
6. **Unlock**: `concept` on the scene so the HUD chip lights up.

Prefer `beat()` over absolute `until()` times. Beats stay in sync when a line is rewritten or re-voiced. Use `until()` only for the opening delay (about 2.2–2.6s, while the title card fades) or for visuals that must line up with each other rather than with the narration.

## 4. Choosing the visual metaphor

The 3D stage is a diorama, so make the abstract physical:

| concept type | metaphor |
|---|---|
| a quantity filling up (memory, budget, CO₂ in the air) | `makeTank` + `meterOn` |
| a flow or transfer (signals, money, nutrients, messages) | `send()` orbs along arcs, `makeTube` + `pulseTube` |
| a process with stages | pedestals or rings in a row, an object traveling through them |
| a comparison | `makeBars`, two characters side by side, two cards |
| a document, rule or definition | `makeCard` with `cardDraw`, `makeSign` |
| code or commands | the board in `term` mode, `codeDraw` on a laptop or card |
| a structure (atom, cell, solar system, org chart) | orbs orbiting with `tick()`, groups of meshes |
| a transformation | `shrink(a)` then `grow(b)`, a `FX.burst` at the swap |
| time passing | `sky()` transitions, the HUD `chip` (e.g. `['1850', 'Industrial Revolution']`) |
| roles, agents, people | `mini()` characters in distinct colors with `bubble()` lines |

Characters carry emotion: the guide is the learner's stand-in. Let it be confused (`thinking`, `worried`) before the idea lands and pleased after (`happy`, `proud`, `hop`).

## 5. The board is the notebook

What's on the board at the end of a scene is what the viewer should write in their notebook. Keep it to a heading plus 3–6 entries. Use `def()` for vocabulary, `math()` for formulas, `step()` for procedures, `code()` for code, and `Board.mode('term')` for command-line topics. Hide the board (`dock: false`) only for title, finale and pure-spectacle scenes.

## 6. Checks for understanding

- One `Quiz.ask` every 3–4 teaching scenes. Always test the misconception, not trivia.
- 3–4 choices; distractors should be the things people actually believe.
- `explain` gives the reason in one sentence. Then narrate the answer either way (two literal `N()` lines in the `if`/`else`).
- Optional: tally answers with `store.get('quiz.' + i)` in the recap.

## 7. Pacing and length

- About 130–150 spoken words per minute. A 5-minute film is about 650 words over 35–45 lines.
- Leave 0.5–1.5s of visual-only time after big reveals (`await wait(1.2)`).
- Set each scene's `dur` from `preview.mjs` (it reports the real end time).
- Long topics: make a series of films (one per chapter, 4–8 minutes each) rather than one 30-minute film.

## 8. Storyboard template

Write this before story.js and show it to the user if the topic or audience is unclear:

```
FILM: <title> — <one-line promise> — audience: <who> — language: <lang> — voice: <voice id>
00 title   | hero shot: <what the guide is doing>                       | sub: <promise>
01 <name>  | idea: <one sentence> | metaphor: <props> | board: <entries> | lines: 4–6
02 <name>  | ...
0n check   | question: <misconception> | choices | answer | explain
0n recap   | rows: <chip, name, when-to-use, hint> | challenge: <2–3 tasks>
```
