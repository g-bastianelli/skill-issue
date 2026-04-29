# Migration saucy-status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Copier le plugin saucy-status standalone dans `saucy-status/` du monorepo skill-issue avec hooks inline dans plugin.json.

**Architecture:** Copie directe des fichiers source + adaptation de plugin.json pour intégrer les hooks inline (pattern caveman). Aucun changement dans les scripts JS/SH — ils utilisent `${CLAUDE_PLUGIN_ROOT}` et `__dirname` qui sont portables.

**Tech Stack:** Node.js, Bash, JSON

---

### Task 1: Créer plugin.json avec hooks inline

**Files:**
- Create: `saucy-status/.claude-plugin/plugin.json`

- [ ] **Step 1: Créer le fichier**

```json
{
  "name": "saucy-status",
  "description": "Suggestive loading messages while Claude thinks. Modes: saucy, gooning.",
  "author": {
    "name": "g-bastianelli"
  },
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/session-start.js\""
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/loading-message.js\""
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Vérifier JSON valide**

```bash
node -e "JSON.parse(require('fs').readFileSync('saucy-status/.claude-plugin/plugin.json', 'utf8')); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add saucy-status/.claude-plugin/plugin.json
git commit -m "feat(NOT-102): ajouter plugin.json saucy-status avec hooks inline"
```

---

### Task 2: Migrer la skill

**Files:**
- Create: `saucy-status/skills/saucy/SKILL.md`

Source: `/Users/gbastianelli/.superset/projects/saucy-status/skills/saucy/SKILL.md`

- [ ] **Step 1: Copier le fichier**

```bash
mkdir -p saucy-status/skills/saucy
cp /Users/gbastianelli/.superset/projects/saucy-status/skills/saucy/SKILL.md saucy-status/skills/saucy/SKILL.md
```

- [ ] **Step 2: Vérifier le contenu**

```bash
head -5 saucy-status/skills/saucy/SKILL.md
```

Expected: premières lignes du SKILL.md (nom de skill, description)

- [ ] **Step 3: Commit**

```bash
git add saucy-status/skills/saucy/SKILL.md
git commit -m "feat(NOT-102): ajouter skill saucy"
```

---

### Task 3: Migrer les hooks

**Files:**
- Create: `saucy-status/hooks/session-start.js`
- Create: `saucy-status/hooks/loading-message.js`
- Create: `saucy-status/hooks/statusline.sh`

Source: `/Users/gbastianelli/.superset/projects/saucy-status/hooks/`

- [ ] **Step 1: Copier les scripts**

```bash
mkdir -p saucy-status/hooks
cp /Users/gbastianelli/.superset/projects/saucy-status/hooks/session-start.js saucy-status/hooks/session-start.js
cp /Users/gbastianelli/.superset/projects/saucy-status/hooks/loading-message.js saucy-status/hooks/loading-message.js
cp /Users/gbastianelli/.superset/projects/saucy-status/hooks/statusline.sh saucy-status/hooks/statusline.sh
```

- [ ] **Step 2: Vérifier syntaxe Node.js**

```bash
node --check saucy-status/hooks/session-start.js && echo "session-start OK"
node --check saucy-status/hooks/loading-message.js && echo "loading-message OK"
```

Expected:
```
session-start OK
loading-message OK
```

- [ ] **Step 3: Vérifier permissions statusline.sh**

```bash
chmod +x saucy-status/hooks/statusline.sh
bash -n saucy-status/hooks/statusline.sh && echo "statusline OK"
```

Expected: `statusline OK`

- [ ] **Step 4: Commit**

```bash
git add saucy-status/hooks/
git commit -m "feat(NOT-102): ajouter hooks saucy-status"
```

---

### Task 4: Migrer les données

**Files:**
- Create: `saucy-status/data/messages.json`

Source: `/Users/gbastianelli/.superset/projects/saucy-status/data/messages.json`

- [ ] **Step 1: Copier le fichier**

```bash
mkdir -p saucy-status/data
cp /Users/gbastianelli/.superset/projects/saucy-status/data/messages.json saucy-status/data/messages.json
```

- [ ] **Step 2: Vérifier JSON + compter les messages**

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('saucy-status/data/messages.json', 'utf8'));
console.log('saucy:', d.saucy.length, 'gooning:', d.gooning.length);
"
```

Expected: `saucy: 62 gooning: 30`

- [ ] **Step 3: Vérifier que loading-message.js trouve les données**

```bash
CLAUDE_PLUGIN_ROOT=$(pwd)/saucy-status node -e "
// Simule l'env plugin avec mode saucy
const fs = require('fs');
const os = require('os');
const path = require('path');
fs.writeFileSync(path.join(os.homedir(), '.claude', '.saucy-status'), 'saucy');
" && echo "saucy" > ~/.claude/.saucy-status && node saucy-status/hooks/loading-message.js
```

Expected: JSON avec `systemMessage` contenant un message saucy, ex: `{"systemMessage":"Claude slipping on latex gloves..."}`

- [ ] **Step 4: Commit**

```bash
git add saucy-status/data/messages.json
git commit -m "feat(NOT-102): ajouter messages saucy-status"
```

---

### Task 5: Migrer README et banner

**Files:**
- Create: `saucy-status/README.md`
- Create: `saucy-status/banner.jpeg`

Source: `/Users/gbastianelli/.superset/projects/saucy-status/`

- [ ] **Step 1: Copier les fichiers**

```bash
cp /Users/gbastianelli/.superset/projects/saucy-status/README.md saucy-status/README.md
cp /Users/gbastianelli/.superset/projects/saucy-status/banner.jpeg saucy-status/banner.jpeg
```

- [ ] **Step 2: Vérifier**

```bash
ls -la saucy-status/README.md saucy-status/banner.jpeg
```

Expected: les deux fichiers existent avec taille > 0

- [ ] **Step 3: Commit**

```bash
git add saucy-status/README.md saucy-status/banner.jpeg
git commit -m "feat(NOT-102): ajouter README et banner saucy-status"
```

---

### Task 6: Vérifier intégration marketplace

**Files:**
- Read: `.claude-plugin/marketplace.json` (déjà configuré, vérification seulement)

- [ ] **Step 1: Confirmer que marketplace pointe vers saucy-status**

```bash
node -e "
const m = JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json', 'utf8'));
const p = m.plugins.find(p => p.name === 'saucy-status');
console.log(p ? 'OK: ' + p.source : 'MANQUANT');
"
```

Expected: `OK: ./saucy-status`

- [ ] **Step 2: Vérifier structure finale**

```bash
find saucy-status -not -path '*/.*' -type f | sort
```

Expected:
```
saucy-status/.claude-plugin/plugin.json
saucy-status/README.md
saucy-status/banner.jpeg
saucy-status/data/messages.json
saucy-status/hooks/loading-message.js
saucy-status/hooks/session-start.js
saucy-status/hooks/statusline.sh
saucy-status/skills/saucy/SKILL.md
```

- [ ] **Step 3: Mettre à jour la tâche Linear NOT-102**

Appeler l'outil Linear pour marquer NOT-102 comme terminé avec résumé de la migration.
