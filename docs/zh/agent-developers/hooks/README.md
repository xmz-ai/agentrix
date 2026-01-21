# 钩子系统

Agentrix 钩子系统允许您在关键生命周期节点拦截和定制代理行为。

## 钩子是什么？

钩子是在代理执行过程中特定时刻执行的 TypeScript 函数。它们使您能够：

*   **控制工具执行** ：在执行前批准、拒绝或修改工具调用
*   **初始化仓库** : 在创建新的 git 仓库时设置文件
*   **跟踪会话** : 监控代理生命周期事件
*   **处理结果** : 检查和转换工具输出
*   **添加自定义逻辑** : 注入特定领域的行为

## 快速示例

```typescript
import type { PreToolUseHookInput } from '@anthropic-ai/claude-agent-sdk';

export async function PreToolUse(
  input: PreToolUseHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  // Block destructive operations
  if (input.tool_name === 'Bash' &&
      input.tool_input?.command?.includes('rm -rf')) {
    return { decision: 'block', systemMessage: 'Destructive command blocked' };
  }

  return { decision: 'approve' };
}
```

## 可用钩子

Agentrix 支持 **12 种钩子类型** ：

### Claude SDK 钩子 (11)

从 `@anthropic-ai/claude-agent-sdk` ：

1.  **PreToolUse** - 在工具执行前
2.  **PostToolUse** - 在工具执行后
3.  **SessionStart** - 当代理会话开始时
4.  **SessionEnd** - 当代理会话结束时
5.  **UserPromptSubmit** - 当用户提交提示时
6.  **Stop** - 当代理停止时
7.  **SubagentStart** - 当子代理开始时
8.  **SubagentStop** - 当子代理停止时
9.  **PreCompact** - 在上下文压缩之前
10.  **Notification** - 系统通知
11.  **PermissionRequest** - 当需要权限时

### Agentrix 自定义钩子 (1)

来自 `@agentrix/shared`:

12.  **RepositoryInit** - 当初始化新的 git 仓库时

## 钩子文档

### 按类别

**工具控制** :

*   [使用前工具 & 使用后工具](./pre-tool-use.md) \- 控制和监控工具执行

**会话生命周期** :

*   [会话钩子](./session-hooks.md) \- SessionStart, SessionEnd, UserPromptSubmit, Stop, SubagentStop

**仓库管理** :

*   [RepositoryInit](./repository-init.md) - 初始化新仓库

**系统事件** :

*   [预压缩](./pre-tool-use.md#precompact) \- 上下文管理
*   [通知](./pre-tool-use.md#notification) \- 系统通知

### 全面指南

*   [概述](./overview.md) \- 钩子概念和架构
*   [开发指南](./development-guide.md) \- 设置 TypeScript 项目
*   [钩子类型参考](./hook-types.md) \- 完整类型定义
*   [Examples](./examples.md) - 真实世界模式

## 入门指南

### 1\. 设置钩子项目

```bash
mkdir -p .claude/hooks/src
cd .claude/hooks
```

创建 `package.json`:

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

### 2\. 安装依赖

```bash
npm install
```

### 3\. 创建钩子

创建 `src/index.ts`:

```typescript
import type { PreToolUseHookInput } from '@anthropic-ai/claude-agent-sdk';

export async function PreToolUse(
  input: PreToolUseHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  console.log(`[PreToolUse] ${input.tool_name}`);
  return { decision: 'approve' };
}
```

### 4\. 构建

```bash
npm run build
```

请参考[开发指南](./development-guide.md)进行完整设置。

## 钩子执行顺序

当代理运行时，钩子按此顺序执行：

```
1. SessionStart
   ↓
2. UserPromptSubmit (for each user message)
   ↓
3. PreToolUse (for each tool call)
   ↓
4. [Tool Executes]
   ↓
5. PostToolUse (for each tool result)
   ↓
6. PreCompact (if context limit reached)
   ↓
7. Stop / SessionEnd (when session ends)
```

特殊钩子：

*   **RepositoryInit**：在 `git init` 期间运行一次（初始提交之前）
*   **SubagentStop**：在子代理完成时运行
*   **Notification**：由系统事件触发

## 常见模式

### 安全控制

```typescript
export async function PreToolUse(input: PreToolUseHookInput) {
  // Deny dangerous bash commands
  if (input.tool_name === 'Bash') {
    const cmd = input.tool_input?.command;
    if (cmd?.match(/rm -rf|dd if=|mkfs/)) {
      return { decision: 'deny', message: 'Unsafe command' };
    }
  }
  return { decision: 'approve' };
}
```

### 审计日志

```typescript
import { appendFileSync } from 'fs';

export async function PostToolUse(input: PostToolUseHookInput) {
  const log = {
    timestamp: new Date().toISOString(),
    tool: input.tool_name,
    success: !input.tool_response?.error
  };

  appendFileSync('audit.log', JSON.stringify(log) + '\n');
  return {};
}
```

### 仓库设置

```typescript
import { appendFileSync } from 'fs';
import { join } from 'path';

export async function RepositoryInit(input: RepositoryInitHookInput) {
  // Add custom .gitignore rules
  const gitignorePath = join(input.workspace_path, '.gitignore');
  appendFileSync(gitignorePath, '\n.env\n*.log\n');

  return {};
}
```

参见[示例](./examples.md)了解更多模式。

## 类型安全

所有钩子类型都可在 `@agentrix/shared` 中获取：

```typescript
import type {
  // Tool hooks
  PreToolUseHookInput,
  PostToolUseHookInput,

  // Session hooks
  SessionStartHookInput,
  SessionEndHookInput,
  UserPromptSubmitHookInput,
  StopHookInput,
  SubagentStopHookInput,

  // System hooks
  PreCompactHookInput,
  NotificationHookInput,

  // Agentrix custom hooks
  RepositoryInitHookInput,
} from '@agentrix/shared';
```

## 最佳实践

1.  **错误处理** ：钩子不应崩溃 - 用 try/catch 包裹
2.  **超时** : 钩子有 30 秒超时 - 保持它们快速
3.  **副作用** : 对文件系统操作要谨慎
4.  **日志记录** : 使用 console.log 进行调试（可在代理日志中查看）
5.  **类型安全** : 总是从 `@agentrix/shared` 导入类型

## 调试钩子

### 启用详细日志记录

```bash
DEBUG=agentrix:hooks agentrix run --agent=./my-agent
```

### 检查钩子执行

```typescript
export async function PreToolUse(input: PreToolUseHookInput) {
  console.log('[DEBUG] PreToolUse called:', {
    tool: input.tool_name,
    input: input.tool_input
  });
  return { decision: 'approve' };
}
```

### 本地测试钩子

```typescript
// test/hook.test.ts
import { PreToolUse } from '../src/index';

const mockInput = {
  tool_name: 'Read',
  tool_input: { file_path: 'test.txt' }
};

const result = await PreToolUse(mockInput, 'test-id', {
  signal: new AbortController().signal
});

console.assert(result.decision === 'approve');
```

## 限制

*   钩子运行在隔离进程中（钩子之间没有共享状态）
*   每个钩子30秒超时
*   无法修改代理的基础系统提示
*   无法添加新工具（请使用 MCP 服务器）

## 从旧版钩子迁移

旧格式：

```typescript
export function preToolUse(toolName: string, input: any) {
  // ...
}
```

新格式：

```typescript
import type { PreToolUseHookInput } from '@anthropic-ai/claude-agent-sdk';

export async function PreToolUse(
  input: PreToolUseHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  // ...
}
```

## 下一步

*   [开发指南](./development-guide.md) \- 设置 TypeScript 项目
*   [钩子类型参考](./hook-types.md) \- 所有钩子签名
*   [示例](./examples.md) \- 复制粘贴模式
*   [API 参考](../api-reference.md) \- 完整类型定义

## 获取帮助

*   [GitHub Issues](https://github.com/agentrix/agentrix/issues)
*   [Discord 社区](https://discord.gg/agentrix)
*   [钩子示例存储库](https://github.com/agentrix/hook-examples)