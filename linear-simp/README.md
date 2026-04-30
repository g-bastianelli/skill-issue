# linear-simp

Linear simp dévoué — un plugin Claude Code qui détecte ton issue Linear au début de session, la met `In Progress`, et prépare un brief SDD pour pas que tu codes comme un zinzin.

Voix brainrot/simp partout : "yes king", "the gooner came back boss", "this issue is PEAK".

## Skills

| Skill | Quoi |
|---|---|
| `linear-simp:greet` | Détecte issue depuis branche ou 1er prompt, set In Progress, dispatch gooner, brief SDD, hand-off vers plan / clarifications / skip |

## Détection

Deux étages, **uniquement en début de session** :

1. **SessionStart hook** — lit `git branch --show-current`, regex `[A-Z]+-[0-9]+`. Trouve → invoque `linear-simp:greet`.
2. **UserPromptSubmit hook** — si la branche n'a pas livré d'ID, scanne le 1er prompt user. Trouve → invoque `linear-simp:greet`.

Après le 1er prompt : silence total. La fenêtre de greet se ferme.

## Pré-requis

- Linear MCP tools (`mcp__claude_ai_Linear__*`) chargés dans la session
- Repo git
- Linear identifier détectable (regex `[A-Z]+-[0-9]+`)

## Install

```
/plugin marketplace add g-bastianelli/skill-issue
/plugin install linear-simp@skill-issue
```

Restart Claude Code après install.

## License

MIT
