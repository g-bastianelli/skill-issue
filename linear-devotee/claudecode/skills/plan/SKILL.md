---
name: linear-devotee:plan
description: Use when planning implementation for a Linear issue after greet or from an issue id. Loads or rebuilds the greet context, resolves the Acid Prophet source spec, iterates on a plan with delegated review, flags spec drift, writes a validated plan artifact, then syncs the spec only after plan validation. Never writes implementation code.
---

# linear-devotee:plan

## Voice

Read `../../../persona.md` at the start of this skill. The voice defined there is canonical for the `linear-devotee` plugin and applies to all output of this skill.

**Scope:** this voice is local to this skill's execution. Once the final report is printed, revert to the session default voice.

This skill is **rigid** — execute the steps below in order, no shortcuts.

## Language

Adapt all output to match the user's language. If the user writes in French, respond in French; if English, in English; if mixed, follow their lead. Technical identifiers (file paths, code symbols, CLI flags, tool names) stay in their original form regardless of language.

## When you're invoked

The user wants an implementation plan for a Linear issue. This skill is usually invoked after `linear-devotee:greet`, but it can rebuild context from an issue id when needed.

## Step 0 — Preconditions

1. Verify Linear access with `ToolSearch` query `linear` only if no greet context is available.
2. Verify cwd is inside a git repo with `git rev-parse --is-inside-work-tree`.
3. Create `${CLAUDE_PLUGIN_ROOT}/data/plans/`.
4. Detect the issue identifier from the skill argument, current branch, or `${CLAUDE_PLUGIN_DATA}/state-<session_id>.json`. Use regex `[A-Z]+-[0-9]+`.
5. If no issue id is available, ask for one.

## Step 1 — Load or rebuild greet context

Prefer the greet context file:

```text
${CLAUDE_PLUGIN_ROOT}/data/greet-<ISSUE_ID>.json
```

Expected shape:

```json
{
  "issue_id": "<ID>",
  "issue_context_brief": "<markdown>",
  "spec_file": "<path | _none_>",
  "created_at": "<ISO 8601>"
}
```

If it is missing, dispatch the `linear-devotee:issue-context` subagent:

```
ISSUE_ID: <id>
PROJECT_ROOT: <git rev-parse --show-toplevel result>
NEEDS_STATUS_METADATA: true
```

Use the returned brief as `ISSUE_CONTEXT_BRIEF`. Do not fetch full Linear context in the main conversation unless the issue-context cannot run.

## Step 2 — Resolve source spec

If the greet context has `spec_file`, verify it still exists.

Otherwise search `<PROJECT_ROOT>/docs/acid-prophet/specs/` and choose one only when the match is unambiguous, using this priority:

1. `linear-project:` frontmatter exactly equals the issue's Linear project id.
2. The spec body contains the exact issue identifier.
3. The spec body or filename exactly matches the Linear project slug/name.

If multiple candidates remain, ask the user which spec to use. If no spec is found, continue with `SPEC_FILE = _none_`.

## Step 3 — Draft the plan artifact

Create or update:

```text
${CLAUDE_PLUGIN_ROOT}/data/plans/<ISSUE_ID>.md
```

Use this shape:

```markdown
---
issue: <ISSUE_ID>
spec: <SPEC_FILE | _none_>
status: draft
plan-version: 1
validated-at: _none_
spec-synced-at: _none_
---

# Plan - <ISSUE_ID>

## Source Context
- Linear brief: loaded from greet context
- Spec: <path | _none_>

## Implementation Plan
1. <step>

## Files / Modules
- `path/file.ts` - <expected change>

## Tests / Verification
- <test or command>

## Spec Drift
- <decision> -> <spec section> | none

## Open Questions
- <question> | none

## Change Log
- <ISO 8601> - draft created
```

The artifact is planning state, not implementation. Keep code snippets out unless they are short contracts.

## Step 4 — Delegate plan review

Dispatch `linear-devotee:plan-auditor` with:

```text
PROJECT_ROOT: <absolute repo root>
SPEC_FILE: <SPEC_FILE | _none_>
ISSUE_CONTEXT_BRIEF:
<brief markdown>

PROJECT_PLAN_CONTEXT:
<known project-level plan or _none_>

IMPLEMENTATION_PLAN:
<plan markdown>
```

The auditor returns:

```text
PLAN_REVIEW: pass | needs_changes
SPEC_DRIFT_DETECTED: yes | no
DRIFT_ITEMS:
- <accepted plan decision> -> <spec section that must change>
BLOCKERS:
- <blocking mismatch or ambiguity>
```

Do not modify the auditor's output. Summarize it beside the plan.

## Step 5 — Iterate until validated

If `PLAN_REVIEW = needs_changes`, revise the plan artifact and repeat Step 4.

If blockers are user-decision blockers, ask one question at a time. After each answer, update the plan artifact and repeat Step 4.

If `SPEC_DRIFT_DETECTED = yes`, show the drift items beside the plan but do not patch the spec yet.

When the plan is review-clean or all remaining drift is intentional, ask for explicit validation:

```text
validate this plan, my god? (y / edit / stop)
```

Only continue on `y`. On `edit`, revise the plan and repeat Step 4. On `stop`, print the final report with `status: draft`.

## Step 6 — Sync accepted spec drift

After validation:

1. Update the plan artifact frontmatter: `status: validated`, increment `plan-version` if revised, set `validated-at` to the current ISO 8601 timestamp.
2. If `SPEC_DRIFT_DETECTED = yes` and `SPEC_FILE` exists, preview a compact spec patch summary:
   - decision accepted,
   - target section,
   - before/after intent.
3. Ask before applying the spec patch:

```text
sync accepted drift into the Acid Prophet spec? (y / skip)
```

4. On `y`, patch `SPEC_FILE` once with the accepted decisions, update `last-reviewed` to today's ISO date, set `spec-synced-at` in the plan artifact, and run `acid-prophet:scry` if available.
5. On `skip`, leave `spec-synced-at: _none_` and report that implementation should not start until drift is synced or consciously waived.

## Step 7 — Handoff

Do not start implementation. End with a clear implementation-ready or blocked status.

## Final report (always print)

```
linear-devotee:plan report
  Issue:           <id>
  Plan artifact:   <path>
  Spec:            <path | _none_>
  Plan review:     pass | needs_changes | skipped
  Drift:           yes | no
  Spec sync:       applied | skipped | n/a
  Hand-off:        implementation_ready | blocked | stopped
```

## Things you NEVER do

- Write implementation code
- Mutate Linear issues, projects, or milestones
- Run `git push`, `git commit`, or `git rebase`
- Patch an Acid Prophet spec before the plan is explicitly validated
- Hide drift. If the plan differs from the source spec, flag it
- Let the persona bleed past the skill exit

## Voice cheat sheet

Use the palette from `../../../persona.md`. Specific applications in this skill's strings stay short; the plan and audit content are neutral.
