# RepositoryInit Hook

The `RepositoryInit` hook is triggered when initializing a **new** git repository (git init mode only). It allows you to set up initial files before the first commit.

## Overview

- **Type**: Agentrix custom hook (from `@agentrix/shared`)
- **Trigger**: After `git init`, before initial commit
- **Use case**: Initialize repository structure, add custom .gitignore rules, create README files
- **Frequency**: Once per new repository
- **Important**: NOT triggered in git clone mode (to avoid modifying cloned projects)

## When It Triggers

### ✅ Triggers

```bash
# Scenario 1: New task without git URL (git init mode)
agentrix task create --agent=my-agent --prompt="Build a new project"
# → RepositoryInit hook executes

# Scenario 2: Local directory without git (becomes git init)
agentrix task create --cwd=/path/to/empty-dir --agent=my-agent
# → RepositoryInit hook executes
```

### ❌ Does NOT Trigger

```bash
# Scenario 1: Task with git URL (git clone mode)
agentrix task create \
  --agent=my-agent \
  --git-url=https://github.com/user/repo \
  --prompt="Add a feature"
# → RepositoryInit hook SKIPPED (existing repository)

# Scenario 2: Existing git repository
agentrix task create --cwd=/path/to/existing-repo --agent=my-agent
# → RepositoryInit hook SKIPPED (already initialized)
```

## Hook Signature

```typescript
import type { RepositoryInitHookInput } from '@agentrix/shared';

export async function RepositoryInit(
  input: RepositoryInitHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
): Promise<{}>
```

## Input Type

```typescript
interface RepositoryInitHookInput {
  /**
   * Hook event name (always 'RepositoryInit')
   */
  hook_event_name: 'RepositoryInit';

  /**
   * Absolute path to the workspace directory
   */
  workspace_path: string;

  /**
   * Task ID for this workspace
   */
  task_id: string;
}
```

**Note**: Fields like `git_url` and `base_branch` exist in the type definition but are always `undefined` for this hook, as it only triggers in git init mode.

## Return Value

```typescript
return {};  // Empty object
```

## Example Usage

### Basic: Add Custom .gitignore Rules

```typescript
import type { RepositoryInitHookInput } from '@agentrix/shared';
import { appendFileSync } from 'fs';
import { join } from 'path';

export async function RepositoryInit(
  input: RepositoryInitHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  const { workspace_path } = input;

  try {
    // Add custom .gitignore rules
    const gitignorePath = join(workspace_path, '.gitignore');

    appendFileSync(gitignorePath, `
# Added by Agent Hook
.env
.env.local
.env.*.local
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build output
dist/
build/
.next/
.nuxt/

# Dependencies
node_modules/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Test coverage
coverage/
.nyc_output/
`);

    console.log('✓ Added custom .gitignore rules');
  } catch (error) {
    console.error('[RepositoryInit] Failed:', error);
  }

  return {};
}
```

### Advanced: Create Initial Project Structure

```typescript
import type { RepositoryInitHookInput } from '@agentrix/shared';
import { mkdirSync, writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';

export async function RepositoryInit(
  input: RepositoryInitHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  const { workspace_path, task_id } = input;

  try {
    // 1. Custom .gitignore
    appendFileSync(
      join(workspace_path, '.gitignore'),
      '\n.env\nnode_modules/\ndist/\n'
    );

    // 2. Create README.md
    writeFileSync(
      join(workspace_path, 'README.md'),
      `# Project

Created by Agentrix Agent
Task ID: ${task_id}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`
`
    );

    // 3. Create src/ directory
    mkdirSync(join(workspace_path, 'src'), { recursive: true });

    // 4. Create package.json template
    writeFileSync(
      join(workspace_path, 'package.json'),
      JSON.stringify({
        name: 'my-project',
        version: '0.1.0',
        scripts: {
          dev: 'echo "Add dev script"',
          build: 'echo "Add build script"',
          test: 'echo "Add test script"'
        }
      }, null, 2)
    );

    console.log('✓ Initialized project structure');
  } catch (error) {
    console.error('[RepositoryInit] Error:', error);
  }

  return {};
}
```

### Complete Example: Language-Specific Setup

```typescript
import type { RepositoryInitHookInput } from '@agentrix/shared';
import { writeFileSync, appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export async function RepositoryInit(
  input: RepositoryInitHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  const { workspace_path } = input;

  // Detect project type from files (if any exist)
  const projectType = detectProjectType(workspace_path);

  try {
    switch (projectType) {
      case 'node':
        setupNodeProject(workspace_path);
        break;
      case 'python':
        setupPythonProject(workspace_path);
        break;
      case 'go':
        setupGoProject(workspace_path);
        break;
      default:
        setupGenericProject(workspace_path);
    }

    console.log(`✓ Initialized ${projectType} project`);
  } catch (error) {
    console.error('[RepositoryInit] Error:', error);
  }

  return {};
}

function detectProjectType(workspacePath: string): string {
  // Check for project indicators
  const fs = require('fs');

  if (fs.existsSync(join(workspacePath, 'package.json'))) return 'node';
  if (fs.existsSync(join(workspacePath, 'requirements.txt'))) return 'python';
  if (fs.existsSync(join(workspacePath, 'go.mod'))) return 'go';

  return 'generic';
}

function setupNodeProject(workspacePath: string) {
  appendFileSync(
    join(workspacePath, '.gitignore'),
    '\nnode_modules/\ndist/\n.env\n'
  );

  writeFileSync(
    join(workspacePath, '.nvmrc'),
    '20\n'
  );
}

function setupPythonProject(workspacePath: string) {
  appendFileSync(
    join(workspacePath, '.gitignore'),
    '\n__pycache__/\n*.pyc\nvenv/\n.env\n'
  );

  writeFileSync(
    join(workspacePath, '.python-version'),
    '3.11\n'
  );
}

function setupGoProject(workspacePath: string) {
  appendFileSync(
    join(workspacePath, '.gitignore'),
    '\n*.exe\n*.dll\n*.so\n*.dylib\nvendor/\n'
  );
}

function setupGenericProject(workspacePath: string) {
  appendFileSync(
    join(workspacePath, '.gitignore'),
    '\n.env\n*.log\n'
  );
}
```

## Common Use Cases

### 1. Add License File

```typescript
import { writeFileSync } from 'fs';
import { join } from 'path';

export async function RepositoryInit(input: RepositoryInitHookInput) {
  const licensePath = join(input.workspace_path, 'LICENSE');

  writeFileSync(licensePath, `MIT License

Copyright (c) ${new Date().getFullYear()} Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy...
`);

  return {};
}
```

### 2. Create Template Files

```typescript
export async function RepositoryInit(input: RepositoryInitHookInput) {
  const { workspace_path } = input;

  // Create .editorconfig
  writeFileSync(join(workspace_path, '.editorconfig'), `
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
`);

  // Create .prettierrc
  writeFileSync(join(workspace_path, '.prettierrc'), JSON.stringify({
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'es5'
  }, null, 2));

  return {};
}
```

### 3. Copy Template Directory

```typescript
import { cpSync } from 'fs';
import { join } from 'path';

export async function RepositoryInit(input: RepositoryInitHookInput) {
  const templateDir = join(__dirname, '../../templates/base');
  const { workspace_path } = input;

  // Copy entire template directory
  cpSync(templateDir, workspace_path, { recursive: true });

  console.log('✓ Copied template files');

  return {};
}
```

### 4. GitHub Actions Setup

```typescript
export async function RepositoryInit(input: RepositoryInitHookInput) {
  const workflowDir = join(input.workspace_path, '.github/workflows');
  mkdirSync(workflowDir, { recursive: true });

  writeFileSync(join(workflowDir, 'ci.yml'), `
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
`);

  return {};
}
```

## Timing and Execution Flow

```
Task starts (git init mode)
  ↓
git init
  ↓
RepositoryInit hook executes  ← You are here
  ↓
git add .
  ↓
git commit -m "Initial commit"  ← Hook changes included
  ↓
Agent starts working
```

**Key point**: Files created/modified by the hook are included in the initial commit.

## Best Practices

### 1. Error Handling

```typescript
export async function RepositoryInit(input: RepositoryInitHookInput) {
  try {
    // Your logic
    appendFileSync(join(input.workspace_path, '.gitignore'), '\n.env\n');
  } catch (error) {
    console.error('[RepositoryInit] Failed:', error);
    // Hook failure is non-fatal, repository initialization continues
  }

  return {};
}
```

### 2. Check Existing Files

```typescript
import { existsSync, appendFileSync, writeFileSync } from 'fs';

export async function RepositoryInit(input: RepositoryInitHookInput) {
  const gitignorePath = join(input.workspace_path, '.gitignore');

  if (existsSync(gitignorePath)) {
    // File exists, append to it
    appendFileSync(gitignorePath, '\n# Custom rules\n.env\n');
  } else {
    // File doesn't exist, create it
    writeFileSync(gitignorePath, '# Custom rules\n.env\n');
  }

  return {};
}
```

### 3. Use Path Join

```typescript
// ✅ Good: Cross-platform
import { join } from 'path';
const filePath = join(input.workspace_path, '.gitignore');

// ❌ Bad: Unix-only
const filePath = `${input.workspace_path}/.gitignore`;
```

### 4. Log Actions

```typescript
export async function RepositoryInit(input: RepositoryInitHookInput) {
  console.log('[RepositoryInit] Starting initialization');

  const files = ['.gitignore', 'README.md', 'LICENSE'];

  for (const file of files) {
    try {
      createFile(join(input.workspace_path, file));
      console.log(`  ✓ Created ${file}`);
    } catch (error) {
      console.error(`  ✗ Failed to create ${file}:`, error);
    }
  }

  console.log('[RepositoryInit] Completed');

  return {};
}
```

## Limitations

### Cannot Modify Git Settings

```typescript
// ❌ Cannot modify git config
export async function RepositoryInit(input: RepositoryInitHookInput) {
  execSync('git config user.name "Agent"', {
    cwd: input.workspace_path
  });
  // This won't have the desired effect
}
```

Git configuration is managed by the system, not by hooks.

### Cannot Clone Repositories

```typescript
// ❌ Cannot clone other repos
export async function RepositoryInit(input: RepositoryInitHookInput) {
  execSync('git clone https://github.com/template/repo', {
    cwd: input.workspace_path
  });
  // This will fail - repository already initialized
}
```

Use file copying instead.

### Limited to File Operations

The hook can:
- ✅ Create files
- ✅ Modify files
- ✅ Create directories
- ❌ Execute git commands
- ❌ Install dependencies (agent can do this later)
- ❌ Start servers

## Debugging

### Enable Logging

```typescript
export async function RepositoryInit(input: RepositoryInitHookInput) {
  console.log('[RepositoryInit] Input:', JSON.stringify(input, null, 2));
  console.log('[RepositoryInit] Workspace:', input.workspace_path);
  console.log('[RepositoryInit] Task ID:', input.task_id);

  // Your logic

  console.log('[RepositoryInit] Completed successfully');

  return {};
}
```

### Check Initial Commit

```bash
# After task starts, check initial commit
cd /path/to/workspace
git log --oneline
git show HEAD  # Shows files created by hook
```

### Test Locally

```bash
# Test repository init
agentrix task create --agent=./my-agent --prompt="Create a new project"

# Check workspace
ls -la ~/.agentrix/workspaces/<task-id>/project/
```

## Related Hooks

- [SessionStart](./session-hooks.md#sessionstart) - Session initialization
- [PreToolUse](./pre-tool-use.md) - Control tool execution

## Related Documentation

- [Hook Overview](./overview.md) - Hook concepts
- [Development Guide](./development-guide.md) - TypeScript setup
- [Examples](./examples.md) - More patterns

## Summary

- **Purpose**: Initialize new git repositories with custom files
- **Trigger**: Git init mode only (NOT git clone)
- **Timing**: After `git init`, before initial commit
- **Input**: `workspace_path`, `task_id`
- **Output**: Empty object `{}`
- **Use cases**: .gitignore, README, project structure, templates
- **Best practices**: Error handling, check existing files, log actions
