# 代理目录结构

本文档描述了 Agentrix 代理的标准目录结构。

## 概述

Agentrix 代理是一个具有特定结构的 git 仓库，它支持多种 AI 框架（Claude、Codex），同时保持一致性。

## 根目录结构

```
agent-repository/
├── agent.json              # REQUIRED: Agent metadata
├── README.md               # RECOMMENDED: Agent documentation
├── LICENSE                 # RECOMMENDED: License file
├── .gitignore              # RECOMMENDED: Git ignore rules
├── .claude/                # Claude SDK configuration
└── .codex/                 # Codex SDK configuration (future)
```

## agent.json

根 `agent.json` 文件定义了代理元数据。

### 模式

```typescript
interface AgentMetadata {
  name: string;              // REQUIRED: Unique agent name
  version: string;           // REQUIRED: Semantic version
  description?: string;      // Agent description
  author?: string;           // Author name
  license?: string;          // License type
  repository?: string;       // Git repository URL
  tags?: string[];           // Searchable tags
  frameworks?: ('claude' | 'codex')[]; // Supported frameworks
}
```

### 示例

```json
{
  "name": "code-reviewer",
  "version": "2.1.0",
  "description": "Automated code review with style checking and security analysis",
  "author": "Agentrix Team",
  "license": "MIT",
  "repository": "https://github.com/agentrix/code-reviewer",
  "tags": ["code-review", "security", "linting"],
  "frameworks": ["claude"]
}
```

### 验证规则

*   `name`: 允许小写字母、数字和短横线（正则表达式：`^[a-z0-9-]+$`）
*   `version`: 合法的 semver 版本（例如："1.0.0"、"2.1.3-beta"）
*   `frameworks`: 如果未指定，默认为 `["claude"]`

## .claude/ 目录

Claude Agent SDK 特定配置。

```
.claude/
├── config.json             # REQUIRED: Claude configuration
├── system_prompt.txt       # OPTIONAL: Custom system prompt
├── hooks/                  # OPTIONAL: Custom hooks
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   └── index.ts
│   └── dist/               # Built hooks (generated)
│       └── index.mjs
├── mcp-servers/            # OPTIONAL: MCP server configurations
│   └── <server-name>/
│       └── config.json
└── skills/                 # OPTIONAL: Custom skills
    └── <skill-name>/
        ├── skill.json
        └── implementation.ts
```

### config.json

```typescript
interface ClaudeAgentConfig {
  // Model configuration
  model?: string;                    // Default: "claude-sonnet-4.5-20250929"
  fallbackModel?: string;            // Fallback model if primary unavailable
  maxTurns?: number;                 // Default: 50

  // System prompt
  systemPrompt?: {
    path: string;                    // Relative path to prompt file
    mode?: 'append' | 'replace';     // Default: 'append'
  };

  // Settings
  settings?: {
    permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan';
    allowedTools?: string[];         // Tool allowlist
  };

  // MCP servers
  mcpServers?: {
    enabled: string[];               // Enabled server names
    directory: string;               // Default: "mcp-servers"
  };

  // Skills
  skills?: {
    enabled: string[];               // Enabled skill names
    directory: string;               // Default: "skills"
  };

  // Extra CLI arguments
  extraArgs?: Record<string, string | null>;
}
```

### config.json 示例

```json
{
  "model": "claude-sonnet-4.5-20250929",
  "fallbackModel": "claude-3-5-sonnet-20241022",
  "maxTurns": 100,
  "systemPrompt": {
    "path": "system_prompt.txt",
    "mode": "append"
  },
  "settings": {
    "permissionMode": "acceptEdits",
    "allowedTools": ["Read", "Edit", "Grep", "Bash"]
  },
  "mcpServers": {
    "enabled": ["filesystem", "git"],
    "directory": "mcp-servers"
  }
}
```

## .claude/hooks/ 目录

用于拦截代理行为的自定义钩子。

### 结构

```
.claude/hooks/
├── package.json           # Node.js project config
├── tsconfig.json          # TypeScript config
├── src/                   # Source files
│   └── index.ts           # Hook implementations
├── dist/                  # Built output (generated)
│   └── index.mjs
└── node_modules/          # Dependencies (gitignored)
```

### 最小的 package.json

```json
{
  "name": "agent-hooks",
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

### 钩子实现（src/index.ts）

```typescript
import type {
  PreToolUseHookInput,
  PostToolUseHookInput,
} from '@anthropic-ai/claude-agent-sdk';
import type { RepositoryInitHookInput } from '@agentrix/shared';

export async function PreToolUse(
  input: PreToolUseHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  return { decision: 'approve' };
}

export async function RepositoryInit(
  input: RepositoryInitHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  // Initialize repository
  return {};
}
```

详情请参阅[钩子文档](./hooks/overview.md) 。

## .claude/mcp-servers/ 目录

MCP（模型上下文协议）服务器配置。

### 结构

```
.claude/mcp-servers/
├── filesystem/
│   └── config.json
├── git/
│   └── config.json
└── custom-server/
    └── config.json
```

### MCP Server config.json

```typescript
interface MCPServerConfig {
  name: string;                      // Server name
  command?: string;                  // Command to execute (stdio transport)
  args?: string[];                   // Command arguments
  env?: Record<string, string>;      // Environment variables
  url?: string;                      // Server URL (http transport)
  transport?: 'stdio' | 'http';      // Transport type
}
```

### 示例

```json
{
  "name": "filesystem",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
  "transport": "stdio"
}
```

参见 [MCP 服务器指南](./mcp-servers.md)了解更多。

## .claude/skills/ 目录

自定义可重用技能。

### 结构

```
.claude/skills/
└── code-formatter/
    ├── skill.json
    └── implementation.ts
```

### skill.json

```json
{
  "name": "code-formatter",
  "description": "Format code using prettier",
  "enabled": true,
  "implementation": "implementation.ts"
}
```

参见[技能指南](./skills.md)了解更多。

## .codex/ 目录（未来）

OpenAI Codex 特定配置（尚未实现）。

```
.codex/
├── config.json
└── ... (TBD)
```

## 最佳实践

### 1\. 版本控制

**请提交** :

*   `agent.json`
*   `.claude/config.json`
*   `.claude/system_prompt.txt`
*   `.claude/hooks/src/` (源文件)
*   `.claude/hooks/package.json`
*   `.claude/hooks/tsconfig.json`
*   `.claude/mcp-servers/*/config.json`
*   `.claude/skills/*/`

**不要提交** :

*   `.claude/hooks/node_modules/`
*   `.claude/hooks/dist/` (可选：为方便起见可以提交)
*   特定环境的文件（`.env`，凭证）

### 2\. .gitignore 模板

```gitignore
# Dependencies
node_modules/
.pnpm/

# Build output
dist/
*.js
*.mjs

# Environment
.env
.env.local
*.key
credentials.json

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp
```

### 3\. 文档

包含一个全面的 README.md：

```markdown
# Agent Name

Brief description

## Features

- Feature 1
- Feature 2

## Installation

\`\`\`bash
# Install in Agentrix
agentrix agent add <repo-url>
\`\`\`

## Configuration

Explain any custom configuration

## Hooks

List custom hooks and their purpose

## License

MIT
```

### 4\. 测试

包含测试用例和文档：

```
tests/
├── fixtures/
│   └── sample-project/
└── integration/
    └── agent.test.ts
```

## 验证

Agentrix CLI 验证代理结构：

```bash
# Validate agent
agentrix agent validate /path/to/agent

# Output
✓ agent.json valid
✓ .claude/config.json valid
✓ Hooks built successfully
⚠ No system_prompt.txt (optional)
```

## 迁移指南

### 从旧格式迁移

如果您有旧的代理格式，请使用以下方式迁移：

```bash
agentrix agent migrate /path/to/old-agent
```

这将：

1.  从旧元数据创建 `agent.json`
2.  移动配置到新结构
3.  更新钩子导入以使用 `@agentrix/shared`

## 摘要

*   **agent.json**：必需的根元数据
*   **.claude/**: Claude SDK 配置、钩子、MCP 服务器、技能
*   **.codex/**: 未来 Codex 配置
*   **钩子** : TypeScript 项目，包含类型安全的钩子实现
*   **版本控制** : 提交配置、源代码；忽略构建产物

接下来： [配置指南](./configuration.md)