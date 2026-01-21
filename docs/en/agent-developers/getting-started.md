# Getting Started with Agent Development

This guide will walk you through creating your first Agentrix agent from scratch.

## Prerequisites

- Node.js 18+ and npm/yarn
- TypeScript knowledge (for hooks)
- Git
- Agentrix CLI installed (optional, for local testing)

## Creating Your First Agent

### Step 1: Create Agent Directory

```bash
mkdir my-first-agent
cd my-first-agent
git init
```

### Step 2: Create Agent Metadata

Create `agent.json` in the root:

```json
{
  "name": "my-first-agent",
  "version": "1.0.0",
  "description": "My first custom Agentrix agent",
  "author": "Your Name",
  "license": "MIT"
}
```

**Required fields**:
- `name`: Unique agent identifier (lowercase, hyphens allowed)
- `version`: Semantic version (e.g., "1.0.0")

**Optional fields**:
- `description`: Brief agent description
- `author`: Your name or organization
- `license`: License type (e.g., "MIT", "Apache-2.0")
- `repository`: Git repository URL
- `tags`: Array of tags for discoverability

### Step 3: Choose Framework

Agentrix supports two frameworks:

#### Option A: Claude Agent SDK (Recommended)

Create `.claude/` directory:

```bash
mkdir -p .claude
```

Create `.claude/config.json`:

```json
{
  "model": "claude-sonnet-4.5-20250929",
  "maxTurns": 50,
  "settings": {
    "permissionMode": "default"
  }
}
```

#### Option B: OpenAI Codex (Future)

```bash
mkdir -p .codex
```

Create `.codex/config.json`:

```json
{
  "model": "gpt-4",
  "temperature": 0.7
}
```

### Step 4: Add Custom System Prompt (Optional)

Create `.claude/system_prompt.txt`:

```
You are a helpful coding assistant specialized in [your domain].

Your responsibilities:
- Write clean, well-documented code
- Follow best practices
- Explain your reasoning

Always:
1. Ask clarifying questions when requirements are unclear
2. Suggest improvements when you see opportunities
3. Prioritize code maintainability
```

### Step 5: Initialize Git Repository

```bash
# Create .gitignore
cat > .gitignore << EOF
node_modules/
.DS_Store
*.log
dist/
.env
EOF

# Initial commit
git add .
git commit -m "Initial agent setup"
```

## Project Structure

Your agent should now look like this:

```
my-first-agent/
├── agent.json                 # Agent metadata
├── .gitignore                 # Git ignore rules
├── README.md                  # Agent documentation
├── .claude/                   # Claude-specific config
│   ├── config.json            # Claude SDK configuration
│   ├── system_prompt.txt      # Custom system prompt (optional)
│   ├── hooks/                 # Custom hooks (optional)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── index.ts
│   ├── mcp-servers/           # MCP server configs (optional)
│   │   └── <server-name>/
│   │       └── config.json
│   └── skills/                # Custom skills (optional)
│       └── <skill-name>/
│           └── skill.json
└── .codex/                    # Codex-specific config (alternative)
    └── config.json
```

## Adding Hooks (Advanced)

Hooks allow you to customize agent behavior at specific lifecycle points.

### Setup Hooks Project

```bash
mkdir -p .claude/hooks/src
cd .claude/hooks
```

Create `package.json`:

```json
{
  "name": "my-first-agent-hooks",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@agentrix/shared": "latest"
  },
  "devDependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.30",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

### Create Hook

Create `src/index.ts`:

```typescript
import type { PreToolUseHookInput } from '@anthropic-ai/claude-agent-sdk';

/**
 * PreToolUse hook - Called before each tool execution
 */
export async function PreToolUse(
  input: PreToolUseHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  console.log(`Tool ${input.tool_name} is about to execute`);

  // Approve all tool calls
  return { decision: 'approve' };
}
```

### Build Hooks

```bash
npm install
npm run build
```

See [Hooks Development Guide](./hooks/development-guide.md) for more details.

## Publishing Your Agent

### 1. Create Repository

```bash
git remote add origin https://github.com/yourusername/my-first-agent.git
git push -u origin main
```

### 2. Tag Release

```bash
git tag v1.0.0
git push --tags
```

### 3. Submit to Agentrix

Coming soon: Agent marketplace for sharing and discovering agents.

## Next Steps

Now that you have a basic agent:

1. **Learn Agent Structure**: Read [Agent Structure](./agent-structure.md)
2. **Configure Agent**: See [Configuration Guide](./configuration.md)
3. **Add Hooks**: Explore [Hooks System](./hooks/overview.md)
4. **Integrate MCP Servers**: Check [MCP Servers](./mcp-servers.md)
5. **Follow Best Practices**: Review [Best Practices](./best-practices.md)

## Common Issues

### Agent Not Recognized

Ensure `agent.json` exists in the root directory with valid JSON.

### Hooks Not Executing

1. Check hooks are built: `cd .claude/hooks && npm run build`
2. Verify `dist/` directory exists
3. Check console for hook errors

### TypeScript Errors

Install dependencies:
```bash
cd .claude/hooks
npm install
```

## Examples

See [complete examples](./hooks/examples.md) for real-world agent patterns.

## Getting Help

- [GitHub Issues](https://github.com/agentrix/agentrix/issues)
- [Discord Community](https://discord.gg/agentrix)
- [API Reference](./api-reference.md)
