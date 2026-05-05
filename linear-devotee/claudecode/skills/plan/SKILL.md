---
name: linear-devotee:plan
description: Use when planning implementation for a Linear issue after greet or from an issue id. Loads or rebuilds greet context, resolves source spec, drafts and audits a plan, flags drift, writes a validated plan artifact, then syncs accepted spec drift only after validation. Never writes implementation code.
allowed-tools: Read, Glob, Grep
---

# linear-devotee:plan

Rigid planning gate. Match the user's language; keep technical identifiers unchanged.

> At visible transitions, dispatch `linear-devotee:devotee` with `SUMMARY: <≤15 words, in the user's language>` and print the returned `line` before normal output. Skip on failure.

## Workflow

1. Preconditions:
   - Verify git repo.
   - Create `${CLAUDE_PLUGIN_ROOT}/data/plans/`.
   - Detect issue id from argument, branch, state file, or recent greet context. Ask if absent.
   - Verify Linear access only when greet context must be rebuilt.
2. Load context:
   - Prefer `${CLAUDE_PLUGIN_ROOT}/data/greet-<ISSUE_ID>.json`.
   - If missing, dispatch `linear-devotee:issue-context` with issue id, git root, `NEEDS_STATUS_METADATA: true`.
   - Do not fetch full Linear context in main context unless delegation fails.
3. Resolve source spec:
   - Use `spec_file` from greet context if it still exists.
   - Otherwise search `docs/acid-prophet/specs/`, choosing only unambiguous matches:
     1. `linear-project:` equals issue project id.
     2. Spec body contains exact issue id.
     3. Body or filename matches project slug/name.
   - Ask if multiple candidates; use `_none_` if none.
4. Draft plan artifact at `${CLAUDE_PLUGIN_ROOT}/data/plans/<ISSUE_ID>.md` in spec-readable prose form:
   ```markdown
   ---
   issue: <ISSUE_ID>
   spec: <SPEC_FILE | _none_>
   status: draft
   plan-version: 1
   validated-at: _none_
   spec-synced-at: _none_
   ---

   # Plan — <ISSUE_TITLE> (<ISSUE_ID>)

   ## Issue context

   2–4 lines of prose: what triggered the work, the user-facing or system need, the source spec or business driver. Carry the "why" so the plan reads standalone.

   ## Approach

   Prose paragraph(s) describing the strategy: subsystems touched, order of operations, tradeoffs taken. The *shape* of the work, not a step list.

   ### Steps

   1. Ordered, concrete, verifiable actions.
   2. …

   ## Components / files

   Group by subsystem when relevant. Each entry: path + one-line role + the specific change.

   - `path/x.ts` — <role>; <change>

   ## Tests / Verification

   How we know it works. Specific assertions, not "tests pass". Distinguish unit / integration / manual smoke.

   ## Spec drift

   Specific drifts requiring spec adjustment after validation. Otherwise `_none_`.

   ## Open questions

   Blocking ambiguities for the user.

   ## Non-goals

   Explicitly out of scope for this plan.

   ## Change log

   Plan iterations (v1 draft, v2 after audit, v3 validated…).
   ```
   Aim for a document a reviewer can scan and understand without re-fetching the issue. Planning state only — never implementation code.
5. Audit:
   - Dispatch `linear-devotee:plan-auditor` with project root, spec file, issue brief, project plan context, and implementation plan.
   - Expected output: `PLAN_REVIEW`, `SPEC_DRIFT_DETECTED`, `DRIFT_ITEMS`, `BLOCKERS`.
6. Iterate:
   - If review needs changes, revise artifact and repeat audit.
   - Ask one user-decision blocker at a time.
   - Show drift beside the plan; do not patch spec yet.
   - Ask `Validate this plan? (y / edit / stop)`.
7. After validation:
   - Set plan `status: validated`, update `validated-at`, increment `plan-version` if revised.
   - If drift exists and spec exists, preview compact patch summary and ask `sync accepted drift into the Acid Prophet spec? (y / skip)`.
   - On `y`, patch spec once, update `last-reviewed`, set `spec-synced-at`, and run `acid-prophet:scry` if available.
   - On `skip`, leave `spec-synced-at: _none_` and report the waiver/blocker clearly.
8. Handoff:
   - Never start implementation.
   - End with implementation-ready, blocked, or stopped status.

## Final Report

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

## Never

- Write implementation code.
- Mutate Linear issues, projects, or milestones.
- Patch an Acid Prophet spec before explicit plan validation.
- Hide drift.
- Run `git push`, `git commit`, or `git rebase`.
