const ISSUE_ID_RE = /\b([a-z]{2,6})-([0-9]{2,})\b/i;

export function extractIssueId(input) {
  if (!input || typeof input !== 'string') return null;
  const stripped = input.includes('/') ? input.slice(input.indexOf('/') + 1) : input;
  const m = stripped.match(ISSUE_ID_RE);
  if (!m) return null;
  return `${m[1].toUpperCase()}-${m[2]}`;
}
