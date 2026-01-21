# Agent Configuration

Guide to configuring Agentrix agents through `.claude/config.json`.

## Overview

Configuration controls agent behavior, model selection, permissions, and integrations.

## config.json Schema

```json
{
  "model": "claude-sonnet-4.5-20250929",
  "fallbackModel": "claude-3-5-sonnet-20241022",
  "maxTurns": 50,
  "systemPrompt": {
    "path": "system_prompt.txt",
    "mode": "append"
  },
  "settings": {
    "permissionMode": "default",
    "allowedTools": ["Read", "Edit", "Grep", "Bash"]
  },
  "mcpServers": {
    "enabled": ["filesystem", "git"],
    "directory": "mcp-servers"
  },
  "skills": {
    "enabled": ["code-formatter"],
    "directory": "skills"
  }
}
```

## Configuration Options

### Model Settings

- `model`: Primary model (default: "claude-sonnet-4.5-20250929")
- `fallbackModel`: Backup model if primary unavailable
- `maxTurns`: Maximum conversation turns (default: 50)

### System Prompt

- `systemPrompt.path`: Relative path to prompt file
- `systemPrompt.mode`: "append" (add to base) or "replace" (override base)

### Permission Mode

- `default`: Requires approval for destructive operations
- `acceptEdits`: Auto-approve Edit tool
- `bypassPermissions`: Auto-approve all tools (use with caution)
- `plan`: Show plan before execution

### Tool Allowlist

Restrict tools to specific set:

```json
{
  "settings": {
    "allowedTools": ["Read", "Grep", "Bash"]
  }
}
```

## Best Practices

1. Always set `maxTurns` to prevent runaway loops
2. Use `allowedTools` for security-sensitive agents
3. Keep system prompts concise and focused
4. Test configuration changes locally

## Related

- [Agent Structure](./agent-structure.md)
- [System Prompts](./best-practices.md#system-prompts)
