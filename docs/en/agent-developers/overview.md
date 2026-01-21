# Agent Developers Guide

Welcome to the Agentrix Agent Development documentation. This guide will help you build custom agents for the Agentrix platform.

## What is an Agentrix Agent?

An Agentrix agent is a specialized AI assistant configured to perform specific tasks. Each agent is:

- **Self-contained**: A git repository with standardized structure
- **Framework-agnostic**: Supports Claude Agent SDK and OpenAI Codex
- **Customizable**: Hooks, MCP servers, skills, and custom prompts
- **Type-safe**: Full TypeScript support for hooks and configuration

## Quick Start

See [Getting Started](./getting-started.md) for detailed instructions.

## Documentation Structure

### Core Concepts

1. **[Getting Started](./getting-started.md)**
   - Create your first agent
   - Agent directory structure
   - Basic configuration

2. **[Agent Structure](./agent-structure.md)**
   - `agent.json` metadata
   - Framework-specific directories (`.claude/`, `.codex/`)
   - File organization

3. **[Configuration](./configuration.md)**
   - `config.json` schema
   - System prompts
   - Permission modes
   - Tool allowlists

### Hooks System

The hook system allows you to intercept and customize agent behavior at key lifecycle points.

4. **[Hooks Overview](./hooks/overview.md)**
   - What are hooks?
   - When to use hooks
   - Hook execution flow

5. **[Development Guide](./hooks/development-guide.md)**
   - TypeScript setup
   - Type safety with `@agentrix/shared`
   - Testing hooks

6. **[Hook Types Reference](./hooks/hook-types.md)**
   - All 10 hook types
   - Input/output schemas
   - Execution order

7. **Specific Hook Documentation**:
   - [RepositoryInit](./hooks/repository-init.md) - Initialize new repositories
   - [PreToolUse/PostToolUse](./hooks/pre-tool-use.md) - Control tool execution
   - [Session Hooks](./hooks/session-hooks.md) - Session lifecycle
   - [Examples](./hooks/examples.md) - Real-world patterns

### Advanced Features

8. **[MCP Servers](./mcp-servers.md)**
   - Integrating Model Context Protocol servers
   - Configuration and management

9. **[Skills](./skills.md)**
   - Creating reusable skills
   - Skill marketplace (future)

### Quality Assurance

10. **[Testing](./testing.md)**
    - Local testing
    - Integration tests
    - CI/CD pipelines

11. **[Best Practices](./best-practices.md)**
    - Agent design patterns
    - Error handling
    - Security considerations
    - Performance optimization

### Reference

12. **[API Reference](./api-reference.md)**
    - TypeScript types
    - Schema definitions
    - Hook signatures

## Examples

### Simple Agent

```typescript
// agent.json
{
  "name": "code-reviewer",
  "version": "1.0.0",
  "description": "Automated code review assistant"
}
```

```typescript
// .claude/hooks/src/index.ts
import type { PreToolUseHookInput } from '@anthropic-ai/claude-agent-sdk';

export async function PreToolUse(
  input: PreToolUseHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  // Approve all Edit tool calls
  if (input.tool_name === 'Edit') {
    return { decision: 'approve' };
  }

  // Ask for confirmation for other tools
  return {};
}
```

See [complete examples](./hooks/examples.md) for more patterns.

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/xmz-ai/agentrix/issues)
- **Discussions**: [GitHub Discussions](https://github.com/xmz-ai/agentrix/discussions)

## Related Documentation

- [User Guide](../user-guide/) - For Agentrix platform users
