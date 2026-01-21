# Hook Development Guide

This guide walks through setting up a TypeScript project for developing Agentrix hooks with full type safety.

## Prerequisites

- Node.js 18+ and npm/yarn
- TypeScript knowledge
- Basic understanding of [hooks concepts](./overview.md)

## Project Setup

### Step 1: Initialize Project

```bash
# From your agent root directory
mkdir -p .claude/hooks/src
cd .claude/hooks
npm init -y
```

### Step 2: Install Dependencies

```bash
npm install @agentrix/shared
npm install --save-dev @anthropic-ai/claude-agent-sdk @types/node typescript
```

**Dependencies explained**:
- `@agentrix/shared`: Provides Agentrix custom hook types (e.g., RepositoryInitHookInput)
- `@anthropic-ai/claude-agent-sdk`: Provides Claude SDK hook types (PreToolUse, PostToolUse, etc.)
- `@types/node`: Node.js type definitions
- `typescript`: TypeScript compiler

### Step 3: Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Key settings**:
- `module: "ES2022"`: Use ES modules
- `moduleResolution: "bundler"`: Resolve `@agentrix/shared` correctly
- `strict: true`: Enable all TypeScript strict checks
- `outDir: "./dist"`: Output to dist/ directory

### Step 4: Update package.json

```json
{
  "name": "my-agent-hooks",
  "version": "1.0.0",
  "type": "module",
  "description": "Custom hooks for my-agent",
  "main": "dist/index.mjs",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@agentrix/shared": "^1.0.0"
  },
  "devDependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.30",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Important**: Set `"type": "module"` for ES module support.

### Step 5: Create .gitignore

```gitignore
node_modules/
dist/
*.log
.DS_Store
```

## Creating Your First Hook

### Basic Hook Template

Create `src/index.ts`:

```typescript
// Claude SDK hooks
import type {
  PreToolUseHookInput,
  PostToolUseHookInput,
} from '@anthropic-ai/claude-agent-sdk';

// Agentrix custom hooks
import type {
  RepositoryInitHookInput
} from '@agentrix/shared';

/**
 * PreToolUse: Called before each tool execution
 */
export async function PreToolUse(
  input: PreToolUseHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  console.log(`[PreToolUse] ${input.tool_name}`);
  return { decision: 'approve' as const };
}

/**
 * PostToolUse: Called after each tool execution
 */
export async function PostToolUse(
  input: PostToolUseHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  console.log(`[PostToolUse] ${input.tool_name} completed`);
  return {};
}

/**
 * RepositoryInit: Called when initializing new git repository
 */
export async function RepositoryInit(
  input: RepositoryInitHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  console.log(`[RepositoryInit] ${input.workspace_path}`);
  return {};
}
```

### Build and Test

```bash
# Build hooks
npm run build

# Check output
ls -la dist/

# Expected output:
# index.mjs        - Compiled JavaScript
# index.d.ts       - Type definitions
# index.d.ts.map   - Source map for types
# index.mjs.map    - Source map for code
```

## Using AgentrixContext in Hooks

Hooks can access `AgentrixContext` to get workspace information, task/user IDs, and make RPC calls to the API server. This is done using the **factory pattern**.

### Factory Pattern

Instead of exporting hooks directly, export a default function that receives the context and returns your hooks:

```typescript
// src/index.ts
import type { HookFactory, AgentrixContext } from '@agentrix/shared';
import type { PreToolUseHookInput, PostToolUseHookInput } from '@anthropic-ai/claude-agent-sdk';

/**
 * Factory function that receives AgentrixContext
 */
const createHooks: HookFactory = (context: AgentrixContext) => ({
  PreToolUse: async (
    input: PreToolUseHookInput,
    toolUseID: string,
    options: { signal: AbortSignal }
  ) => {
    // Access context methods
    const workspace = context.getWorkspace();
    const taskId = context.getTaskId();
    const userId = context.getUserId();

    console.log(`[PreToolUse] Task ${taskId} by user ${userId}`);
    console.log(`[PreToolUse] Workspace: ${workspace}`);
    console.log(`[PreToolUse] Tool: ${input.tool_name}`);

    return { decision: 'approve' as const };
  },

  PostToolUse: async (
    input: PostToolUseHookInput,
    toolUseID: string,
    options: { signal: AbortSignal }
  ) => {
    const taskId = context.getTaskId();
    console.log(`[PostToolUse] Task ${taskId}: ${input.tool_name} completed`);
    return {};
  },
});

export default createHooks;
```

### AgentrixContext Methods

The `AgentrixContext` interface provides:

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getWorkspace()` | `string` | Absolute path to the workspace directory |
| `getTaskId()` | `string` | Current task ID |
| `getUserId()` | `string` | Current user ID |
| `createAgentBuilder(params)` | `Promise<{agentId, displayName}>` | Create a new agent builder (RPC) |

### When to Use Factory Pattern

Use the factory pattern when your hooks need to:

1. **Access workspace path** - Know where files are being modified
2. **Track task/user context** - Log or audit based on task/user
3. **Make API calls** - Use RPC methods like `createAgentBuilder()`
4. **Share state across hooks** - Use closure variables in the factory

### Direct Export vs Factory Pattern

**Direct exports** (simple, backwards-compatible):
```typescript
// No context access
export async function PreToolUse(input: PreToolUseHookInput) {
  return { decision: 'approve' as const };
}
```

**Factory pattern** (with context access):
```typescript
// Full context access
const createHooks: HookFactory = (context) => ({
  PreToolUse: async (input) => {
    const workspace = context.getWorkspace();
    // ...
  },
});
export default createHooks;
```

Both patterns are fully supported. Use direct exports for simple hooks, factory pattern when you need context.

## Type Safety

### Importing Types

Hook types come from two packages:

```typescript
// Claude SDK hooks (11 types)
import type {
  PreToolUseHookInput,
  PostToolUseHookInput,
  SessionStartHookInput,
  SessionEndHookInput,
  UserPromptSubmitHookInput,
  StopHookInput,
  SubagentStartHookInput,
  SubagentStopHookInput,
  PreCompactHookInput,
  NotificationHookInput,
  PermissionRequestHookInput,
} from '@anthropic-ai/claude-agent-sdk';

// Agentrix custom hooks (1 type)
import type {
  RepositoryInitHookInput,
} from '@agentrix/shared';
```

### Type Checking

```bash
# Type-check without building
npm run typecheck

# Watch mode for development
npm run dev
```

### IDE Support

With TypeScript configured, you get:

1. **Autocomplete**: Type `input.` and see available properties
2. **Type hints**: Hover over types to see documentation
3. **Error detection**: Typos caught immediately
4. **Jump to definition**: Navigate to type source

Example:

```typescript
export async function PreToolUse(input: PreToolUseHookInput) {
  // TypeScript knows input has these properties:
  input.tool_name     // ✓ string
  input.tool_input    // ✓ any
  input./* cursor */  // IDE shows autocomplete

  // TypeScript catches errors:
  input.toolName      // ✗ Property 'toolName' does not exist
}
```

## Hook Input Types Reference

### PreToolUseHookInput

```typescript
interface PreToolUseHookInput {
  // BaseHookInput fields
  hook_event_name: 'PreToolUse';
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;

  // PreToolUse-specific fields
  tool_name: string;           // Tool being called (e.g., "Read", "Bash")
  tool_input: unknown;         // Tool-specific input parameters
  tool_use_id: string;         // Unique tool use identifier
}

// Return type
type PreToolUseResult = {
  decision?: 'approve' | 'block';
  systemMessage?: string;      // Shown to user if blocked
  hookSpecificOutput?: {
    hookEventName: 'PreToolUse';
    permissionDecision?: 'allow' | 'deny' | 'ask';
    permissionDecisionReason?: string;
    updatedInput?: Record<string, unknown>;
  };
};
```

### PostToolUseHookInput

```typescript
interface PostToolUseHookInput {
  // BaseHookInput fields
  hook_event_name: 'PostToolUse';
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;

  // PostToolUse-specific fields
  tool_name: string;           // Tool that was called
  tool_input: unknown;         // Original tool input
  tool_use_id: string;         // Unique tool use identifier
  tool_response: unknown;      // Tool execution result
}

// Return type
type PostToolUseResult = {
  hookSpecificOutput?: {
    hookEventName: 'PostToolUse';
    additionalContext?: string;
    updatedMCPToolOutput?: unknown;
  };
};
```

### RepositoryInitHookInput

```typescript
interface RepositoryInitHookInput {
  hook_event_name: 'RepositoryInit';
  workspace_path: string;      // Absolute path to workspace
  task_id: string;             // Task ID
}

// Return type
type RepositoryInitResult = {};
```

See [Hook Types Reference](./hook-types.md) for complete type definitions.

## Development Workflow

### 1. Write Hook

```typescript
// src/index.ts
export async function PreToolUse(input: PreToolUseHookInput) {
  // Your logic here
  return { decision: 'approve' };
}
```

### 2. Type Check

```bash
npm run typecheck
```

### 3. Build

```bash
npm run build
```

### 4. Test Locally

```bash
# From agent root
agentrix test .
```

### 5. Iterate

Use watch mode for rapid development:

```bash
npm run dev  # Rebuilds on file changes
```

## Common Patterns

### Pattern 1: Safe Approval Logic

```typescript
export async function PreToolUse(
  input: PreToolUseHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  try {
    // Your logic
    if (shouldDeny(input)) {
      return { decision: 'deny' as const, message: 'Reason' };
    }
    return { decision: 'approve' as const };
  } catch (error) {
    console.error('[PreToolUse] Error:', error);
    // Fail open: approve on error
    return { decision: 'approve' as const };
  }
}
```

### Pattern 2: Abort Signal Handling

```typescript
export async function PreToolUse(
  input: PreToolUseHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  // Check if aborted
  if (options.signal.aborted) {
    return { decision: 'approve' as const };
  }

  // Listen for abort
  const controller = new AbortController();
  options.signal.addEventListener('abort', () => {
    controller.abort();
  });

  // Use signal in async operations
  const response = await fetch('https://api.example.com', {
    signal: controller.signal
  });

  return { decision: 'approve' as const };
}
```

### Pattern 3: Type-Safe Tool Input Access

```typescript
export async function PreToolUse(input: PreToolUseHookInput) {
  // Type guard for Bash tool
  if (input.tool_name === 'Bash') {
    const command = input.tool_input?.command as string | undefined;
    if (command?.includes('rm -rf')) {
      return { decision: 'deny' as const };
    }
  }

  // Type guard for Read tool
  if (input.tool_name === 'Read') {
    const filePath = input.tool_input?.file_path as string | undefined;
    if (filePath?.endsWith('.env')) {
      return { decision: 'pending' as const, message: 'Reading .env file' };
    }
  }

  return { decision: 'approve' as const };
}
```

### Pattern 4: Helper Functions

```typescript
// src/index.ts
import { isDangerousCommand, logToolUse } from './utils';

export async function PreToolUse(input: PreToolUseHookInput) {
  if (isDangerousCommand(input)) {
    return { decision: 'deny' as const };
  }

  await logToolUse(input);

  return { decision: 'approve' as const };
}
```

```typescript
// src/utils.ts
import type { PreToolUseHookInput } from '@anthropic-ai/claude-agent-sdk';

export function isDangerousCommand(input: PreToolUseHookInput): boolean {
  if (input.tool_name !== 'Bash') return false;

  const cmd = input.tool_input?.command as string;
  const dangerousPatterns = [
    /rm\s+-rf\s+\//,
    /dd\s+if=/,
    /mkfs/,
    /:\(\)\{ :\|:\& \};:/  // fork bomb
  ];

  return dangerousPatterns.some(pattern => pattern.test(cmd));
}

export async function logToolUse(input: PreToolUseHookInput) {
  // Implementation
}
```

## Testing Hooks

### Unit Tests

```bash
npm install --save-dev vitest @vitest/ui
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

Create `src/index.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { PreToolUse } from './index';
import type { PreToolUseHookInput } from '@anthropic-ai/claude-agent-sdk';

describe('PreToolUse', () => {
  it('approves safe commands', async () => {
    const input: PreToolUseHookInput = {
      hook_event_name: 'PreToolUse',
      session_id: 'test-session',
      transcript_path: '/tmp/transcript',
      cwd: '/tmp',
      tool_name: 'Read',
      tool_input: { file_path: 'test.txt' },
      tool_use_id: 'test-tool-use-id'
    };

    const result = await PreToolUse(input, 'test-id', {
      signal: new AbortController().signal
    });

    expect(result.decision).toBe('approve');
  });

  it('denies dangerous commands', async () => {
    const input: PreToolUseHookInput = {
      hook_event_name: 'PreToolUse',
      session_id: 'test-session',
      transcript_path: '/tmp/transcript',
      cwd: '/tmp',
      tool_name: 'Bash',
      tool_input: { command: 'rm -rf /' },
      tool_use_id: 'test-tool-use-id'
    };

    const result = await PreToolUse(input, 'test-id', {
      signal: new AbortController().signal
    });

    expect(result.decision).toBe('deny');
  });

  it('handles abort signal', async () => {
    const input: PreToolUseHookInput = {
      tool_name: 'Read',
      tool_input: {}
    };

    const controller = new AbortController();
    controller.abort();

    const result = await PreToolUse(input, 'test-id', {
      signal: controller.signal
    });

    // Should still return a result
    expect(result).toHaveProperty('decision');
  });
});
```

Run tests:

```bash
npx vitest
```

### Integration Tests

Test hooks with real agent:

```bash
agentrix test --agent=. --task="Create a file called test.txt"
```

Watch hook output:

```
[PreToolUse] Write
[PreToolUse] Approved: Write tool
[PostToolUse] Write completed
```

## Troubleshooting

### Module Resolution Errors

**Error**: `Cannot find module '@agentrix/shared'`

**Solution**: Ensure `moduleResolution: "bundler"` in tsconfig.json

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"  // Not "node"
  }
}
```

### Build Errors

**Error**: `error TS2307: Cannot find module '@agentrix/shared'`

**Solution**: Install dependencies

```bash
npm install
```

### Runtime Errors

**Error**: `Hook failed: timeout`

**Solution**: Ensure hooks complete within 30 seconds

```typescript
export async function PreToolUse(input: PreToolUseHookInput) {
  // ✗ Slow: External API call
  await fetch('https://slow-api.com');

  // ✓ Fast: Local check
  const isAllowed = checkLocally(input);

  return { decision: isAllowed ? 'approve' : 'deny' };
}
```

## Best Practices

1. **Type Safety**: Import types from correct packages (`@anthropic-ai/claude-agent-sdk` for Claude SDK hooks, `@agentrix/shared` for custom hooks)
2. **Error Handling**: Wrap in try/catch, fail gracefully
3. **Performance**: Keep hooks fast (< 1s typically)
4. **Logging**: Use console.log for debugging
5. **Testing**: Write unit tests for complex logic
6. **Documentation**: Comment hook behavior and edge cases

## Advanced Topics

### Multi-File Organization

```
src/
├── index.ts           # Main exports
├── preToolUse.ts      # PreToolUse logic
├── postToolUse.ts     # PostToolUse logic
├── utils.ts           # Shared utilities
└── types.ts           # Custom type definitions
```

```typescript
// src/index.ts
export { PreToolUse } from './preToolUse';
export { PostToolUse } from './postToolUse';
```

### External Dependencies

You can use npm packages in hooks:

```bash
npm install axios
```

```typescript
import axios from 'axios';

export async function PreToolUse(input: PreToolUseHookInput) {
  const response = await axios.post('https://api.example.com', input);
  return { decision: response.data.allowed ? 'approve' : 'deny' };
}
```

**Warning**: External dependencies add to build size and startup time.

## Next Steps

- [Hook Types Reference](./hook-types.md) - Complete type definitions
- [Examples](./examples.md) - Copy-paste patterns
- [RepositoryInit](./repository-init.md) - Repository initialization
- [PreToolUse & PostToolUse](./pre-tool-use.md) - Tool control hooks

## Related Documentation

- [Hooks Overview](./overview.md) - Conceptual overview
- [Agent Structure](../agent-structure.md) - Hooks directory structure
- [Testing Guide](../testing.md) - Testing agents and hooks
