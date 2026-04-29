# skill-issue

Marketplace de plugins Claude Code perso.

## Convention de nommage

### Plugins
Nom fun/absurde qui pose le thème : `saucy-status`, `react-monkey`.

### Skills
Verbe d'action ou gérondif décrivant ce que fait le skill :
- `implement`, `explore`, `writing-plans`, `systematic-debugging`
- Pas de noms de rôle génériques (`coder`, `helper`, `utils`)

### Agents
Nom de rôle ou de tâche suffisamment descriptif :
- `explorer`, `code-reviewer`, `security-analyzer`
- Pas de noms vagues (`agent`, `helper`)

### IDs résultants
```
react-monkey:implement   ✅
react-monkey:explorer    ✅
react-monkey:coder       ❌  (nom de rôle générique pour un skill)
react-coder:react-coder  ❌  (doublon plugin/skill)
```
