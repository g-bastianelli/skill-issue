const fs = require('node:fs');
const path = require('node:path');

function statePath(pluginRoot, sessionId) {
  return path.join(pluginRoot, 'data', `state-${sessionId}.json`);
}

function readState(pluginRoot, sessionId) {
  try {
    const content = fs.readFileSync(statePath(pluginRoot, sessionId), 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function writeState(pluginRoot, sessionId, state) {
  const dir = path.join(pluginRoot, 'data');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(statePath(pluginRoot, sessionId), JSON.stringify(state, null, 2), 'utf8');
}

function cleanupOldStates(pluginRoot, maxAgeDays = 7) {
  const dir = path.join(pluginRoot, 'data');
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return;
  }
  const cutoff = Date.now() - maxAgeDays * 24 * 3600 * 1000;
  for (const name of entries) {
    if (!name.startsWith('state-') || !name.endsWith('.json')) continue;
    const full = path.join(dir, name);
    try {
      const stat = fs.statSync(full);
      if (stat.mtimeMs < cutoff) fs.unlinkSync(full);
    } catch {
      // best-effort, ignore
    }
  }
}

module.exports = { readState, writeState, cleanupOldStates };
