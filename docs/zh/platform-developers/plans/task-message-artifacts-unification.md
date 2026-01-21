# task-artifacts-updated 统一进 task-message 方案（设计草案）

## 背景

目前 `task-artifacts-updated` 作为独立事件类型存在：

- 与 `task-message` 的传输/加解密链路分离
- 事件持久化独立入库（`task_event.eventType` = `task-artifacts-updated`）
- App 侧需要单独订阅与渲染

在端到端隐私优先模式下，`stats.files[].path` 可能包含敏感信息，
希望沿用 `task-message` 的加密与离线队列机制，同时让任务事件语义与时序渲染更统一。

## 目标

- 统一加解密与离线队列能力（沿用 `task-message` 机制）
- 统一任务事件的传输语义（消息与产出物走同一事件通道）
- App 侧按时序渲染消息 + 产出物无需多通道合并
- 产出物事件继续持久化到 `task_event`，可查询与回放

## 非目标

- 不改变 Git diff、项目树刷新等 UI 行为
- 不在本阶段强制改变产出物展示样式
- 不移除历史 `task-artifacts-updated` 数据（保持兼容）
- 不新增 `messageType` 过滤字段或索引
- 不额外做文件路径脱敏

## 现状问题

- `task-artifacts-updated` 不走消息加密通道，文件路径可能泄露
- WebSocket 事件类型分散，App 需要合并多个事件源
- 数据存储与过滤以事件类型区分，缺少统一的 payload 语义

## 总体方案

### 协议扩展（shared）

- 新增 `TaskArtifactsMessage` 作为 `TaskMessagePayload` 的一种：

```
type TaskArtifactsMessage = {
  type: 'task_artifacts_updated';
  commitHash: string;
  timestamp: string;
  stats: {
    totalInsertions: number;
    totalDeletions: number;
    files: Array<{ path: string; insertions: number; deletions: number }>;
  };
};
```

- 新增 `isTaskArtifactsMessage` 类型守卫
- 更新 `isSDKMessage` 逻辑，排除 `task_artifacts_updated`

### Worker/CLI

- `sendTaskArtifactsUpdated` 改为发送 `task-message`，payload 为 `task_artifacts_updated`
- 继续支持旧的 `task-artifacts-updated`（兼容期内）
- 若启用本地模式加密，直接复用 `task-message` 的 sealed-box 流程

### API/WebSocket

- `task-message` 处理器识别 `task_artifacts_updated`：
  - 写入 `task_event`（`eventType = task-message`，`eventData.message.type` 标识）
  - 更新 `task.gitStats`
  - 广播给 task participants（chat humans + share + task agent，与 `task-message` 默认一致）
- 兼容期内，`task-artifacts-updated` 事件也统一广播到 task participants

### App 侧

- `task-message` handler 解析 `task_artifacts_updated` 并映射为现有 `artifacts` 事件
- 保留 `task-artifacts-updated` 旧事件处理（兼容历史与混合客户端）
- 时间序列渲染沿用现有 `TaskEventStorage` 逻辑

## 兼容性与迁移

- 兼容期内：
  - Server 同时接受 `task-message`(artifacts) 与 `task-artifacts-updated`
  - App 同时解析两种事件
- 新事件写入 `task_event.eventType = task-message`，旧数据保持原值

## 实施步骤（建议）

1. shared：新增 `TaskArtifactsMessage` 类型与守卫
2. cli：`sendTaskArtifactsUpdated` 改走 `task-message`
3. api：`task-message` handler 增加 artifacts 分支，更新 gitStats 并持久化
4. app：在 `task-message` 渲染链路支持 `task_artifacts_updated`
5. 兼容期后评估是否移除 `task-artifacts-updated` 发送端

## 风险与待确认点

- 前提：同一任务仅一个 worker，worker 收到 artifacts 可忽略
