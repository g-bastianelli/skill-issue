# Linear Provider Selection

When fetching from Linear, prefer the `mcp__claude_ai_Linear__*` MCP tools listed in your toolset. If those are unavailable on the current install (no Linear MCP server configured for this user), fall back to a Linear CLI on PATH via `Bash` (typically `linear`; verify with `which linear`). If neither path works, return all Linear-derived fields as `_unclear_` and surface a top question.
