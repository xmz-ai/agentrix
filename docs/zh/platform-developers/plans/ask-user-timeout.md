# ask_user 超时处理方案（设计草案）

## 背景

CLI 侧通过 `ask_user` 向 App 发起用户确认或输入。目前超时只会在 Worker 内部抛错，
但没有发送 `ask_user_response`，导致 App 端始终保留“待回答”的卡片。
同时超时后 Worker 仍继续执行固定流程（如权限确认、Git 相关流程），不符合预期。

## 目标

- ask_user 超时后能自动清理 App 侧的待答状态
- 固定流程 ask_user 超时视为用户取消并终止任务
- MCP 工具 `ask_user` 超时有明确策略并回传模型

## 非目标

- 不改造 App 的整体消息列表结构
- 不改变 ask_user 基础交互（仍以选项为主）
- 不在本阶段引入复杂的多轮重试 UI

## 现状问题

- ask_user 超时后仅 reject Promise，App 无法收到 response
- UI 侧 `ask_user` 依赖 `ask_user_response` + `opCode` 进行合并，否则一直 pending
- 固定流程在超时后仍继续，和“确认失败即停止”的预期不一致

## 总体方案

### 协议扩展（shared）

- `AskUserResponseMessage` 增加可选字段：
  - `status: "answered" | "cancelled" | "timeout"`（默认 `answered`）
  - `reason?: "user" | "timeout" | "system"`（用于细分来源）
- `answers` 允许为空数组（取消/超时场景无需强制给出选项 label）
- Worker 发出的 `ask_user_response` 需要携带 `opCode`，保证 App 能合并

### CLI 内部超时处理

新增 askUser 执行策略参数（内部使用，不暴露到 App）：

```
askUser(questions, {
  timeoutMs,
  onTimeout: "abort_task" | "return_cancel",
  cancelStatus: "timeout" | "cancelled",
})
```

超时处理统一流程：

1. 生成一条“模拟用户取消”的 `ask_user_response`，`status=timeout`。
2. 通过 `task-message` 发送给 App（带 `opCode=ask_user.eventId`）。
3. 本地 resolve/reject 等待的 Promise（避免悬挂）。
4. `onTimeout=abort_task` 时立即终止任务并退出。

### 固定流程（系统 ask_user）处理策略

适用场景：权限确认、Git 状态、merge-pr 操作等。

- 超时即视为用户取消
- 发送 `ask_user_response`（`status=timeout`），确保 UI 关闭
- 发送 system message 提示“超时已取消”
- 调用 `stopTask("ask_user_timeout")` 或等价的退出流程，避免继续执行

### MCP 工具 ask_user 处理策略

建议默认策略：`return_cancel`，不自动终止任务。

- 超时也发送 `ask_user_response`（`status=timeout`）以清理 UI
- 以 MCP tool result 的 `isError=true` 返回超时异常，避免伪装成正常答复
- `content.text` 只给模型可读信息，不透出外部协议字段：

```
{
  content: [
    {
      type: "text",
      text: "ask_user timeout: no response. Please decide whether to retry when the user sends a new message."
    }
  ],
  isError: true
}
```

- 正常回答时 `isError=false`，文本中返回用户选择结果
- 模型可据此决定：中止任务、使用默认值、或等待新消息再重试提问

可选增强：

- 在 MCP `ask_user` tool 参数中新增 `timeoutMs` / `timeoutPolicy`
- CLI 支持全局配置 `ASK_USER_TIMEOUT_POLICY`（默认 `return_cancel`）

## App 侧展示建议

- `ask_user_response.status=timeout/cancelled` 时显示“已取消/已超时”标签
- 未提供 answers 时，`ToolCallItem` 也可渲染 status 文案
- 保持 `ask_user` 卡片在收到 response 后转为 “answered” 状态

## 兼容性与迁移

- 新字段为 optional，旧客户端忽略不影响
- Worker 必须带 `opCode` 发送 response，否则无法合并
- 允许 answers 为空，避免强制拼造不存在的选项

## 实施步骤（建议）

1. shared：扩展 `AskUserResponseMessage` schema 与类型
2. cli：
   - `sendAskUserResponse`（worker 侧）支持 `opCode`
   - `askUser` 统一超时处理与策略分发
   - 固定流程调用 `onTimeout=abort_task`
3. app：
   - 渲染 `status` 文案
   - 使用 `opCode` 合并 response

## 风险与待确认点

- `ask_user_response` 由 worker 发出是否需要安全校验（来源标记）
- 模型侧是否需要更结构化的超时语义（例如 JSON 结果）
- 多问题场景下超时是否显示“全部问题超时”或逐题标记
