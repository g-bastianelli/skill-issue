# skill-issue

Marketplace de plugins Claude Code perso.

## Convention de nommage

### Plugins
Nom fun/absurde qui pose le thème : `saucy-status`, `react-monkey`.

### Skills
Verbe d'action ou gérondif décrivant ce que fait le skill :
- `implement`, `explore`, `writing-plans`, `systematic-debugging`
- Pas de noms de rôle génériques (`coder`, `helper`, `utils`)
- Pour les plugins Codex, garder le `name:` du `SKILL.md` court et sans préfixe plugin. Le préfixe vient du plugin lui-même : plugin `react-monkey` + skill `implement` donne `$react-monkey:implement`.
- Ne jamais mettre `name: react-monkey:implement` dans une skill Codex bundlée par le plugin `react-monkey`, sinon le nom visible risque d'être doublé.
- Pour les plugins Claude Code, mettre le nom complet dans le `SKILL.md` : `name: react-monkey:implement`. Claude Code ne doit pas exposer `/implement` seul.
- Une même capability peut donc avoir deux noms internes selon le runtime : Claude Code `react-monkey:implement`, Codex `implement`, mais l'ID visible reste préfixé dans les deux cas.

### Agents
Nom de rôle ou de tâche suffisamment descriptif :
- `explorer`, `code-reviewer`, `security-analyzer`
- Pas de noms vagues (`agent`, `helper`)

### IDs résultants
```
react-monkey:implement   ✅
react-monkey:explorer    ✅
implement                ❌  (pas d'ID visible sans préfixe plugin)
react-monkey:coder       ❌  (nom de rôle générique pour un skill)
react-coder:react-coder  ❌  (doublon plugin/skill)
```
