# Task Event 本地化同步方案（设计草案）

## 背景

当前 App 每次进入任务详情都会通过 `GET /v1/tasks/:taskId/events` 拉取事件列表，
在任务消息较多时加载明显变慢，且刷新/切换任务都会重复拉取历史消息。
期望将 `task-message` 等任务事件尽可能持久化到浏览器本地，参考 IM（微信/Telegram）
的“本地历史 + 增量同步”机制，只在必要时同步新消息。

## 目标

- 任务详情打开时优先从本地读取历史事件，秒开体验
- 仅同步增量事件（新消息/新产出），减少重复拉取
- 支持断网/重连后的补偿同步，避免消息丢失
- 历史消息本地持久化（暂不做清理）
- 与现有 WebSocket 推送机制协同工作

## 非目标

- 不修改 `task-message` 的消息结构或加密流程
- 不做跨设备本地数据同步（服务端仍是最终一致源）
- 不处理历史消息的删除/编辑（如需后续再设计）
- 不在本阶段引入复杂的全文搜索或索引体系

## 现状问题

- 每次进入任务详情都拉取历史事件，重复成本高
- 列表数据仅在内存中，刷新/重启即丢失
- WebSocket 断线后缺少稳定的补偿同步机制
- 当前 `offset/limit` 分页在大历史下容易出现重复与顺序不稳定

## 总体方案

### 核心思路

- 在 App 侧引入 **Task Event 本地日志库**（Dexie + IndexedDB）
- 服务端提供 **基于 sequence 的增量同步接口**
- WebSocket 负责实时推送新消息，本地库负责持久化
- 断线重连后走增量同步补漏，历史翻页走本地 + 回源

### 本地存储设计（Web）

使用 `Dexie`（IndexedDB）存储任务事件，复用 `agentrix_local_${accountId}` 数据库中的 `task_events` 表，结构示例：

```
task_events
  - id                 // API TaskEvent.id
  - eventId
  - taskId
  - chatId             // 冗余字段，便于更新本地 chat 排序
  - sequence          // 服务端生成的顺序标识（从 0 开始）
  - eventType         // task-message / show-modal（task-artifacts 通过 task-message payload）
  - eventData         // 原始数据（含 encryptedMessage）
  - createdAt         // 服务端时间
  - source            // ws/http

task_event_state
  - taskId
  - latestSequence    // 本地已同步最新 sequence
  - earliestSequence  // 本地最早 sequence（用于历史翻页）
  - hasMoreHistory    // 是否还有更早历史可回源
  - lastSyncAt
  - schemaVersion
```

> 说明：需抽象 Storage Adapter（Web = IndexedDB，Native = SQLite/MMKV），本阶段仅实现 Web 端。

### API/协议（已支持）

已支持 sequence 分页参数：

```
GET /v1/tasks/:taskId/events?limit=50&before=xxx
GET /v1/tasks/:taskId/events?limit=50&after=xxx
```

- **before**：拉取 `sequence < before` 的历史事件（翻页）
- **after**：拉取 `sequence > after` 的增量事件（同步）
- 返回 `hasMore` 以驱动历史翻页

#### `GET /v1/tasks/:taskId/events`

**Query 参数**

- `limit`：默认 50，最大 100
- `before`：可选，序号游标（不包含 before 本身）
- `after`：可选，序号游标（不包含 after 本身）
- 不提供 `eventType` 过滤，统一返回完整事件流。

**行为约定**

- `before`：返回 `sequence < before` 的历史事件
- `after`：返回 `sequence > after` 的增量事件
- 未传 `before/after` 时等价于拉取最新一页（按最新序号倒序）
- 返回结果按 `sequence` 倒序排列（与现有 UI 顺序一致）

**Response**

```
{
  "events": [
    {
      "id": "...",
      "taskId": "...",
      "chatId": "...",
      "eventId": "event-...",
      "sequence": 123,
      "eventType": "task-message",
      "eventData": { ... },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "hasMore": true
}
```

#### `GET /v1/tasks/:taskId/events/meta`（可选）

用于快速判断是否需要增量同步：

```
{
  "latestSequence": 200,
  "earliestSequence": 0,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### WebSocket 协同

- WebSocket 广播 `task-message`/`show-modal` 时携带 `sequence` / `createdAt`
- `task-artifacts` 更新通过 `task-message` payload 解析
- App 收到新事件后：
  1) 写入本地库
  2) 更新 `latestSequence`
  3) 更新内存态（UI）
  4) 更新 `chatId` 对应的本地排序字段（`lastEventAt/lastSequence`）

### 同步流程

#### 1. 首次进入任务

1. 从本地库读取事件并渲染
2. 若本地为空：不传 `before/after` 拉取最新一页
3. 更新 `latestSequence`/`earliestSequence`/`hasMoreHistory`

#### 2. 增量同步（必要时）

- App 启动、网络重连、进入任务时触发：
  - `GET /v1/tasks/:taskId/events?after=latestSequence`
  - 若无新增则返回空数组

#### 3. 历史翻页

- UI 上滑加载更多：
  1) 优先从本地库读取更早事件
  2) 本地不足时走 `before=earliestSequence` 回源补齐
  3) 更新 `earliestSequence`/`hasMoreHistory`

#### 4. 断线补偿

- WebSocket 断线后重连，执行一次增量同步补漏
- 同步结果与本地库去重（按 `sequence`）

### 缺口补齐策略（漏消息修复）

#### 缺口检测

- 拉取 events（WebSocket / HTTP）后，按 `sequence` 排序
- 若相邻序号不连续，收集缺失的 `sequence` 列表
- `sequence` 从 0 开始，缺口检测包含 0
- 将缺失序号合并为一次补齐请求（单次批量）

#### 补齐流程（简化）

- 触发时机：
  - 每次 load/sync 完成后检测缺口并触发一次补齐
- 已有接口：

```
POST /v1/tasks/:taskId/events/fill
{
  "sequences": [101, 104, 109]
}
```

> `sequences` 可包含 0。

- 返回补齐事件：

```
{
  "events": [ ... ]
}
```

#### 覆盖写入

- 补齐事件按 `eventId` 直接覆盖写入本地（全局唯一）
- 不需要客户端维护永久缺口状态，由服务端后续兜底处理

### 安全与加密

- 本地存储保留 `encryptedMessage` 原始字段
- 展示时使用现有 `dataEncryptionKey` 解密
- `dataEncryptionKey` 已本地持久化，沿用现有解密逻辑

### 缓存与清理策略

- 默认全量存储已访问任务的历史消息
- 暂不做清理或 LRU
- 按账号分库，账号切换不清理
- `schemaVersion` 变更时按账号分别迁移

## 模块设计（建议）

### App

- `utils/taskEventCache.ts`
  - IndexedDB 读写接口（基于 Dexie，dbName 含 accountId）
  - 提供 `getEventsByCursor` / `saveEvents` / `setSyncState` 等
  - 预留 `StorageAdapter` 接口（Web 实现 / Native 待实现）
- `storages/TaskEventStorage.ts`
  - 进入任务先从本地库 hydrate
  - 新增 `syncNewEvents` / `loadHistory` / `loadFromCache`
  - WebSocket handler 写入本地库 + 更新 sequence
  - 更新事件后同步 `chatId` 对应的本地排序字段（lastEventAt/lastSequence）
- `storages/TaskStorage.ts`
  - 任务删除时清理本地事件

### API

- `GET /v1/tasks/:taskId/events` 仅保留 before/after 语义（不提供 eventType 过滤）
- WebSocket 广播补充 `sequence` / `createdAt`
- 可选：新增 `/events/meta` 返回最新序号（用于快速对比）

### sequence 发号逻辑

- 每个 task 维护独立的 `task_event.sequence` 计数器，任务内单调递增
- 使用 Redis 作为发号器：`INCR task:{taskId}:event-seq`
- 在 API 收到事件时立即发号并回填到 WebSocket/HTTP 响应
- `create-task` 触发的首条 `task-message` 通过 `INCR` 返回 `0`
  - task 创建时 `SETNX task:{taskId}:event-seq -1`
- 事件落库可异步执行，但落库记录需携带已分配的 `sequence`
- 若异步写库失败，现阶段仅记录日志即可
- Redis key 过期策略：
  - active/archived 统一刷新 TTL（如 7 天）
  - TTL 到期后如需继续发号，从数据库恢复最近序号后再继续 `INCR`

### Shared

- `TaskEvent` schema 增加 `sequence` / `chatId`
- `QueryEventsRequest` 仅保留 `before` / `after` / `limit`

## 实施步骤（建议）

1. 已完成：sequence 生成与 API 返回
2. 已完成：WebSocket 广播携带 sequence + createdAt
3. App 侧新增本地缓存模块（IndexedDB）
4. TaskEventStorage 接入本地缓存 + 增量同步
5. 按账号分库 + 序号 0 边界处理

## 风险与限制

- 需要对历史 `task_event` 补齐 `sequence`（一次性迁移）
- `sequence` 与 `createdAt` 顺序不一致时的排序一致性
- 浏览器存储配额不足时的降级策略（暂不处理）
- 异步写库失败导致序号空洞的处理策略（仅记录日志）
