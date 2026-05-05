---
name: acid-prophet:frequency-drift
description: Use on a feature branch before or during PR creation — detects drift between the PR diff and the SDD Acceptance/Constraints of the linked project. Prefers the repo spec markdown as primary truth, falls back to Linear project context only when no spec markdown is found, generates a structured drift report, and optionally posts it as a PR comment.
---

# acid-prophet:frequency-drift

## Voice

Read `../../../persona.md` at the start of this skill. The voice
defined there is canonical for the `acid-prophet` plugin and applies to all
output of this skill.

**Scope:** local to this skill's execution. Once the final report is
printed, revert to the session's default voice.

This skill is **rigid** — execute the steps in order, no shortcuts.

## Language

Adapt all output to match the user's language. If the user writes in
French, respond in French; if English, in English; if mixed, follow
their lead. Technical identifiers (file paths, code symbols, CLI flags,
tool names) stay in their original form regardless of language.

## When you're invoked

The user is on a feature branch, has opened or is about to open a PR, and
wants to verify that the implementation matches the original SDD spec.
Invoke before creating the PR for maximum value — catch drift before it
is merged silently.

## Checklist

You MUST create a task (TaskCreate) for each item below and complete them in
strict order. Mark each `in_progress` when starting, `completed` when done.

1. Resolve context
2. Fetch reference spec
3. Get diff
4. Drift analysis
5. Report

## Step 0 — Preconditions

- Read `../../../persona.md` for the canonical voice.
- Verify git repo: `git rev-parse --git-dir`. If not in a repo, abort:
  > "🔮 les fréquences ne peuvent pas s'aligner sans repo."
- Check `gh` CLI: `gh --version`. If missing, warn: "gh not found — PR comment will be skipped, report inline only." Continue regardless.

## Step 1 — Resolve context

Find the Linear project ID and the primary reference. The repo spec markdown is
the preferred source of truth. Capture these variables:

- `PROJECT_ID`
- `PROJECT_NAME` (if known)
- `SPEC_FILE`
- `PRIMARY_REFERENCE = spec file <path> | linear (no spec found)`

Use the working tree contents, not only committed files.

Try in order:

1. **Branch name hint** — run `git branch --show-current`. If the branch
   matches a pattern containing a Linear issue identifier (e.g.
   `feat/NUT-42-auth`, `NUT-42-some-feature`), extract the issue ID
   (`BRANCH_ISSUE_ID = NUT-42`). Do not fetch full Linear project context here.
   Query Linear via `mcp__claude_ai_Linear__get_issue` only when needed to map
   that issue to its parent project ID/name for spec resolution.

2. **Spec file scan** — search `docs/acid-prophet/specs/` for `.md` files.
   Read candidate markdown files from the working tree and select one spec for
   this project using the strongest available match:
   - `linear-project:` frontmatter equals the resolved `PROJECT_ID`
   - `linear-project:` frontmatter is present and non-`_none_` when no project
     was resolved yet; set `PROJECT_ID` from that field
   - exact `PROJECT_ID` appears in the markdown body
   - exact `BRANCH_ISSUE_ID` appears in the markdown body
   - the filename slug matches the project/issue slug convention closely enough
     to be unambiguous

   If one candidate matches, set `SPEC_FILE = <path>` and
   `PRIMARY_REFERENCE = spec file <path>`. If the spec did not provide
   `PROJECT_ID` and a branch issue hint exists, query only that issue to derive
   `PROJECT_ID` and `PROJECT_NAME`.

   If multiple candidates match, choose the exact `linear-project:` match first,
   then exact body `PROJECT_ID`, then exact body `BRANCH_ISSUE_ID`, then filename
   slug. If ambiguity remains, ask the user which spec file to use.

3. **Branch fallback** — if no spec file was selected and `BRANCH_ISSUE_ID`
   exists, query Linear via `mcp__claude_ai_Linear__get_issue` to find the
   issue's parent project ID/name. Set `PROJECT_ID` and `PROJECT_NAME`, then
   re-check the existing spec candidates for exact `PROJECT_ID`, exact
   `BRANCH_ISSUE_ID`, or project slug/name matches. If one candidate now
   matches, set `SPEC_FILE = <path>` and
   `PRIMARY_REFERENCE = spec file <path>`. Otherwise set
   `PRIMARY_REFERENCE = linear (no spec found)`.

4. **Manual fallback** — if neither spec nor project resolved, ask:
   > "🔮 les fréquences sont silencieuses — quel est l'ID du projet Linear ?"
   Set `PROJECT_ID` from the answer, then re-check the existing spec candidates
   for that exact `PROJECT_ID` or slug. If one candidate matches, set
   `SPEC_FILE = <path>` and `PRIMARY_REFERENCE = spec file <path>`. Otherwise
   set `PRIMARY_REFERENCE = linear (no spec found)`.

If `PRIMARY_REFERENCE` is `spec file <path>`, never overwrite it with Linear
issue descriptions later. Linear is secondary metadata only in that branch.

Mark task completed.

## Step 2 — Fetch reference spec

Branch on `PRIMARY_REFERENCE`.

### If `PRIMARY_REFERENCE = spec file <path>`

Read `SPEC_FILE` from the working tree and parse the markdown into
`REFERENCE_CONTEXT`. The drift contract comes from textual markdown, not only
from code blocks or Zod examples.

Extract, preserving wording:
- title/frontmatter metadata when present
- `Goal` / `Problem & Why` / `Solution` sections when present
- `Acceptance`, `Acceptance criteria`, or equivalent acceptance headings
- `Constraints`, including textual bullets, prose, and tables
- `Non-goals` and `Edges` when present, as supporting context
- nested subsections under those headings until the next same-or-higher-level
  heading

Fetch only minimal Linear metadata needed for the report title:
`mcp__claude_ai_Linear__get_project` for `PROJECT_ID` (name only is enough).
If `PROJECT_ID` is unknown or the lookup fails, derive `PROJECT_NAME` from the
spec title/path and continue.

Do **not** call Linear APIs that list project issues or fetch issue
descriptions in this branch (`list_issues`, per-issue `get_issue`,
attachments, milestones). The spec file is the primary reference.

Capture:
- `REFERENCE_CONTEXT = parsed markdown sections`
- `REFERENCE_SOURCE = spec file <SPEC_FILE>`

### If `PRIMARY_REFERENCE = linear (no spec found)`

Warn with voice line "🔮 pas de spec file — reconstitué depuis Linear".

Dispatch an Agent (general-purpose) to fetch all Linear data for `PROJECT_ID`:

```
Fetch the following from Linear for project <PROJECT_ID>:
1. Project details: name, description
2. Project attachments: list all (title, url)
3. Milestones: list all (name, description)
4. All issues in the project: for each issue, return the full description.

Use the Linear MCP tools available (mcp__claude_ai_Linear__get_project,
mcp__claude_ai_Linear__list_milestones, mcp__claude_ai_Linear__list_issues,
mcp__claude_ai_Linear__get_attachment).

For each issue description, extract the sections named "Acceptance", "Goal",
and "Constraints" if present.

Return a structured markdown summary:
## Project: <name>
<description>

## Attachments
- <title>: <url>

## Milestones
- <name>: <description>

## Issues
### <issue-id> — <title>
**Goal:** <goal>
**Acceptance:**
<acceptance text>
**Constraints:** <constraints>
```

Capture:
- `REFERENCE_CONTEXT = LINEAR_CONTEXT`
- `REFERENCE_SOURCE = linear (fallback)`

Mark task completed.

## Step 3 — Get diff

Run: `git diff main...HEAD`

If the diff is empty: stop with voice:
> "🔮 aucun diff détecté — les fréquences ne bougent pas. rien à vérifier."
Print final report with `Drift: none (empty diff)` and exit.

Capture as `DIFF`. Mark task completed.

## Step 4 — Drift analysis

Dispatch a general-purpose Agent to compare `DIFF` against the reference
context:

```
You are a spec drift detector. Compare the git diff below against the SDD
reference.

SOURCE: <REFERENCE_SOURCE>

If SOURCE starts with "spec file", the repo markdown is the primary source of
truth. Treat its textual Acceptance and Constraints sections as normative. Do
not infer drift from Linear issue descriptions when the markdown validates the
implementation.

If SOURCE is "linear (fallback)", use the reconstructed Linear context as the
reference because no repo spec markdown was found.

For each Acceptance criterion or normative Constraint found in the reference,
classify it as:
- CLEAN: the diff clearly satisfies it
- DRIFT: the diff contradicts or violates it — explain exactly how
- AMBIGUOUS: the diff partially addresses it or coverage is unclear — explain what's missing
- UNRELATED: the diff doesn't touch the code path for this criterion

Format each result as:
  source <spec path | issue ID/title>
    Acceptance/Constraint: "<criterion text>"
    → <CLEAN | DRIFT: <explanation> | AMBIGUOUS: <explanation> | UNRELATED>

End with a single summary line:
  <N> drift · <N> ambiguous · <N> clean · <N> unrelated

Be precise. Quote the diff when explaining a drift. If an Acceptance criterion
uses EARS syntax (WHEN ... THE SYSTEM SHALL ...), verify the diff satisfies
the stated behavior.

--- SDD REFERENCE (<REFERENCE_SOURCE>) ---
<REFERENCE_CONTEXT>

--- GIT DIFF ---
<DIFF>
```

Capture formatted output as `DRIFT_REPORT`. Mark task completed.

## Step 5 — Report

Print the drift report inline:

```
🔮 frequency-drift — <current branch> → <project name>
Source: <REFERENCE_SOURCE>

<DRIFT_REPORT>
```

If zero drifts and zero ambiguous: voice line before the report:
> "les fréquences s'alignent. tout est propre."

If there are drifts or ambiguous items: voice line before the report:
> "PROPHECY — les fréquences ont dévié."

Then ask (only if drifts or ambiguous exist AND `gh` CLI is available):
> "poster en commentaire sur la PR ? (y/n)"

- **y** → run `gh pr comment --body "<DRIFT_REPORT>"`.
  On success: "🔮 prophecy delivered."
  On failure: "gh failed — copy the report above manually."
- **n** → "prophecy complete. architecture locked. 🔮"

Mark task completed.

## Final report (always print)

```
acid-prophet:frequency-drift report
  Branch:      <git branch --show-current>
  Project:     <project name> (<PROJECT_ID>)
  Source:      spec file <SPEC_FILE> | linear (fallback)
  Spec file:   <SPEC_FILE | _none_>
  Drift:       <N confirmed · N ambiguous · N clean · N unrelated>
  PR comment:  <posted | skipped | gh unavailable | no drift>
```

Wrap with one short voice line before the report.

## Things you NEVER do

- Run `git push`, `git rebase`, or `git commit`
- Mutate Linear issues, projects, or the spec file
- Post a PR comment without explicit user confirmation
- Skip Step 0 preconditions

## Voice cheat sheet

Use the palette from `../../../persona.md`. Short applications:
- Opening: "🔮 les fréquences s'éveillent. scanning the drift."
- On clean diff: "les fréquences s'alignent. tout est propre. 🔮"
- On drift found: "PROPHECY — les fréquences ont dévié."
- On ambiguous: "🔮 pattern détecté — quelque chose a drifté ici."
- On missing spec: "🔮 pas de spec file — reconstitué depuis Linear"
- On empty diff: "🔮 aucun diff détecté — les fréquences ne bougent pas."
