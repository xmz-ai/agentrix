# RepositoryInit Hook

当初始化一个**新的** git 仓库（仅 git init 模式）时，会触发 `RepositoryInit` 钩子。它允许你在第一次提交之前设置初始文件。

## 概述

*   **类型** ：Agentrix 自定义钩子（来自 `@agentrix/shared`）
*   **触发时机** ：在 `git init` 之后，第一次提交之前
*   **用例** : 初始化仓库结构，添加自定义 .gitignore 规则，创建 README 文件
*   **频率** : 每个新仓库一次
*   **重要** : 在 git clone 模式下不会触发（避免修改克隆的仓库）

## 触发时机

### ✅ 触发

```bash
# Scenario 1: New task without git URL (git init mode)
agentrix task create --agent=my-agent --prompt="Build a new project"
# → RepositoryInit hook executes

# Scenario 2: Local directory without git (becomes git init)
agentrix task create --cwd=/path/to/empty-dir --agent=my-agent
# → RepositoryInit hook executes
```

### ❌ 不触发

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

## 钩子签名

```typescript
import type { RepositoryInitHookInput } from '@agentrix/shared';

export async function RepositoryInit(
  input: RepositoryInitHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
): Promise<{}>
```

## 输入类型

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

**注意** : 类型定义中存在像 `git_url` 和 `base_branch` 这样的字段，但在这个钩子中它们总是 `undefined`，因为该钩子仅在 git init 模式下触发。

## 返回值

```typescript
return {};  // Empty object
```

## 示例用法

### 基础：添加自定义 .gitignore 规则

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

### 高级：创建初始项目结构

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

### 完整示例：语言特定设置

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

## 常见使用场景

### 1\. 添加许可证文件

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

### 2\. 创建模板文件

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

### 3\. 复制模板目录

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

### 4\. GitHub Actions 设置

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

## 时间与执行流程

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

**要点** ：由钩子创建/修改的文件包含在初始提交中。

## 最佳实践

### 1\. 错误处理

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

### 2\. 检查现有文件

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

### 3\. 使用路径合并

```typescript
// ✅ Good: Cross-platform
import { join } from 'path';
const filePath = join(input.workspace_path, '.gitignore');

// ❌ Bad: Unix-only
const filePath = `${input.workspace_path}/.gitignore`;
```

### 4\. 记录操作

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

## 限制

### 无法修改 Git 设置

```typescript
// ❌ Cannot modify git config
export async function RepositoryInit(input: RepositoryInitHookInput) {
  execSync('git config user.name "Agent"', {
    cwd: input.workspace_path
  });
  // This won't have the desired effect
}
```

Git 配置由系统管理，而非钩子。

### 无法克隆仓库

```typescript
// ❌ Cannot clone other repos
export async function RepositoryInit(input: RepositoryInitHookInput) {
  execSync('git clone https://github.com/template/repo', {
    cwd: input.workspace_path
  });
  // This will fail - repository already initialized
}
```

使用文件复制代替。

### 仅限于文件操作

钩子可以：

*   ✅ 创建文件
*   ✅ 修改文件
*   ✅ 创建目录
*   ❌ 执行 git 命令
*   ❌ 安装依赖（代理稍后可以完成）
*   ❌ 启动服务器

## 调试

### 启用日志记录

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

### 检查初始提交

```bash
# After task starts, check initial commit
cd /path/to/workspace
git log --oneline
git show HEAD  # Shows files created by hook
```

### 本地测试

```bash
# Test repository init
agentrix task create --agent=./my-agent --prompt="Create a new project"

# Check workspace
ls -la ~/.agentrix/workspaces/<task-id>/project/
```

## 相关钩子

*   [SessionStart](./session-hooks.md#sessionstart) - 会话初始化
*   [PreToolUse](./pre-tool-use.md) - 控制工具执行

## 相关文档

*   [Hook Overview](./overview.md) - 钩子概念
*   [开发指南](./development-guide.md) \- TypeScript 配置
*   [示例](./examples.md) \- 更多模式

## 摘要

*   **目的** ：使用自定义文件初始化新的 git 仓库
*   **触发** ：仅 git init 模式（非 git clone）
*   **时间** : 在 `git init` 之后，初始提交之前
*   **输入** : `workspace_path`, `task_id`
*   **输出** : 空对象 `{}`
*   **用例** : .gitignore, README, 项目结构, 模板
*   **最佳实践** ：错误处理，检查现有文件，记录操作