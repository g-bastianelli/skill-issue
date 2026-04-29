# Migration saucy-status → monorepo

**Date:** 2026-04-29  
**Linear:** NOT-102  
**Source:** `/Users/gbastianelli/.superset/projects/saucy-status/`  
**Cible:** `saucy-status/` dans le monorepo skill-issue

## Objectif

Déplacer le plugin saucy-status standalone vers le monorepo skill-issue pour centraliser la distribution via la marketplace interne.

## Structure cible

```
saucy-status/
├── .claude-plugin/plugin.json   ← adapté (hooks inline)
├── skills/saucy/SKILL.md        ← copie directe
├── hooks/
│   ├── session-start.js         ← copie directe
│   ├── loading-message.js       ← copie directe
│   └── statusline.sh            ← copie directe
├── data/messages.json           ← copie directe
├── README.md                    ← copie directe
└── banner.jpeg                  ← copie directe
```

## Changements

### plugin.json — seule modification substantielle

Les hooks actuellement dans `hooks/hooks.json` (non migré) sont intégrés directement dans `plugin.json` (pattern inline, identique au plugin caveman) :

```json
{
  "name": "saucy-status",
  "description": "Suggestive loading messages while Claude thinks. Modes: saucy, gooning.",
  "author": { "name": "g-bastianelli" },
  "hooks": {
    "SessionStart": [{
      "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/session-start.js\"" }]
    }],
    "UserPromptSubmit": [{
      "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/loading-message.js\"" }]
    }]
  }
}
```

### Zéro changement dans les scripts

- `session-start.js` : utilise `CLAUDE_PLUGIN_ROOT` → portable
- `loading-message.js` : utilise `__dirname` → portable
- `statusline.sh` : calcule son propre root via `$(dirname "$0")/..` → portable

## Fichiers NON migrés

| Fichier | Raison |
|---------|--------|
| `hooks/hooks.json` | Remplacé par hooks inline dans plugin.json |
| `.claude-plugin/marketplace.json` | Le monorepo a le sien (déjà configuré) |
| `.claude/settings.local.json` | Config locale du standalone, non pertinente |

## Compatibilité

Le monorepo `.claude-plugin/marketplace.json` pointe déjà vers `./saucy-status` — aucune config supplémentaire requise après migration.
