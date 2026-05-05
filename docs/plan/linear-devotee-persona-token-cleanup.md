# Linear Devotee Persona and Token Cleanup Plan

## Objective

Keep Linear Devotee fun while reducing token load and avoiding unnecessary read confirmations.

Serious artifacts stay neutral:

- Specs.
- Plans.
- Audits.
- SDD drafts.
- Linear descriptions.

Persona output is decorative only. It must never restate, summarize, or interpret task facts.

## Decisions

### Prefix Everywhere

All exposed skill names stay prefixed in both Claude Code and Codex:

```yaml
name: linear-devotee:greet
name: linear-devotee:plan
name: linear-devotee:create-project
name: linear-devotee:create-milestone
name: linear-devotee:create-issue
```

This intentionally favors operational clarity over Claude Code's automatic plugin namespacing convention.

Keep file and folder names practical:

```text
greet/
plan/
create-project/
create-milestone/
create-issue/
```

### Persona as Decoration

The persona line is a visual flourish around normal skill output. It does not replace or rewrite skill feedback.

Allowed:

- One short decorative line at visible transitions.
- Fanatical, devotional, dramatic tone.
- Non-explicit body-as-metaphor.
- User-language matching.

Forbidden:

- Mentioning issue identifiers, specs, files, Linear state, plan content, or code.
- Summarizing what happened.
- Giving instructions or decisions.
- Writing into specs, plans, audits, SDD drafts, or Linear descriptions.
- Explicit sexual content.

## Phase 0 - Worktree and Cleanup

- Check `git status --short`.
- Remove the experimental `linear-devotee/references/` and `linear-devotee/templates/` files.

## Phase 1 - Shared Persona Contract

Create:

```text
linear-devotee/shared/persona-line-contract.md
```

The contract should be short and runtime-oriented:

- Return one decorative line only.
- Match `lang`.
- Respect `phase` and `intensity`.
- Max 20 words.
- No task facts.
- No reformulation.
- JSON output only:

```json
{ "line": "<decorative line>" }
```

Keep `linear-devotee/persona.md` as the editorial bible for humans and future style audits.

## Phase 2 - Claude Code Persona Agent

Create:

```text
linear-devotee/claudecode/agents/persona-writer.md
```

Frontmatter intent:

```yaml
name: persona-writer
model: haiku
tools:
  - Read
```

Responsibilities:

- Read only `linear-devotee/shared/persona-line-contract.md`.
- Accept only minimal event metadata:

```text
LANG: fr | en | neutral
PHASE: start | success | blocked | handoff | cancel
INTENSITY: low | medium | high
```

- Return strict JSON only.
- Use no Linear tools.
- Never inspect repo files.
- Never block the workflow if unavailable.

## Phase 3 - Codex Equivalent

Codex should follow the same persona-line contract opportunistically:

- Prefer the cheapest available subagent/delegation path when available.
- Otherwise generate one line locally from the same contract.
- If generation fails or is inappropriate, skip the line silently.

The workflow must never depend on persona output.

## Phase 4 - Skill Integration

Integrate persona lines into:

```text
linear-devotee/claudecode/skills/greet/SKILL.md
linear-devotee/claudecode/skills/plan/SKILL.md
linear-devotee/claudecode/skills/create-project/SKILL.md
linear-devotee/claudecode/skills/create-milestone/SKILL.md
linear-devotee/claudecode/skills/create-issue/SKILL.md
linear-devotee/codex/skills/greet/SKILL.md
linear-devotee/codex/skills/plan/SKILL.md
linear-devotee/codex/skills/create-project/SKILL.md
linear-devotee/codex/skills/create-milestone/SKILL.md
linear-devotee/codex/skills/create-issue/SKILL.md
```

Only call the persona writer at visible transitions:

- `start`
- `success`
- `blocked`
- `handoff`
- `cancel`

Display format:

```text
<decorative persona line>

<normal skill feedback/report/menu>
```

## Phase 5 - Claude Code Permissions

Add `allowed-tools` to Claude Code skill frontmatter where useful.

Safe defaults:

```yaml
allowed-tools: Read, Glob, Grep
```

Add narrow Bash permissions only for read-only commands when needed.

Never pre-approve:

- Linear mutations.
- `git commit`.
- `git push`.
- `git rebase`.
- Destructive git or filesystem commands.

## Phase 6 - Token Cleanup

Shrink `SKILL.md` files without making normal runtime execution depend on large reads.

Keep inline:

- Core workflow.
- Mutation gates.
- Handoff rules.
- Final report shape.
- Minimal persona integration rule.

Move out of hot path:

- Long examples.
- Maintenance notes.
- Large templates.
- Editorial persona guidance.

## Phase 7 - Validation

Run:

```bash
rg '^name:' linear-devotee/claudecode/skills linear-devotee/codex/skills
git diff --check
bunx biome check linear-devotee docs/plan/linear-devotee-persona-token-cleanup.md
```

Expected:

- All exposed skill names are `linear-devotee:*`.
- Persona writer is decorative only.
- Serious artifacts remain neutral.
- No workflow blocks on persona generation.
- Plugin manifests still parse.
