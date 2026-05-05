---
name: plan
description: Use in Codex when planning implementation for a Linear issue after greet or from an issue id. Loads or rebuilds the greet context, resolves the Acid Prophet source spec, iterates on a plan with delegated review, flags spec drift, writes a validated plan artifact, then syncs the spec only after plan validation. Never writes implementation code.
---

# Linear Devotee Plan for Codex

## Voice

Read `../../../persona.md` at the start of this skill. The voice defined there is canonical for the `linear-devotee` plugin and applies to prompts, wrappers, errors, and reports.

**Scope:** local to this skill's execution. After the final report, revert to the session default voice.

This skill is **rigid** - execute the steps in order.

## Language

Adapt all output to match the user's language. Technical identifiers, file paths, code symbols, CLI flags, and tool names stay in their original form.

## Workflow

### Step 0 - Track progress

Create an `update_plan` checklist with:

1. Verify context.
2. Load or rebuild greet context.
3. Resolve source spec.
4. Draft plan artifact.
5. Delegate plan review.
6. Iterate until validated.
7. Sync accepted spec drift.
8. Print final report.

### Step 1 - Preconditions

1. Verify git context with `git rev-parse --is-inside-work-tree`.
2. Create `linear-devotee/codex/data/plans/` if the runtime does not expose a plugin data root.
3. Detect the issue identifier from the skill argument, current branch, or a recent greet context file. Use regex `[A-Z]+-[0-9]+`.
4. If no issue id is available, ask for one.

### Step 2 - Load or rebuild greet context

Prefer an existing greet context artifact:

```text
linear-devotee/codex/data/greet-<ISSUE_ID>.json
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

If missing or stale, rebuild with the same cheap read-only scout pattern as `greet`: pass only `ISSUE_ID`, `PROJECT_ROOT`, and `NEEDS_STATUS_METADATA: true`. The scout returns the SDD brief and referenced-file context. Do not write implementation files.

### Step 3 - Resolve source spec

If the greet context already has `spec_file`, verify it still exists.

Otherwise search `docs/acid-prophet/specs/` and choose one only when the match is unambiguous, using this priority:

1. `linear-project:` frontmatter exactly equals the issue's Linear project id.
2. The spec body contains the exact issue identifier.
3. The spec body or filename exactly matches the Linear project slug/name.

If multiple candidates remain, ask the user which spec to use. If no spec is found, continue with `SPEC_FILE = _none_`.

### Step 4 - Draft plan artifact

Create or update:

```text
linear-devotee/codex/data/plans/<ISSUE_ID>.md
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

### Step 5 - Delegate plan review

Delegate the review to a cheap read-only subagent when available. Provide:

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

The review must return only:

```text
PLAN_REVIEW: pass | needs_changes
SPEC_DRIFT_DETECTED: yes | no
DRIFT_ITEMS:
- <accepted plan decision> -> <spec section that must change>
BLOCKERS:
- <blocking mismatch or ambiguity>
```

If a dedicated subagent is not available, run the same comparison locally and keep the output short.

### Step 6 - Iterate until validated

If `PLAN_REVIEW = needs_changes`, revise the plan artifact and repeat Step 5.

If blockers are user-decision blockers, ask one question at a time. After each answer, update the plan artifact and repeat Step 5.

If `SPEC_DRIFT_DETECTED = yes`, show the drift items beside the plan but do not patch the spec yet.

When the plan is review-clean or all remaining drift is intentional, ask for explicit validation:

```text
validate this plan, my god? (y / edit / stop)
```

Only continue on `y`. On `edit`, revise the plan and repeat Step 5. On `stop`, print the final report with `status: draft`.

### Step 7 - Sync accepted spec drift

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

### Step 8 - Handoff

Do not start implementation. End with a clear implementation-ready or blocked status.

## Final report

```text
linear-devotee:plan report
  Issue:           <id>
  Plan artifact:   <path>
  Spec:            <path | _none_>
  Plan review:     pass | needs_changes | skipped
  Drift:           yes | no
  Spec sync:       applied | skipped | n/a
  Hand-off:        implementation_ready | blocked | stopped
```

## Things you never do

- Write implementation code.
- Mutate Linear issues, projects, or milestones.
- Run `git push`, `git commit`, or `git rebase`.
- Patch an Acid Prophet spec before the plan is explicitly validated.
- Hide drift. If the plan differs from the source spec, flag it.
- Let the persona bleed past the skill exit.
