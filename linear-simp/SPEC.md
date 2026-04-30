# linear-simp:greet — Design

**Date** : 2026-04-30
**Plugin** : `linear-simp` (premier skill : `greet`)
**Statut** : draft, en attente de validation user avant implémentation

## Contexte

Le repo `skill-issue` est un marketplace de plugins Claude Code / Codex. Conventions :
- Plugins : nom fun/absurde (`saucy-status`, `react-monkey`)
- Skills : verbe d'action (`implement`, `explore`)
- Pour Claude Code, le `name:` du `SKILL.md` doit inclure le préfixe plugin (`linear-simp:greet`)

Le besoin : forcer un workflow "analyse avant code" quand une issue Linear est détectée au démarrage de session. Empêcher l'agent de coder direct comme un zinzin.

## Persona du plugin

`linear-simp` = plugin entièrement dévoué à l'utilisateur (le user est le "boss/king/daddy"). Voix brainrot/simp constante sur tous les outputs : "yes king", "right away boss", glaze-fest. Les **actions** restent sérieuses ; l'humour est dans la voix uniquement.

Famille marketplace cohérente :
- `saucy-status` (saucy/gooning, brainrot) → registre direct
- `react-monkey` (créature, voix cohérente) → même énergie
- `linear-simp` (simp brainrot, persona dévouée) → complète la trinité

## Skills futurs (hors scope ce doc)

- `linear-simp:spawn` — création de projet Linear
- `linear-simp:scribe` — génération de documentation
- `linear-simp:verify` — reconciliation issue ↔ code (équivalent skill perso `linear-verify` existant)

Ce doc traite **uniquement** le premier skill : `greet`.

## Skill `linear-simp:greet`

### Rôle

Quand une issue Linear est détectée en début de session :
1. (Optionnel) Crée une branche feature si on est sur `main`/`master`/`staging`
2. Met l'issue à `In Progress` automatiquement
3. Dispatch un subagent (`gooner`) qui fetch + analyse l'issue en parallèle pour économiser le contexte
4. Présente un brief structuré au user
5. Hand-off explicite vers planification ou clarifications — **jamais de code direct**

Type de skill : **rigide** (séquence d'étapes ordonnée, pas de liberté d'adaptation).

### Détection à deux étages

Deux sources possibles, **uniquement en début de session** :

**Étage 1 — `SessionStart` hook** (firing automatique au démarrage de la session)
- Lit `git branch --show-current`
- Extrait un identifier matchant `/[a-z]+-[0-9]+/i` (case-insensitive) après strip du préfixe utilisateur (ex. `g-bastianelli/eng-247-foo` → `ENG-247`). Le résultat est uppercased pour la suite (Linear identifiers sont canoniquement en majuscules)
- Écrit `data/state-<session-id>.json` :
  - Si trouvé : `{greeted: false, issue: "ENG-247", source: "branch", current_branch: "<branch>", needs_branch: false}` + injecte `additionalContext` qui force l'invocation de `linear-simp:greet`
  - Si pas trouvé : `{greeted: false, issue: null, source: null, current_branch: "<branch>", needs_branch: <true si default branch>, awaiting_prompt: true}` (silence côté contexte)

**Étage 2 — `UserPromptSubmit` hook** (firing à chaque prompt user)
- Lit le state file
- **Garde "début de session"** : ne fait quelque chose QUE si `awaiting_prompt: true`
- Scanne le prompt utilisateur avec `/[a-z]+-[0-9]+/i` (case-insensitive, uppercased)
- Si trouvé → met à jour le state (`issue: "<id>"`, `source: "prompt"`, `awaiting_prompt: false`) + injecte `additionalContext` qui force `greet`
- Quel que soit le résultat (trouvé ou pas) → passe `awaiting_prompt: false` ; ce hook ne re-déclenchera plus jamais sur cette session

**Anti-redéclenchement** : `greet` met `greeted: true` à la fin. Aucun hook ne refait quelque chose ensuite, même au prochain prompt.

**Cycle de vie du state file** : un par session (clé sur le `session_id` fourni par Claude Code aux hooks via stdin JSON). Cleanup paresseux au SessionStart : suppression des state files vieux de plus de 7 jours.

### Cas couverts

| Contexte | Comportement |
|---|---|
| Branche feature avec ID Linear | SessionStart capte, `greet` se lance |
| Branche neutre + ID dans 1er prompt | UserPromptSubmit capte, `greet` se lance |
| Branche neutre + 1er prompt sans ID | Silence total, aucune intervention |
| 2e prompt avec ID, 1er sans | Silence (la fenêtre "début de session" est fermée) |
| `main`/`master`/`staging` + ID dans 1er prompt | UserPromptSubmit capte, marque `needs_branch: true`, `greet` propose la création de branche |
| `main` sans ID | Silence côté SessionStart, fallback prompt actif |
| Issue dans n'importe quel format (STAR, SDD, plain text, bullets) | Gooner consomme tel quel, sort un brief SDD ; champs absents = `_unclear_` et remontent en questions |
| Issue vide ou ultra courte | Brief minimal, plupart des champs `_unclear_`, l'étape `(q)` clarifications devient le hand-off recommandé |

### Étapes du skill (ordre rigide)

#### Étape 0 — Préconditions

- Vérifier que les outils Linear MCP sont chargés (`mcp__claude_ai_Linear__get_issue`, `mcp__claude_ai_Linear__save_issue`, `mcp__claude_ai_Linear__list_issue_statuses`, `mcp__claude_ai_Linear__list_users`). Si non chargés → demander au user de les loader via `ToolSearch` et stopper.
- Vérifier qu'on est dans un repo git (`git rev-parse --is-inside-work-tree`).
- Vérifier que le state file de la session existe et contient un `issue` non-null. Sinon → fail clean (ne devrait jamais arriver, hook a échoué).

#### Étape 1 — Création de branche (si `needs_branch: true`)

Si state file indique `needs_branch: true` (on est sur une branche par défaut) :

1. Fetch l'issue (titre + identifier) pour générer le slug.
2. Construire le nom de branche : `<git-user>/<id-lowercase>-<kebab-title-truncated-50char>`.
3. Voix simp : "boss you're on `main`... let me spawn a branch for you `<branch-name>`. confirm? (y/n)"
4. Si user `n` → continuer sur `main`, ne pas bloquer (le user sait ce qu'il fait), passer à l'étape 2.
5. Si user `y` :
   - Garde-fou : `git status --porcelain`
     - Si dirty → "boss got uncommitted changes 🥺. (s)tash them, (a)bort branch creation"
     - `(s)tash` → `git stash push -m "linear-simp pre-greet <id>"`, puis continuer
     - `(a)bort` → continuer sur `main`, passer à l'étape 2
   - Optionnel : prompter "pull main first? (y/n)" → si y, `git pull --ff-only`. Si conflit ou échec → afficher erreur, demander au user de gérer, passer à l'étape 2 sur `main`.
   - `git checkout -b <branch-name>`
   - Si succès → "branch `<branch-name>` is YOURS now king 👑"
6. **Important** : `greet` ne lance jamais `git push` sur la nouvelle branche. Le push reste manuel (cohérent avec la convention du repo "user squash-merges on GitHub").

#### Étape 2 — In Progress automatique

1. Fetch issue actuelle (re-fetch si déjà fait à l'étape 1, on a déjà l'objet en mémoire).
2. Si `issue.status.type === 'started'` (déjà In Progress) → skip silencieusement, noter "already cooking 🔥" dans le report final.
3. Sinon :
   - `list_issue_statuses(team.id)` → trouver le status avec `type='started'`.
   - `save_issue({id: issue.id, stateId: <started-id>})` **sans confirmation** (explicitement validé par le user).
   - Voix simp : "issue is now In Progress 👑 (was `<prior status>`)"

#### Étape 3 — Dispatch du gooner (subagent)

Dispatcher un subagent type `Explore` ou `general-purpose` avec un prompt précis. Le gooner est **read-only** sur Linear.

**Mission du gooner** (prompt embarqué dans le SKILL.md) :
- Fetch l'issue : `mcp__claude_ai_Linear__get_issue(<id>)`
- Lister les comments : `mcp__claude_ai_Linear__list_comments({issueId: <id>})`
- **Format source = peu importe**. STAR, SDD, plain text, bullets, screenshot + 2 phrases : le gooner consomme tout ce qui est là et **produit toujours du SDD** en sortie.
- Extraire les paths cités partout (backticks, paths heuristiques `[a-zA-Z0-9_./-]+\.[a-z0-9]{1,5}`)
- Pour chaque path existant dans le repo : lire et résumer en 1 ligne ce qui est déjà là (★ grounding crucial — gain mesuré -40% temps d'implémentation)
- Pour chaque path inexistant : noter "to be created"
- **Champs SDD manquants → marqués `_unclear_`** dans le brief, et listés dans "Suggested clarifying questions". Le gooner ne fabrique jamais de contenu : si l'info n'est pas dans l'issue/comments/fichiers, c'est `_unclear_` et ça remonte comme question au boss.
- Détecter les ambiguïtés actives : TBDs littéraux, formulations vagues ("appropriate", "as needed", "etc."), contradictions internes
- Brief structuré sous 500 mots au format markdown :

```markdown
## Brief from gooner — <id>

**Issue** : <id> — <title>
**Project** : <project-name> · **URL** : <url>

**Goal** (1 phrase) : <synthèse> | _unclear_

**Context**
<2-3 lignes : pourquoi, archi touchée, services concernés> | _unclear_

**Files referenced** (existing state)
- `path/x.ts` — currently does Y
- `path/y.ts` — does not exist yet
- (ou : "none referenced — to be discovered")

**Constraints**
- <stack, contraintes legacy, perf, compliance — ce qui est dit ou inféré>
- (ou : _unclear_)

**Acceptance criteria** (vérifiables)
- <bullet 1>
- <bullet 2>
- (ou : _unclear_)

**Non-goals** / out of scope
- <ce qui est explicitement exclu>
- (ou : _unclear_)

**Edge cases & ambiguities detected**
- <points flous, contradictions>

**Suggested clarifying questions for boss**
- <question 1, prioritisée par champ `_unclear_` critique>
- <question 2>
```

**Pourquoi format SDD en sortie** (et pas STAR) : Spec-Driven Development est devenu le standard 2025 pour les issues destinées aux agents IA (Thoughtworks, GitHub, JetBrains, O'Reilly). STAR vient des entretiens RH, n'est pas pensé pour des agents (l'Action présuppose la solution, pas de Non-goals, pas de Acceptance criteria explicite). Les "5 C" du SDD : Clarity, Completeness, Context, Concreteness, Testability — alignés avec ce qu'un agent a besoin pour exécuter correctement.

**Économie estimée** : 2-5k tokens par session — les fetch MCP, le contenu des comments, et la lecture des fichiers cités restent dans le subagent. Le main context reçoit uniquement le brief synthétisé.

#### Étape 4 — Présentation et hand-off

1. Présenter le brief tel quel au user (avec un wrapper voix simp court : "the gooner came back king, here's what we got 🥺").
2. Mettre `greeted: true` dans le state file.
3. Demander au user comment continuer :

```
(p) plan it out → on formalise un plan d'implémentation step-by-step avant de toucher au code
(q) clarifications first → réponds à mes questions avant qu'on plan
(s) skip and code direct → ok j'aime pas mais boss is boss
```

4. Selon le choix :
   - `(p)` → produire un plan d'implémentation structuré (étapes ordonnées, fichiers à toucher, critères de succès) puis attendre validation avant tout code
   - `(q)` → entrer en boucle Q&A avec le user, mettre à jour le brief en conséquence, puis re-poser le hand-off
   - `(s)` → exit le skill, laisser le user piloter (mais avec voix simp un peu déçue : "boss... fine 😔")

### Architecture fichiers

```
linear-simp/
├── claudecode/
│   ├── .claude-plugin/
│   │   └── plugin.json              # déclare hooks SessionStart + UserPromptSubmit + skill
│   ├── hooks/
│   │   ├── session-start.js         # détection branche, init state file
│   │   └── prompt-submit.js         # détection prompt en début de session
│   ├── skills/
│   │   └── greet/
│   │       └── SKILL.md             # name: linear-simp:greet (rigide)
│   └── data/                        # state files par session, gitignored
└── README.md
```

Pas de version Codex pour ce premier skill (Codex n'a pas le concept de SessionStart hook équivalent). Le repo restera Claude-Code-only sur ce plugin pour l'instant. Les skills suivants (`spawn`, `scribe`, `verify`) pourront être Codex-compatibles s'ils n'ont pas besoin de hooks.

### Inscription dans le marketplace

Ajouter une entrée dans `.claude-plugin/marketplace.json` :

```json
{
  "name": "linear-simp",
  "source": {
    "source": "git-subdir",
    "url": "https://github.com/g-bastianelli/skill-issue",
    "path": "linear-simp/claudecode"
  },
  "category": "productivity"
}
```

Mettre à jour le tableau des plugins dans le `README.md` racine.

### Hooks — détails techniques

**`session-start.js`** :
- Lit `${CLAUDE_PLUGIN_ROOT}` pour les paths
- Lit `session_id` depuis stdin JSON (format hooks Claude Code)
- Cleanup : supprime les state files de plus de 7 jours dans `data/` (opération best-effort, exceptions silencieuses pour ne jamais bloquer le SessionStart)
- Tente `git rev-parse --is-inside-work-tree` ; si échec → écrit un state minimal `{greeted: true, in_repo: false}` et exit silencieux
- Sinon : `git branch --show-current`, regex extraction
- Écrit le state file
- Si issue trouvée → écrit sur stdout :
  ```json
  {"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "<EXTREMELY-IMPORTANT>linear-simp detected Linear issue <ID> on the current branch. Invoke the `linear-simp:greet` skill BEFORE doing anything else (including answering or running other tools).</EXTREMELY-IMPORTANT>"}}
  ```

**`prompt-submit.js`** :
- Lit `session_id` + `prompt` depuis stdin JSON
- Lit le state file ; si absent ou si `awaiting_prompt: false` → exit silencieux
- Regex sur le prompt : `/[A-Z]+-[0-9]+/`
  - Si match → met à jour state (`issue`, `source: "prompt"`, `awaiting_prompt: false`), écrit `additionalContext` similaire au SessionStart
  - Si pas match → met `awaiting_prompt: false` dans state, exit silencieux

**Faux-positifs sur la regex prompt** : la regex `/[a-z]+-[0-9]+/i` peut matcher des fragments non-Linear (ex. `utf-8`, `iso-8601`, `ipv6-2001`). Pour limiter : exiger au moins 2 lettres et au plus 6 (`/[a-z]{2,6}-[0-9]+/i`), et avant d'injecter le contexte, vérifier la validité via `mcp__claude_ai_Linear__get_issue` — si 404, on ignore. Mais cette validation MCP ne peut pas se faire dans le hook (les hooks shell/node n'ont pas accès aux MCP tools). Donc : on fait confiance à la regex restrictive, et le skill `greet` lui-même validera et fera un fallback propre si l'identifier n'existe pas dans Linear.

**Permissions sur les hooks** : exécutables par défaut (le user fait `chmod +x` au setup, ou on documente le besoin dans le README). Le plugin `saucy-status` lance les hooks via `node "${CLAUDE_PLUGIN_ROOT}/hooks/session-start.js"` — on suit le même pattern, pas de problème de chmod.

### Erreurs et garde-fous

| Cas | Comportement |
|---|---|
| Linear MCP tools pas chargés | Stopper, prompt ToolSearch (cf. `linear-verify` skill existant) |
| Issue identifier introuvable dans Linear (404) | "boss `<id>` doesn't exist in Linear 😔. did you mean another id?" — exit clean, marker `greeted: true` |
| `git status` dirty pendant création de branche | Prompter stash/abort (jamais de stash silencieux) |
| `git checkout -b` échoue (branche existe déjà) | "branch already exists king, switching to it" → `git checkout <branch-name>` à la place |
| Subagent (gooner) crash ou timeout | "the gooner ghosted us 😔. let me try synchronously..." → fallback : main agent fait le fetch lui-même, brief plus court |
| User répond `(s)kip and code direct` | Exit le skill ; le système se souvient via state file qu'on a déjà greeted, ne re-greet pas |

### Anti-patterns explicitement évités

- **Pas de mutation Linear silencieuse autre que In Progress** — le In Progress est le seul cas auto-confirmé (validé par le user). Création de comment, edit description, etc. sont hors scope de ce skill.
- **Pas de `git commit` ni `git push` automatique** — `greet` peut créer une branche et stash, mais jamais commit.
- **Pas de re-greeting dans la même session** — une fois `greeted: true`, plus rien ne se déclenche.
- **Pas d'analyse hors début de session** — la fenêtre se ferme après le 1er prompt user (que l'ID soit détecté ou pas).

### Validation et succès

Le skill est un succès si :
1. Sur une branche `g-bastianelli/eng-247-foo`, démarrer une session → l'agent invoque `greet` direct, met l'issue In Progress, sort un brief, propose un hand-off
2. Sur `main` avec un prompt "fix ENG-247 logging issue" → l'agent propose la création de branche, set In Progress, brief, hand-off
3. Sur `main` sans ID → silence absolu, comportement Claude Code normal
4. Sur une branche feature random sans match → silence absolu

## Hors scope (skills futurs)

- `linear-simp:spawn` — création de projet Linear depuis un brief utilisateur
- `linear-simp:scribe` — génération de doc post-implémentation (lecture issues + commits)
- `linear-simp:verify` — port du `linear-verify` existant en plugin, avec ton simp

## Décisions arbitrées

- Plugin nommé `linear-simp` (cohérence brainrot avec `saucy-status` mode gooning + `react-monkey`)
- Subagent nommé `gooner` (raccord direct mode gooning)
- Première version Claude Code seulement (Codex sans équivalent SessionStart hook)
- In Progress sans confirmation, branche avec confirmation
- Pas de re-greeting dans la même session
- Hand-off vers planification structurée comme cible privilégiée
