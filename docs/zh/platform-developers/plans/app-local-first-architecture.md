# App Local First 架构方案（设计草案）

## 背景

当前 App 的任务列表、任务详情与事件信息主要依赖实时 API 拉取，导致：

- 首屏与详情页加载慢，刷新/切换时重复请求
- 断网或弱网下可用性差，用户体验不稳定
- WebSocket 断线后缺少一致的补偿与恢复策略

参考 `task-event-sync.md` 的“本地历史 + 增量同步”机制，希望将 App 改造为 **Local First** 架构：
本地数据优先，网络作为增量同步与校验来源，从而最大化响应速度与离线体验。

## 目标

- App 首屏与任务详情秒开（优先本地）
- 最小化 API 调用频率与数据量（增量同步、差量拉取）
- 完整支持断网浏览与弱网容错（读写可退化）
- 数据一致性可解释：本地乐观更新 + 服务端权威修正
- 与现有 WebSocket 实时推送机制协同工作

## 非目标

- 不实现跨设备离线合并（服务端仍为最终一致源）
- 不引入复杂 CRDT 或多主冲突解决
- 不在本阶段支持任意历史编辑/撤回
- 不处理全量全文搜索（仅本地过滤/简单索引）

## 现状问题

- 任务列表与详情加载高度依赖 API
- 刷新或切换页面导致重复请求
- 缓存粒度粗，重启即丢失
- WebSocket 断线后补偿策略不统一

## Chats 列表现状（代码）

- 接口：`GET /v1/chats` 无查询参数，返回全量 `ChatWithMembers`
- 排序：展示顺序由 App 侧决定（本地排序），服务端返回顺序不作为依据
- 成员：通过 `ChatMember` 关联，逐 chat 拉 members（N+1）
- 缓存：仅 `getUserChatIds` 走缓存用于 WS 加入房间，`GET /v1/chats` 本身不缓存
- 客户端：`ChatStorage.syncChats` 全量拉取并覆盖内存；无本地持久化；过滤 `members` 为空的 chat
- WS 增量：`system-message` 推送 `chat-added/removed`、`chat-member-added/removed`，不含排序刷新或 lastMessage 信息

## 总体方案

### 核心思路

- App 引入 **Local First 数据层**（Dexie + IndexedDB）
- 本地作为读优先来源，网络作为增量同步来源
- 任务事件采用 **sequence 增量同步**（参考 `task-event-sync.md`）
- 引入 Sync Engine（同步引擎）

### 架构概览

- **Local DB**：任务、任务事件、附件元数据、用户与设置等本地持久化
- **Repositories**：UI 只读本地；网络同步写入本地
- **Unified Data Layer**：UI 只从本地数据层读取，API/WS 仅驱动同步引擎写入本地
- **Sync Engine**：维护增量游标、同步状态、重试策略
- **WebSocket**：实时事件到达后直接落库 + 更新 UI

## 本地存储设计（Web）

使用 `Dexie`（IndexedDB）存储，**按账号分库**（dbName = `agentrix_local_${accountId}`），示例结构：

```
agentrix_local
  chats                // Chat schema (API)
    - id
    - owner
    - type
    - createdAt
    - updatedAt
    - ... (省略)

  chat_members         // ChatMember schema (API)
    - id
    - chatId
    - memberCode
    - type
    - role
    - createdAt
    - updatedAt
    - ... (省略)

  chat_list_state
    - chatId
    - lastEventAt        // task-event.createdAt
    - lastSequence       // task-event.sequence
    - pinnedAt           // UI field
    - unreadCount        // UI field

  tasks                // TaskItem schema (API)
    - id
    - chatId
    - title
    - state
    - createdAt
    - updatedAt
    - ... (省略)

  task_state
    - taskId
    - lastOpenedAt       // UI field

  task_events
    - id                 // API TaskEvent.id
    - eventId
    - taskId
    - chatId             // 冗余字段，便于更新 chat_list_state
    - sequence          // 从 0 开始
    - eventType         // task-message / show-modal（task-artifacts 通过 task-message payload）
    - eventData
    - createdAt
    - source

  task_event_state
    - taskId
    - latestSequence
    - earliestSequence
    - hasMoreHistory
    - lastSyncAt

  task_artifacts
    - taskId
    - artifactId
    - version
    - updatedAt

  user_profile
    - userId
    - data
    - updatedAt

  sync_state
    - scope (chats/tasks/events/user)
    - latestCursor
    - lastSyncAt

```

> 说明：`chats` / `chat_members` / `tasks` / `task_events` 与 API schema 对齐；`chat_list_state` / `task_state` / `task_event_state` / `task_artifacts` / `sync_state` 为本地衍生状态。
> 本阶段只实现 Web 端；预留 Storage Adapter（Web=IndexedDB，Native=SQLite/MMKV）。

## 数据来源优先级

- **UI 读取顺序**：Local DB → 内存 → 网络补偿
- **写入顺序**：UI 先写 Local DB（乐观），再调用 API
- **网络同步**：增量为主，必要时回源补齐
- **统一数据层**：UI 不直接消费 API/WS 响应，所有数据先落本地再渲染

## 同步流程设计

### 1. App 启动 / 进入首页（Chats 列表）

1. 从 Local DB 渲染首页 chats 列表（秒开）。
2. 后台触发 chats 列表增量同步：`GET /v1/chats?after=lastCreatedAt&limit=100`。
3. 若本地缺失或首次载入，可用 `before=earliestCreatedAt` 反向补齐。
4. 同步结果写入 Local DB，并更新 UI。
5. 列表排序按每个 chat 最新 `task-event.createdAt`（lastEventAt）倒序。

### 2. 进入任务详情（事件流）

- 直接读取本地事件并渲染。
- 若本地为空或过旧，触发增量/历史同步（参考 `task-event-sync.md`）。
- WebSocket 新事件落库并更新 UI。
- 事件入库/ACK 后更新 `chat_list_state.lastSequence/lastEventAt`（按 `chatId` 归并）。

### 2.1 Chats 成员同步（独立补充）

- 成员变更依赖 `system-message`：`chat-added/removed`、`chat-member-added/removed`
- 收到变更事件后更新 `chats` / `chat_members`
- 若离线错过，进入 chat 时调用 `GET /v1/chats/:chatId/members` 修复成员数据

### 3. 断线补偿

- WebSocket 断线后重连触发一次增量同步：
  - `GET /v1/tasks/:taskId/events?after=latestSequence`
  - 去重写入 Local DB

## 事件类型约定

- 事件流仅包含 `task-message` / `show-modal`
- `task-artifacts-updated` 仅作为 `task-message` payload，不作为独立 eventType
- `task_events` 冗余 `chatId`，用于更新 `chat_list_state` 的 `lastSequence/lastEventAt`

## 冲突与一致性策略

- 服务端为最终权威；客户端保持乐观 UI
- 元数据字段（如 title/status）采用 **服务端优先 + LWW**
- 事件去重按 `eventId/sequence`，本地覆盖写
- 若服务端拒绝写入（权限/校验失败），回滚本地状态并提示

## 账号隔离

- 按账号分库（dbName = `agentrix_local_${accountId}`）
- 账号切换时切换数据库，不做清理或回收
- `schemaVersion` 变更时按账号分别迁移

## 本地容量策略

- 暂不做清理或 LRU
- 仅依赖浏览器配额，超限时按失败处理（后续再补充策略）

## API/协议扩展（建议）

写入路径沿用现有 `task-message` WebSocket，不新增消息写入 API。
事件历史接口不提供 eventType 过滤，返回完整事件流。

### 首页 chats 列表增量同步（非 seq）

**现状**

```
GET /v1/chats
```

- 全量返回 `ChatWithMembers`
- 无 `before/after`
- 排序由 App 侧决定（本地排序）

**增量扩展（待补）**

```
GET /v1/chats?after=createdAt&limit=100
GET /v1/chats?before=createdAt&limit=100

Response:
{
  "chats": [ ... ],
  "hasMore": true
}
```

> 注：使用 `chat.createdAt` 作为游标；服务端按 `createdAt` 增量返回，客户端去重。
> 游标由本页最末 `chat.createdAt` 推导；服务端使用 `>=`/`<=` 区间取数，客户端按 `chat.id` 去重。
> 该接口仅用于补齐缺失数据，UI 排序按本地 `lastEventAt`（task-event.createdAt）倒序。

### 任务事件增量同步

沿用 `task-event-sync.md` 的 `before/after/sequence` 机制。
sequence 从 0 开始，缺口检测与 `/events/fill` 支持 0。

## 模块设计（建议）

### App

- `local-db/`：Dexie 实现 + Storage Adapter
- `repositories/`：chat 列表、任务、事件、附件等本地读取与写入封装
- `sync/`：同步引擎（chat 列表、事件增量、重试）
- `task-event` 处理：事件落库/ACK 后更新 `chat_list_state.lastSequence/lastEventAt`
- `connectivity/`：网络状态监测与重连触发

### Shared

- `TaskEvent` 增加 `sequence` / `chatId`
- `Chat` / `ChatMember` / `TaskItem` 沿用现有 schema
- `SyncCursor` 数据结构

## 里程碑（建议）

1. 任务事件的 sequence 同步能力已完成
2. 引入 Local DB 与 Repository 层
3. 首页 chats 列表增量同步 + 本地缓存
4. 完善写入失败的 UI 提示与回滚策略

## 风险与限制

- IndexedDB 配额不足的风险（暂不处理，后续补）
