# 最佳实践

构建健壮智能体的推荐模式。

## 智能体设计

### 1\. 明确目的

```json
{
  "name": "code-reviewer",
  "description": "Automated code review focusing on security and style",
  "tags": ["security", "code-review", "linting"]
}
```

### 2\. 聚焦系统提示

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

### 3\. 合适的权限模式

```json
{
  "settings": {
    "permissionMode": "acceptEdits",  // Auto-approve edits for speed
    "allowedTools": ["Read", "Grep", "Edit"]  // Limit to safe tools
  }
}
```

## 钩子模式

### 1\. 安全失败

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

### 2\. 保持钩子快速

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

### 3\. 合理记录日志

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

## 配置

### 1\. 设置 maxTurns

```json
{
  "maxTurns": 50  // Prevent infinite loops
}
```

### 2\. 使用工具允许列表

```json
{
  "settings": {
    "allowedTools": ["Read", "Grep", "Edit"]  // Security-sensitive agents
  }
}
```

### 3\. 提供备用模型

```json
{
  "model": "claude-sonnet-4.5-20250929",
  "fallbackModel": "claude-3-5-sonnet-20241022"  // Availability
}
```

## 安全

1.  **验证输入** : 在钩子中检查工具参数
2.  **限制权限** : 使用严格的权限模式
3.  **审计操作** : 使用 PostToolUse 记录所有操作
4.  **阻止危险命令** ：实现 PreToolUse 防护
5.  **不要提交秘密** ：将.env 文件加入.gitignore

## 性能

1.  **保持钩子快速** （通常小于 1 秒）
2.  **限制 maxTurns** 以防止失控执行
3.  **使用高效工具** ：优先选择 Read 而非 Bash cat
4.  **在钩子中缓存昂贵的操作**
5.  **在热点路径中尽量减少外部 API 调用**

## 文档

1.  **全面的 README**: 解释代理的目的和使用方法
2.  **文档钩子** : 解释自定义行为
3.  **提供示例** : 展示实际应用
4.  **保持更新** : 与代码变更同步文档

## 版本控制

```gitignore
# .gitignore
node_modules/
.env
*.log
dist/  # Optional: can commit for convenience
```

提交：

*   源代码
*   配置
*   文档
*   测试

不要提交：

*   依赖项
*   构建工件（可选）
*   秘密
*   日志

## 相关

*   [代理结构](./agent-structure.md)
*   [配置](./configuration.md)
*   [钩子系统概述](./hooks/overview.md)
*   [测试](./testing.md)