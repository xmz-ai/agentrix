# 代理配置

通过 `.claude/config.json` 配置 Agentrix 代理的指南。

## 概述

配置控制代理行为、模型选择、权限和集成。

## config.json 草案

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

## 配置选项

### 模型设置

*   `model`: 主要模型（默认："claude-sonnet-4.5-20250929"）
*   `fallbackModel`: 主要模型不可用时使用的备用模型
*   `maxTurns`: 最大对话轮数（默认：50）

### 系统提示

*   `systemPrompt.path`: 提示文件的相对路径
*   `systemPrompt.mode`: "append"（添加到基础）或 "replace"（覆盖基础）

### 权限模式

*   `default`: 破坏性操作需要审批
*   `acceptEdits`: 自动审批编辑工具
*   `bypassPermissions`: 自动审批所有工具（谨慎使用）
*   `plan`: 执行前显示计划

### 工具允许列表

限制工具为特定集合：

```json
{
  "settings": {
    "allowedTools": ["Read", "Grep", "Bash"]
  }
}
```

## 最佳实践

1.  始终设置 `maxTurns` 以防止无限循环
2.  使用 `allowedTools` 对安全敏感的代理
3.  保持系统提示简洁集中
4.  在本地测试配置更改

## 相关

*   [代理结构](./agent-structure.md)
*   [系统提示](./best-practices.md#system-prompts)