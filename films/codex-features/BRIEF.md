# Brief: "Codex features" learning film

Build with the `explainer-film` skill (`.claude/skills/explainer-film/SKILL.md`). Work in this folder (`films/codex-features/`); `story.js` is the untouched starter, so rewrite it.

- **Audience:** a software team that already uses Codex as a chat, and should learn the features that turn it into a crew.
- **Language:** English. **Voice:** `en-US-AndrewMultilingualNeural` (voice.json).
- **Length:** about 6 minutes; 8 scenes (title, 5 teaching, quiz, recap).
- **Board:** `term` mode, title `~/shop — codex`. The story follows the team's Codex through one week on an app called "shop".
- **Branding:** don't use OpenAI logos or imitate the exact Codex UI. Use our own mascot. Suggested colors: `hero: 0x6c8cff, heroHi: 0xa9bbff, heroInk: 0x0b1030`.
- **Accuracy:** teach only the facts below. They were verified 2026-10-14 against the official manual (https://learn.chatgpt.com/docs/codex-manual.md) and Codex CLI 0.160.1. Don't add features or flags that aren't listed. Put "as of Codex CLI 0.160, October 2026" in the recap lede.

## Verified facts (use these, exactly)

| Feature | How | What for |
|---|---|---|
| AGENTS.md | global `~/.codex/AGENTS.md` (or `AGENTS.override.md`), then one per folder from the Git root down to the current folder; joined root first, so the closest file wins; 32 KiB cap | standing project rules |
| /init | `/init` | writes a starter AGENTS.md |
| Skills | folder with `SKILL.md` (`name`, `description`); repo `.agents/skills`, user `~/.agents/skills`; call with `$skill-name` or `/skills`; loaded only when needed | reusable workflows |
| Sandbox | `-s read-only` / `workspace-write` / `danger-full-access`; switch in a session with `/permissions` | how far Codex may act |
| Auto-review | `--approve-for-me`: a reviewer model answers eligible approval requests | fewer approval prompts |
| Full access | `--dangerously-bypass-approvals-and-sandbox` (alias `--yolo`), not recommended | throwaway machines only |
| Review | `/diff` shows all changes, including untracked files; `/review` reviews the diff; headless `codex review --base main` | check before committing |
| Subagents | ask in plain words ("spawn one agent per bug…"); built-in agents `default`, `worker`, `explorer`; custom agents are TOML files in `.codex/agents/`; uses more tokens | parallel independent jobs |
| Worktrees | `codex --worktree` gives a task its own Git checkout | parallel edits without collisions |
| Goals | `/goal <checkable condition>` keeps working toward a long-running goal | long work with a finish line |
| Codex Cloud | `codex cloud exec --env <ID> "task"`; results come back with `codex apply` (or `codex cloud apply`) | run tasks remotely |
| GitHub review | comment `@codex review` on a pull request (once code review is enabled for the repo) | PR reviews |
| MCP | `codex mcp add <name> -- <cmd>` or `--url <url>`; `/mcp` | connect outside tools |
| Plugins | bundles of skills, connectors and MCP servers; `codex plugin marketplace add owner/repo`; `/plugins` | share setups across a team |
| Hooks | `.codex/hooks.json` (or `~/.codex/hooks.json`); events include PreToolUse, PostToolUse, PermissionRequest, SessionStart, Stop; `/hooks`; project hooks need a trusted project | your scripts at fixed moments |
| Headless | `codex exec "…" --json -o last.txt` | CI and scripts |
| Sessions | `codex resume`, `codex fork` | pick up or branch a session |

**Outdated, don't teach:** `--full-auto` (deprecated), `/approvals` (now `/permissions`), approval policy `untrusted` (removed).

## Storyboard

| # | id | title | idea | metaphor / props | board |
|---|---|---|---|---|---|
| 00 | start | Codex, Fully Loaded | hero; the promise: rules, sandboxes, parallel agents, goals, cloud and hooks turn a chat into a crew | guide typing at a laptop, slow orbit | hidden |
| 01 | rules | House Rules | `/init` writes AGENTS.md; the closest one wins; skills and `$name` | AGENTS.md card drops in, a smaller nested card for a subfolder, a stack of "skill" books with a `$release-notes` tag | `/init` typed, Write tool ok, `$release-notes` |
| 02 | sandbox | The Sandbox | read-only vs workspace-write vs full access; `/permissions`; `--approve-for-me`; `/diff` and `/review` before commit | three pedestals with tags; guide walks to each; a padlock unlocks on workspace-write; the full-access pedestal turns red with a camera shake; a REVIEWED stamp slams | `/permissions` output, `/review` findings |
| 03 | crew | Many Hands | subagents in plain words; built-in and custom agents; `--worktree` per task | three mini guides pop in on their own pedestals (worktrees) with laptops, orbs go out and back | the typed request, a TOML snippet for `.codex/agents/reviewer.toml`, the worktree command |
| 04 | longhaul | The Long Haul | `/goal`; Codex Cloud + `codex apply`; `@codex review` on PRs | a tank fills with a "goal" meter; an orb flies up to a sky ring (cloud) and back; a PR card with a stamp | `/goal …`, shellLine `codex cloud exec …`, `codex apply` |
| 05 | plugin | Plug It In | MCP, plugins and marketplace, hooks, `codex exec --json -o`, resume/fork | signs for tools connected by tubes, a hook blocks a dangerous command (red), a pipeline of pedestals for CI | `codex mcp add`, a Bash tool err "blocked by PreToolUse hook", the exec command |
| 06 | check | Quick Check | quiz: Codex must edit files and run tests in the repo and nothing else, so which sandbox? answer workspace-write | — | Quiz.ask, plus both outcome lines |
| 07 | recap | Recap | one-page cheat sheet + team challenge (3 tasks) | guide waving | Recap.show |

Concept chips: RULE (rules), BOX (sandbox), CREW (crew), GOAL (longhaul), PLUG (plugin).
