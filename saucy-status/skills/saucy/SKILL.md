---
name: saucy
description: Control saucy-status mode. Use when user types /saucy [on|off|gooning|status]. No arg → toggle off↔saucy.
---

Control the saucy-status flag at `~/.claude/.saucy-status`.

Parse the argument the user passed after `/saucy`:

| Arg | Action |
|-----|--------|
| `on` or `saucy` | write `saucy` |
| `off` | write `off` |
| `gooning` | write `gooning` |
| `status` | report current mode, no write |
| (none) | toggle: `off` → `saucy`, else → `off` |

Use this Node.js snippet, replacing `ARG` with the user's argument (or empty string):

```javascript
const fs = require('fs');
const os = require('os');
const path = require('path');
const flagPath = path.join(os.homedir(), '.claude', '.saucy-status');
const arg = 'ARG'.trim();
let current = 'off';
try { current = fs.readFileSync(flagPath, 'utf8').trim(); } catch(e) {}

if (arg === 'status') {
  console.log(`saucy-status: ${current}`);
  process.exit(0);
}

let next;
switch (arg) {
  case 'on':
  case 'saucy':   next = 'saucy'; break;
  case 'off':     next = 'off'; break;
  case 'gooning': next = 'gooning'; break;
  case '':        next = current === 'off' ? 'saucy' : 'off'; break;
  default:
    console.error(`unknown arg: ${arg}. Use on|off|gooning|status`);
    process.exit(1);
}
fs.writeFileSync(flagPath, next, { flag: 'w' });
console.log(`saucy-status: ${next}`);
```

Report the resulting state:
- `saucy` → "saucy mode activated 🌶️ — suggestive messages enabled"
- `off` → "saucy-status off — back to normal"
- `gooning` → "GOONING mode 🫠 — Claude lost in your embeddings"
- `status` → "current mode: <mode>"
