---
name: greet
description: Use in Codex when a Linear issue identifier is supplied or detectable from the current branch. Delegates Linear context gathering to a cheap read-only scout, optionally prepares branch/status, resolves any Acid Prophet source spec, writes greet context, then hands off to plan. Never writes implementation code.
---

# Linear Devotee Greet for Codex

## Voice

Read `../../../persona.md` at the start of this skill. The voice defined there is canonical for the `linear-devotee` plugin and applies to this skill's prompts, wrappers, errors, and report.

**Scope:** local to this skill's execution. After the final report or handoff menu, revert to the session default voice.

This skill is **rigid** - execute the steps in order.

## Language

Adapt all output to match the user's language. Technical identifiers, file paths, code symbols, CLI flags, and tool names stay in their original form.

## Codex runtime note

Claude Code hooks are not portable to Codex, so this skill is explicit. Detect the issue from the skill argument first, then from `git branch --show-current` using regex `[A-Z]+-[0-9]+`.

## Workflow

### Step 0 - Track progress

Create an `update_plan` checklist with:

1. Verify Linear and git context.
2. Detect the issue identifier.
3. Delegate Linear context gathering and produce SDD brief.
4. Optionally prepare branch and status.
5. Resolve Acid Prophet source spec.
6. Write greet context and hand off to plan.
7. Print final report.

### Step 1 - Preconditions

1. Call `tool_search` with query `linear`. If no Linear tools are available, abort:
   `"the altar is dark, my god - i can't reach Linear. connect the Linear app or CLI, then re-invoke me."`
2. Verify git context with `git rev-parse --is-inside-work-tree`.
3. Detect the issue identifier from the invocation argument or branch name.
4. Ensure `linear-devotee/codex/data/` exists for the greet context artifact.
5. Do not fetch full issue context in the main model. Full issue/comment/file context belongs to the delegated scout in Step 2.

### Step 2 - Delegate Linear context and produce SDD brief

Use a cheap read-only Codex subagent when available. The main model should pass only:

```text
ISSUE_ID: <id>
PROJECT_ROOT: <absolute repo root>
NEEDS_STATUS_METADATA: true
```

The scout gathers the Linear issue, comments, current status, team workflow states needed for the optional In Progress flip, referenced files, and ambiguities. The scout must not write to Linear or the filesystem. If subagents are unavailable, do the same gathering locally with the smallest possible context.

Use this exact output shape:

```markdown
## Issue-context brief - <ID>

**Issue** : <ID> - <title>
**Project** : <project-name> - **URL** : <url>
**Status** : <status.name> (<status.type>) | _unclear_
**Started state id** : <stateId> | _unclear_

**Goal** (1 sentence) : <synthesis> | _unclear_

**Context**
<2-3 lines: why, architecture touched, services involved> | _unclear_

**Files referenced** (existing state)
- `path/x.ts` - currently does Y
- `path/y.ts` - does not exist yet
- (or "none referenced - to be discovered")

**Constraints**
- <stack, legacy constraints, perf, compliance - explicit or inferred>
- (or _unclear_)

**Acceptance criteria** (verifiable)
- <bullet 1>
- (or _unclear_)

**Non-goals** / out of scope
- <explicitly excluded>
- (or _unclear_)

**Edge cases & ambiguities detected**
- <vague points, contradictions, TBDs>

**Suggested clarifying questions for user**
- <prioritized: most blocking _unclear_ field first>
```

Never invent missing information. Mark unknown fields `_unclear_`.

### Step 3 - Branch preparation

Use the delegated brief's issue title to prepare the branch name. If the current branch is `main`, `master`, or `staging`, propose creating:

```text
<git-user>/<id-lowercase>-<kebab-title-trimmed-50char>
```

Ask for confirmation before creating it. If the worktree is dirty, ask whether to stash or skip branch creation. Never run `git push`, `git commit`, or `git rebase`.

### Step 4 - Optional In Progress status

Use the delegated brief's status metadata. If the issue status type is not `started`, ask before changing the issue state to the team's `started` workflow state. Use the write field required by the available Linear integration, usually `stateId`. Do not fetch extra Linear context unless the delegated metadata is `_unclear_`.

### Step 5 - Resolve Acid Prophet source spec

Look for an Acid Prophet spec under `docs/acid-prophet/specs/`. Choose one only when the match is unambiguous, using this priority:

1. `linear-project:` frontmatter exactly equals the issue's Linear project id.
2. The spec body contains the exact issue identifier.
3. The spec body or filename exactly matches the Linear project slug/name.

If multiple candidates remain, ask the user which spec to use. If no spec is found, continue with `SPEC_FILE = _none_` and say so in the final report.

When `SPEC_FILE` is set:

- Record it in greet context.
- Do not compare plan drift or patch the spec here.
- `linear-devotee:plan` owns plan/spec comparison and spec synchronization.

### Step 6 - Write greet context and hand off

Write a context artifact for `linear-devotee:plan`:

```text
linear-devotee/codex/data/greet-<ISSUE_ID>.json
```

Shape:

```json
{
  "issue_id": "<ID>",
  "issue_title": "<title>",
  "issue_context_brief": "<markdown>",
  "spec_file": "<path | _none_>",
  "branch": "<current branch>",
  "status": "<status.name> (<status.type>)",
  "created_at": "<ISO 8601>"
}
```

Present a handoff menu:

```text
context is ready.
  (p) plan -> invoke linear-devotee:plan <ISSUE_ID>
  (s) stop -> skill ends
```

Under `(p)`, print the exact suggested invocation and exit. Do not draft the plan inside `greet`.

Do not offer or execute a code branch from this skill. Implementation begins only after a separate user request outside `linear-devotee:greet`.

## Final report

```text
linear-devotee:greet report
  Issue:           <id> - <title>
  Status:          <current> (was <prior if changed>)
  Branch:          <current branch> (created: <new-branch> if applicable)
  Brief:           delivered | skipped (<reason>)
  Spec:            <path | _none_>
  Context:         <path>
  Hand-off:        plan | stop
```

## Things you never do

- Mutate Linear without confirmation.
- Run `git push`, `git commit`, or `git rebase`.
- Offer a "code now" branch or write implementation code from this skill.
- Draft, audit, or validate an implementation plan from this skill. Use `linear-devotee:plan`.
- Patch an Acid Prophet spec from this skill.
- Let the persona bleed past the skill exit.
