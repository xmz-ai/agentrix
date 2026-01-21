# Best Practices

Recommended patterns for building robust agents.

## Agent Design

### 1. Clear Purpose

```json
{
  "name": "code-reviewer",
  "description": "Automated code review focusing on security and style",
  "tags": ["security", "code-review", "linting"]
}
```

### 2. Focused System Prompt

```txt
You are a code review specialist.

Focus on:
1. Security vulnerabilities
2. Code style consistency
3. Best practices

Do not:
- Rewrite working code unnecessarily
- Focus on subjective preferences
```

### 3. Appropriate Permission Mode

```json
{
  "settings": {
    "permissionMode": "acceptEdits",  // Auto-approve edits for speed
    "allowedTools": ["Read", "Grep", "Edit"]  // Limit to safe tools
  }
}
```

## Hook Patterns

### 1. Fail Safely

```typescript
export async function PreToolUse(input: PreToolUseHookInput) {
  try {
    // Your logic
    return { decision: 'approve' };
  } catch (error) {
    console.error('Hook error:', error);
    // Fail open: allow operation
    return { decision: 'approve' };
  }
}
```

### 2. Keep Hooks Fast

```typescript
// ✓ Good: Fast local check
export async function PreToolUse(input: PreToolUseHookInput) {
  const blacklist = ['rm -rf', 'dd if='];
  const cmd = input.tool_input?.command || '';
  return {
    decision: blacklist.some(b => cmd.includes(b)) ? 'deny' : 'approve'
  };
}

// ✗ Bad: Slow external call
export async function PreToolUse(input: PreToolUseHookInput) {
  const response = await fetch('https://api.example.com/check');
  // Adds latency to every tool call!
}
```

### 3. Log Appropriately

```typescript
export async function PreToolUse(input: PreToolUseHookInput) {
  // ✓ Structured logging
  console.log('[PreToolUse]', {
    tool: input.tool_name,
    timestamp: Date.now()
  });

  // ✗ Don't log sensitive data
  console.log('[PreToolUse]', input.tool_input);  // May contain secrets!
}
```

## Configuration

### 1. Set maxTurns

```json
{
  "maxTurns": 50  // Prevent infinite loops
}
```

### 2. Use Tool Allowlists

```json
{
  "settings": {
    "allowedTools": ["Read", "Grep", "Edit"]  // Security-sensitive agents
  }
}
```

### 3. Provide Fallback Model

```json
{
  "model": "claude-sonnet-4.5-20250929",
  "fallbackModel": "claude-3-5-sonnet-20241022"  // Availability
}
```

## Security

1. **Validate inputs**: Check tool parameters in hooks
2. **Limit permissions**: Use restrictive permission modes
3. **Audit operations**: Log all actions with PostToolUse
4. **Block dangerous commands**: Implement PreToolUse guards
5. **Don't commit secrets**: Keep .env files in .gitignore

## Performance

1. **Keep hooks fast** (< 1s typically)
2. **Limit maxTurns** to prevent runaway execution
3. **Use efficient tools**: Prefer Read over Bash cat
4. **Cache expensive operations** in hooks
5. **Minimize external API calls** in hot paths

## Documentation

1. **Comprehensive README**: Explain agent purpose and usage
2. **Document hooks**: Explain custom behavior
3. **Provide examples**: Show real-world usage
4. **Keep updated**: Sync docs with code changes

## Version Control

```gitignore
# .gitignore
node_modules/
.env
*.log
dist/  # Optional: can commit for convenience
```

Commit:
- Source code
- Configuration
- Documentation
- Tests

Don't commit:
- Dependencies
- Build artifacts (optional)
- Secrets
- Logs

## Related

- [Agent Structure](./agent-structure.md)
- [Configuration](./configuration.md)
- [Hooks Overview](./hooks/overview.md)
- [Testing](./testing.md)
