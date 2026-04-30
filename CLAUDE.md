# skill-issue

Personal Claude Code (sometimes Codex) plugin marketplace. Three plugins right now: `saucy-status`, `react-monkey`, `linear-simp`.

When creating a new plugin/skill/agent, stay within these defaults. Any deviation needs a real reason.

---

## Vibe (don't skip this)

This marketplace is unapologetically **brainrot-coded**. **Brainrot forever.** Each plugin has its own dumb personality and answers in character — that's the product, not a quirk. The plugin names, personas, and user-facing voices are load-bearing.

New plugins follow this energy:

- **Plugin name** = fun/absurd internet-meme word that sets a theme: `saucy-status` (saucy/gooning), `react-monkey` (chaotic creature), `linear-simp` (devoted simp). Family-resemblance with the existing trio. Tier list of acceptable directions: brainrot internet slang (skibidi, rizz, sigma — only if it lands), animal/creature, kink-adjacent personas, mythical figures. **Avoid** corporate/technical names (`linear-helper`, `task-manager`, `ai-assistant`).
- **Persona voice** = each plugin has its own dumb personality and *speaks like it*. Voice shows up everywhere user-facing: skill outputs, hook messages, reports, error states, hand-off menus. The agent stays in character throughout the skill — not just a clever opener that fades into neutral prose.
  - `saucy-status` → suggestive, "saucy"/"gooning" modes
  - `react-monkey` → competent creature, neutral-fun, light chaos
  - `linear-simp` → devoted simp / boss-worship: "yes king", "the gooner came back boss", "this issue is PEAK", "boss... fine 😔", "right away daddy", "👑" / "🥺"
  - Future plugins → invent the persona at brainstorm time, write it down in the plugin README, and apply it consistently. The persona is a constraint that informs every string the user reads.
- **Reports follow the voice**. Example from `linear-simp:greet`:
  ```
  linear-simp:greet report
    Issue:        ENG-247 — fix the logging
    Status:       In Progress (was Backlog)
    Branch:       g-bastianelli/eng-247-fix-logging (created)
    Brief:        delivered (gooner)
    Hand-off:     plan
  ```
  The structure is serious, the surrounding lines ("the gooner came back king 🥺", "boss is boss 😔") are brainrot. Same skill, same voice end-to-end.
- **Hard rule**: actions stay serious, voice stays brainrot. No fantasy side-effects, no joke commits, no "lol whoops" failure modes. Only the *strings* are fun.
- **Use emojis sparingly**. 🥺 / 👑 / 😔 / 🔥 land. Anything more is over-emoji and feels AI-slop.

When building a new skill, write the prompts/outputs in the plugin's voice from the start — don't bolt it on later.

---

## Stack & tooling

- **Runtime hooks/scripts**: Node.js, **ESM** (`import` / `export`). **`.mjs`** extension is mandatory for hooks and tests (zero ambiguity for Node, no `package.json` needed in the plugin, plugin is self-contained regardless of install context). `saucy-status` stays on CJS for historical reasons. Every new plugin ships ESM `.mjs`. Reference: `linear-simp/claudecode/hooks/*.mjs`.
- **Package manager**: `bun@1.3.x` (declared in root `package.json`).
- **Tests**: `bun test` (built-in, no dep added). Tests live in `<plugin>/<runtime>/tests/`.
- **Lint/format**: `biome` (config in `biome.json`). Formatter off, linter on. Local rule: `noUnusedVariables` is on → use `catch {}` (not `catch (e)`) when the binding is unused. Biome will auto-organize imports — let it.
- **Pre-commit**: `lefthook` runs `bunx biome check .`. **Never bypass** with `--no-verify`.
- **No npm/bun deps added** in plugins. Stick to `node:fs`, `node:path`, `node:os`, `node:child_process`. If a plugin really needs a dep, raise it first.

---

## Naming conventions

### Plugins
Fun/absurd brainrot name that announces a theme: `saucy-status`, `react-monkey`, `linear-simp`. Cohesive marketplace family.

### Skills
Action verb or gerund describing what the skill does:
- `implement`, `explore`, `greet`, `writing-plans`, `systematic-debugging`
- No generic role names (`coder`, `helper`, `utils`)
- **Codex**: `name:` in `SKILL.md` is short and **without** plugin prefix. The prefix comes from the plugin → `react-monkey` + `implement` = `$react-monkey:implement`.
- **Claude Code**: `name:` in `SKILL.md` includes the **full** prefix (`name: react-monkey:implement`). Claude Code must never expose `/implement` alone.
- The same capability can have two internal names depending on runtime, but the visible ID is always prefixed.

### Agents
Descriptive role or task name:
- `explorer`, `gooner`, `code-reviewer`, `security-analyzer`
- No vague names (`agent`, `helper`)
- `name:` in frontmatter is **without** plugin prefix (the runtime adds it). Ex: `name: gooner` → exposed as `linear-simp:gooner`.

### Resulting IDs
```
react-monkey:implement   ✅
react-monkey:explorer    ✅
linear-simp:greet        ✅
linear-simp:gooner       ✅
implement                ❌  (no visible ID without plugin prefix)
react-monkey:coder       ❌  (generic role name for a skill)
react-coder:react-coder  ❌  (plugin/skill duplicate)
```

---

## Plugin structure

### Claude Code-only plugin
```
<plugin-name>/
├── README.md                    # English, banner at top, install snippet
├── assets/
│   └── banner.png               # 3:1 banner, embedded in README
└── claudecode/
    ├── .claude-plugin/
    │   └── plugin.json          # declares hooks and metadata
    ├── hooks/                   # Node ESM .mjs scripts, optional
    ├── skills/<skill-name>/
    │   └── SKILL.md             # frontmatter with prefixed name
    ├── agents/                  # dedicated subagents, optional
    │   └── <agent-name>.md
    ├── tests/                   # bun test, optional
    └── data/
        └── .gitignore           # runtime state gitignored
```

### Cross-runtime plugin (Claude Code + Codex)
See `react-monkey/` for the pattern: a `claudecode/` folder and a `codex/` folder, each complete and self-contained. Skills are bundled in both runtimes with the naming adjustments described above.

### Marketplace registration
Add an entry to root `.claude-plugin/marketplace.json`. Use **`git-subdir` source** so it's versionable:
```json
{
  "name": "<plugin-name>",
  "source": {
    "source": "git-subdir",
    "url": "https://github.com/g-bastianelli/skill-issue",
    "path": "<plugin-name>/claudecode"
  },
  "category": "productivity" | "fun"
}
```
Also add a row in the root `README.md` plugins table and an install snippet.

---

## Architectural patterns

### Hooks (start-of-session detection / state)
- **`SessionStart`**: fires at startup. Reads branch, environment. Can output `additionalContext` to force a skill invocation.
- **`UserPromptSubmit`**: fires on every prompt. To detect something **only on the first prompt**, use a state file with `awaiting_prompt: true` set at SessionStart, closed on the first prompt.
- File pattern: `${CLAUDE_PLUGIN_ROOT}/data/state-<session_id>.json`.
- **Anti re-trigger**: a `greeted: true` flag (or equivalent) once the skill has run.
- **Lazy cleanup**: delete state files older than 7 days at SessionStart, best-effort, swallow exceptions.
- **Stdin JSON**: Claude Code passes `{session_id, prompt, ...}` to the hook via stdin. Read with `fs.readFileSync(0, 'utf8')` then `JSON.parse`.
- **`additionalContext` output**:
  ```js
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart' | 'UserPromptSubmit',
      additionalContext: '<EXTREMELY-IMPORTANT>...</EXTREMELY-IMPORTANT>'
    }
  }))
  ```

### Subagents (context preservation)
- **Always dispatch heavy work to a subagent** (MCP fetches, file reads, parsing). Main context only sees the synthesized result.
- **Dedicated subagent** (`agents/<name>.md` file) when:
  - The same worker is dispatched repeatedly with the same instructions
  - You want a strict tools allowlist (e.g., read-only)
  - The agent is reusable across skills
- **Generic subagent** (`general-purpose` with prompt embedded in the SKILL.md) only for one-shot, very contextual cases.
- **Explicit tools allowlist** in `tools:` frontmatter when restriction matters. Read-only example:
  ```yaml
  tools:
    - mcp__claude_ai_Linear__get_issue
    - mcp__claude_ai_Linear__list_comments
    - Read
    - Glob
    - Bash
  ```
- **Right-sized model** in `model:` frontmatter:
  - `claude-haiku-4-5-20251001` for mechanical parsing, fetch + summary
  - Default model for reasoning, decisions, code-writing
- **Standard input format** for the agent: short structured message (`ISSUE_ID: ...`, `PROJECT_ROOT: ...`).
- **Strict output format**: defined in the frontmatter, no free-form prose.

### Brief / spec format (input for AI agents)
2025 standard = **Spec-Driven Development (SDD)**, not STAR. Sections:
- **Goal** (1 sentence)
- **Context** (why, architecture touched)
- **Files referenced** (★ critical grounding)
- **Constraints** (stack, perf, compliance)
- **Acceptance criteria** (verifiable)
- **Non-goals** (out of scope)
- **Edge cases & ambiguities**
- **Suggested clarifying questions**

Missing fields → `_unclear_` + question. Never invent.

Sources: Thoughtworks, GitHub, JetBrains, O'Reilly, Addy Osmani — all publish SDD as the 2025 standard for AI-agent-bound tickets. STAR (Situation/Task/Action/Result) is from behavioral interviews, sub-optimal for agents.

### Persona / voice
Brainrot voice cohesive within each plugin. See the **Vibe** section above for the full persona inventory. Apply that voice in:
- Skill output strings
- Hook `additionalContext` messages
- Agent input/output (kept neutral inside the agent, voice happens in the calling skill)
- Final reports printed by skills

**Actions stay serious. Voice stays brainrot.** The humor is in the strings only.

### Skill report format
Skills that perform multiple actions (status changes, dispatches, branch ops) print a structured report at the end. Format:
```
<plugin>:<skill> report
  <Field>:        <value> [(was <prior>)]
  <Field>:        <value> [(<note>)]
  ...
```
Wrap the report with one or two voice lines, but the report itself is plain. Example block from `linear-simp:greet`:
```
the gooner came back king 🥺

linear-simp:greet report
  Issue:        ENG-247 — fix the logging
  Status:       In Progress (was Backlog)
  Branch:       g-bastianelli/eng-247-fix-logging (created)
  Brief:        delivered (gooner)
  Hand-off:     plan
```

---

## Dev workflow for a new plugin/skill

1. **Brainstorming** — naming (see Vibe), persona, scope.
2. **SPEC** (optional) — colocate at `<plugin>/SPEC.md` if useful as a reference doc. Otherwise skip and go straight to plan.
3. **PLAN** — `superpowers:writing-plans` is fine as a **dev tool**. The plan lives in `docs/superpowers/plans/...` during dev, **but is deleted before delivery**. No `superpowers:*` dependency must leak into the shipped plugin.
4. **TDD** for any Node helper or non-trivial logic (`bun test`).
5. **Subagent-driven dev** — dispatch a fresh subagent for each heavy task, keep the main context for coordination only.
6. **Frequent commits**: one commit per logical step (`feat(<plugin>): scaffold...`, `feat(<plugin>): add state helper`, etc.). Co-author tag is not required.

### Pre-push verification
```bash
bunx bun test <plugin>/                    # all tests pass
bunx biome check .                          # lint clean
node -e "JSON.parse(require('node:fs').readFileSync('.claude-plugin/marketplace.json', 'utf8'))"  # marketplace JSON valid
grep -rn "superpower\|writing-plans" <plugin>/   # no superpowers leak
```

### Defaults
- README in **English** (consistent with saucy-status, react-monkey, linear-simp).
- Banner PNG at `<plugin>/assets/banner.png`, embedded at the top of the README via `![](./assets/banner.png)`. 3:1 ratio. Style aligned with the marketplace family (see existing banners).
- License **MIT**.
- `data/.gitignore` for runtime state files.
- Squash-merge on `main` via GitHub PR (user workflow — no direct merge).

---

## Anti-patterns to avoid

- ❌ Pollute main context with MCP fetches / massive reads → **always dispatch to a subagent**
- ❌ Embed a long subagent prompt in a SKILL.md when it'll be reused → **dedicated agent in `agents/`**
- ❌ Subagent without tools allowlist when it should be read-only → **list the tools explicitly**
- ❌ STAR format for briefs targeting an agent → **SDD**
- ❌ Linear (or any external service) mutations without user confirmation, unless explicitly authorized and documented
- ❌ `git push`, `git commit`, `git rebase` silently executed by a skill → **never**
- ❌ `superpowers:*` dependency in the shipped plugin → **dev artifacts only, deleted before push**
- ❌ Adding an npm/bun dep "just for this plugin" → **discuss first**
- ❌ Bypassing pre-commit hook with `--no-verify` → **never**
- ❌ Corporate/neutral plugin names → **the brainrot is the brand**
- ❌ Banner or README in mixed languages → **English everywhere**

---

## Existing plugins — quick recap

| Plugin | What | Hooks | Skills | Agents |
|---|---|---|---|---|
| `saucy-status` | Saucy/gooning loading messages in statusline | SessionStart, UserPromptSubmit | — | — |
| `react-monkey` | React implementation specialist with parallel exploration | — | `implement` | `explorer` |
| `linear-simp` | Linear issue detection at session start, SDD brief, devoted simp persona | SessionStart, UserPromptSubmit | `greet` | `gooner` |
