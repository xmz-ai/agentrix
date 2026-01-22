# App Local First 架构优化方案（独立计划）

## 背景

现有 Local First 改造已基本可用，但仍存在架构层面的耦合与体验不一致问题：

- UI 仍直接触发同步/网络，边界不清
- online 状态下部分页面仍等待同步完成后才渲染
- 不同实体的加载策略不一致，难以维护
- Local DB 索引配置偏重，存在冗余与维护成本

本计划以“架构优化”为目标，不改变现有功能结果，主要提升边界清晰度、可维护性与统一体验。

## 目标

- 明确组件边界：UI(React View+State) / DataLayer / Local DB / Sync Engine / Remote API
- 统一“先渲染本地，必要时阻塞同步”的加载策略
- 降低 UI 与同步的耦合
- 为每个实体定义一致的 local-first 行为
- 清理 Local DB 冗余索引，降低维护成本

## 非目标

- 不引入兼容性策略
- 不新增跨端冲突解决机制
- 不引入 CRDT 或多主合并
- 不做清理/LRU

## 全局模型与边界

本方案统一以下概念与边界，避免 React state 与架构状态混淆：

1) UI（React View + State）：View 由 UI state 驱动渲染
2) DataLayer：对 Local DB 与 Sync Engine 的抽象，提供语义化读写
3) Local DB：基于 Dexie 的本地存储，变更驱动 UI state 更新
4) Sync Engine：对 Remote API 的封装，负责一致性与同步策略
5) Remote API：服务端接口的 SDK 封装，仅供 Sync Engine 使用

### 文件结构

```
app/sources/
├── dataLayer/
│   ├── index.ts              # DataLayer 单例导出
│   ├── DataLayer.ts          # DataLayer 类实现
│   ├── types.ts              # 内部类型定义
│   └── entities/
│       ├── chats.ts          # getChats, getChatMembers
│       ├── tasks.ts          # getTasks
│       ├── taskEvents.ts     # getTaskEvents, sendTaskEvent
│       ├── agents.ts         # getUserAgents
│       ├── machines.ts       # getMachines
│       ├── repositories.ts   # getRepositories
│       └── userProfile.ts    # getUserProfile
│
├── syncEngine/
│   ├── index.ts              # SyncEngine 单例导出
│   ├── SyncEngine.ts         # 核心调度器
│   ├── types.ts              # SyncPullTask 等类型
│   ├── taskQueue.ts          # 任务队列实现（优先级队列）
│   ├── retryPolicy.ts        # 重试策略（指数退避）
│   ├── syncHandlers/
│   │   ├── chatSync.ts       # Chats 同步处理
│   │   ├── taskSync.ts       # Tasks 同步处理
│   │   ├── taskEventSync.ts  # Task Events 同步处理
│   │   └── ...
│   └── wsHandler.ts          # WS 入站事件统一处理
│
└── storages/                 # 现有 Zustand stores（保留，逐步迁移）
```

### DataLayer 对 UI 的契约
- `getXxx(...)` 总是先读本地并返回可用数据
- 若本地无数据：`getXxx` 内部 `await SyncEngine.getXxx(...)`，同步完成后返回
- 若本地有数据：`getXxx` 立即返回，并 `SyncEngine.enqueueSyncTask(...)` 触发后台同步
- `sendXxx(...)` 先写本地（如 `pending=true`），再调用 `SyncEngine.sendXxx(...)` 异步上行
- DataLayer 不直接调用 Remote API/WS，所有网络交互集中在 Sync Engine

### 1) UI（React View + State）
- View 由 UI state 驱动渲染
- 只触发 DataLayer 的加载/操作（例如 `getTaskEvents(taskId)`）
- UI 自行管理 loading（基于调用生命周期）
- UI 不关心数据来源（local db / api / ws），只消费 DataLayer 返回的数据

**UI 与 DataLayer 绑定方式**：保留 Zustand 作为 UI state 中间层

```typescript
// Zustand store 订阅 Local DB 变更
const useTaskEventStore = create((set) => ({
  taskEvents: {},
  // DataLayer 写入 Local DB 后，store 通过 liveQuery 或手动刷新获取更新
  subscribeToTask: (taskId: string) => {
    const unsubscribe = liveQuery(
      () => localDb.task_events.where('taskId').equals(taskId).toArray()
    ).subscribe(events => set(state => ({
      taskEvents: { ...state.taskEvents, [taskId]: events }
    })));
    return unsubscribe;
  }
}));
```

**迁移策略**：
1. **Phase 1**：创建 DataLayer 和 SyncEngine，现有 Storage 保持不变
2. **Phase 2**：逐步将 Storage 内的 API 调用迁移到 DataLayer
3. **Phase 3**：Storage 仅保留 UI state（如 selectedChatId），数据获取全部委托给 DataLayer
4. **Phase 4**：评估是否可以直接用 liveQuery 替代部分 Zustand store

### 2) DataLayer
- 抽象 Local DB 与 Sync Engine
- 示例接口：
  - `getTaskEvents(taskId, before=maxSeq, limit=100)`：先读本地；有数据直接返回，并 `after=maxSeq` 触发异步同步；无数据则 `await SyncEngine.getTaskEvents(...)` 后返回
  - `sendTaskEvent(taskId, payload)`：先写本地 `pending=true`，再交给 Sync Engine 加密并通过 WS 发送

### 3) Local DB
- Dexie 作为唯一持久化入口
- 所有网络结果由 Sync Engine 写入本地
- Local DB 变更驱动 UI state 更新（订阅/监听）
- 允许少量派生表（如 `chat_list_state`）支撑排序与 UI

### 4) Sync Engine
- 独立模块，集中处理同步任务与 WS 入站事件
- 统一重试/退避/优先级
- 只写 Local DB，不直接驱动 UI
- 对外提供语义化 `get/send` 与异步 `enqueueSyncTask`（仅 pull）

### 5) Remote API
- 服务端接口 SDK 封装
- 仅由 Sync Engine 调用

## 各层接口（建议）

### UI 层接口
- UI 只调用 DataLayer 的语义化接口
- UI state 通过订阅 Local DB 的查询结果更新（例如 hooks + liveQuery）
- 示例调用：

```ts
await dataLayer.getTaskEvents({ taskId, before: maxSeq, limit: 100 });
await dataLayer.sendTaskEvent({ taskId, payload });
```

### DataLayer 接口
DataLayer 聚合 Local DB 与 Sync Engine：

```ts
interface DataLayer {
  getChats(params?: { before?: string; limit?: number }): Promise<Chat[]>;
  getChatMembers(chatId: string): Promise<ChatMember[]>;
  getTasks(params: { chatId: string; archived?: boolean; before?: string; limit?: number }): Promise<Task[]>;
  getTaskEvents(params: { taskId: string; before?: number; limit?: number }): Promise<TaskEvent[]>;
  sendTaskEvent(params: { taskId: string; payload: TaskEventPayload }): Promise<void>;
  getUserAgents(): Promise<{ agents: Agent[]; draftAgents: DraftAgent[] }>;
  getRepositories(params?: { gitServerId?: string }): Promise<Repository[]>;
  getGitServers(): Promise<GitServer[]>;
  getOAuthServers(): Promise<OAuthServer[]>;
  getUserProfile(): Promise<UserProfile | null>;
  getMachines(): Promise<{ localMachines: Machine[]; clouds: Cloud[] }>;
}
```

### Local DB 接口
Local DB 提供最小读写与索引能力：

```ts
interface LocalDb {
  chats: Table<Chat>;
  chatMembers: Table<ChatMember>;
  chatListState: Table<ChatListState>;
  agents: Table<Agent>;
  draftAgents: Table<DraftAgent>;
  tasks: Table<Task>;
  taskEvents: Table<TaskEvent>;
  taskEventState: Table<TaskEventState>;
  repositories?: Table<Repository>; // optional cache
  gitServers?: Table<GitServer>; // optional cache
  oauthServers?: Table<OAuthServer>; // optional cache
  userProfile: Table<UserProfile>;
  machines: Table<Machine>;
}

async function getTaskEvents(params: {
  taskId: string;
  before?: number;
  limit?: number;
}): Promise<TaskEvent[]>;

async function upsertTaskEvents(events: TaskEvent[]): Promise<void>;
async function setTaskEventState(taskId: string, state: TaskEventState): Promise<void>;
```

### Sync Engine 接口
Sync Engine 负责与 Remote API/WS 交互并写 Local DB：

```ts
type SyncPullTask =
  | { type: "chats"; before?: string; limit?: number }
  | { type: "tasks"; chatId: string; archived?: boolean; before?: string; limit?: number }
  | { type: "taskEvents"; taskId: string; after?: number; limit?: number }
  | { type: "userAgents" }
  | { type: "repositories"; gitServerId?: string }
  | { type: "gitServers" }
  | { type: "oauthServers" }
  | { type: "userProfile" }
  | { type: "machines" };

interface SyncEngine {
  getChats(params?: { before?: string; limit?: number }): Promise<void>;
  getTasks(params: { chatId: string; archived?: boolean; before?: string; limit?: number }): Promise<void>;
  getTaskEvents(params: { taskId: string; after?: number; limit?: number }): Promise<void>;
  sendTaskEvent(params: { taskId: string; payload: TaskEventPayload }): Promise<void>;
  getUserAgents(): Promise<void>;
  getRepositories(params?: { gitServerId?: string }): Promise<void>;
  getGitServers(): Promise<void>;
  getOAuthServers(): Promise<void>;
  getUserProfile(): Promise<void>;
  getMachines(): Promise<void>;
  enqueueSyncTask(task: SyncPullTask): void;
  handleWsEvent(event: WsEvent): void;
}
```

### Remote API（现状）
- 沿用现有 SDK 实现，不新增接口定义
- Sync Engine 仅调用已存在的 API 方法

## 实体对照表（DataLayer → Sync Engine → Remote API）

| 实体 | DataLayer 方法 | Sync Engine 调用 | Remote API 方法（现有） |
| --- | --- | --- | --- |
| Chats | `getChats` | `getChats` / `enqueueSyncTask({ type: "chats" })` | `ChatApi.listChats` |
| Chat Members | `getChatMembers` | `getChats`（members 内嵌） | `ChatApi.listChats` |
| Tasks | `getTasks` | `getTasks` / `enqueueSyncTask({ type: "tasks" })` | `TaskApi.listTasks` |
| Task Events (pull) | `getTaskEvents` | `getTaskEvents` / `enqueueSyncTask({ type: "taskEvents" })` | `TaskApi.getTaskEvents` |
| Task Events (send) | `sendTaskEvent` | `sendTaskEvent`（WS） | WS: `sendTaskEvent` |
| User Profile | `getUserProfile` | `getUserProfile` / `enqueueSyncTask({ type: "userProfile" })` | `AuthApi.getProfile` |
| Machines | `getMachines` | `getMachines` / `enqueueSyncTask({ type: "machines" })` | `MachineApi.listMachines` |
| Agents + Draft Agents | `getUserAgents` | `getUserAgents` / `enqueueSyncTask({ type: "userAgents" })` | `AgentApi.getUserAgents` |
| Repositories | `getRepositories` | `getRepositories` / `enqueueSyncTask({ type: "repositories" })` | `RepositoryApi.listRepositories` |
| Git Servers | `getGitServers` | `getGitServers` / `enqueueSyncTask({ type: "gitServers" })` | `GitServerApi.listGitServers` |
| OAuth Servers | `getOAuthServers` | `getOAuthServers` / `enqueueSyncTask({ type: "oauthServers" })` | `OAuthServerApi.listOAuthServers` |

## 交互与时序模型

### 读取路径
1. UI 调用 `getXxx()`
2. DataLayer 先读本地（有数据则立即返回）
3. 若本地为空：`await SyncEngine.getXxx(...)` → 写本地 → 再读本地返回
4. 若本地非空：`SyncEngine.enqueueSyncTask(...)` → 写本地 → UI state 更新

### 写入路径
1. UI 调用 `sendXxx()`
2. DataLayer 先写本地（如 `pending=true`）并触发 UI state 更新
3. Sync Engine 异步上行同步（API/WS）
4. Sync Engine 收到 ACK/WS 后写本地修正

### WS 路径
1. Sync Engine 接收 WS 事件
2. 解密/转换后写本地
3. UI state 更新 → View 渲染

## 统一加载策略（核心）

### Render-First（默认）
- DataLayer 先读取本地并返回结果
- 同时通过 Sync Engine 异步接口触发同步任务（不阻塞 UI）
- UI 仅表现 loading 与数据更新

### Blocking Sync（本地无数据时）
- 本地无任何数据时，DataLayer 直接 `await` Sync Engine 同步并返回结果
- UI 自行显示 loading（基于加载 Promise 生命周期）
- 同步完成后渲染

> 重点：UI 只调用 DataLayer 的加载函数并自行处理 loading；是否需要阻塞同步由 DataLayer 内部决定。

### 本地数据缺失判定标准

```typescript
// DataLayer 内部判定逻辑

// Chats: 本地 chats 表为空
async getChats(params) {
  const localCount = await localDb.chats.count();
  if (localCount === 0) {
    // blocking sync
    await syncEngine.getChats(params);
  } else {
    // render-first: 返回本地 + 后台同步
    syncEngine.enqueueSyncTask({ type: 'chats', ...params });
  }
  return localDb.chats.toArray();
}

// Tasks: 指定 chatId 的 tasks 为空
async getTasks({ chatId, ...params }) {
  const localCount = await localDb.tasks.where('chatId').equals(chatId).count();
  if (localCount === 0) {
    await syncEngine.getTasks({ chatId, ...params });
  } else {
    syncEngine.enqueueSyncTask({ type: 'tasks', chatId, ...params });
  }
  return localDb.tasks.where('chatId').equals(chatId).toArray();
}

// TaskEvents: 指定 taskId 的 task_events 为空
async getTaskEvents({ taskId, ...params }) {
  const localCount = await localDb.task_events.where('taskId').equals(taskId).count();
  if (localCount === 0) {
    await syncEngine.getTaskEvents({ taskId, ...params });
  } else {
    const state = await localDb.task_event_state.get(taskId);
    syncEngine.enqueueSyncTask({
      type: 'taskEvents',
      taskId,
      after: state?.latestSequence,
      ...params,
    });
  }
  return localDb.task_events.where('[taskId+sequence]').between([taskId, 0], [taskId, Infinity]).toArray();
}
```

## 实体级优化策略

### Chats
- 本地表：`chats`, `chat_members`, `chat_list_state`
- UI state：由 Local DB 订阅驱动（`chats[]`, `selectedChatId`）
- 加载：
  - hydrate 本地并立刻渲染
  - 本地为空时 blocking sync
  - 否则后台增量同步（before/after + hasMore）
- 排序：基于 `chat_list_state.lastEventAt`，fallback `updatedAt/createdAt`

### Chat Members
- 本地表：`chat_members`
- 加载：
  - 本地优先
  - WS 变更落库
  - 本地为空或缺失时后台补齐
- **同步时机**：
  - Chat Members 内嵌在 Chat 对象中返回（`ChatApi.listChats` 返回 `members[]`）
  - 与 Chats 同步合并，不单独请求
  - WS 事件 `chat:memberJoined`, `chat:memberLeft` 触发单条更新

### Tasks
- 本地表：`tasks`
- 加载：
  - 选 chat 时先渲染本地
  - 本地为空则 blocking sync
  - 否则后台增量同步
- 归档切换：DataLayer 写本地并 enqueue 同步

### Task Events
- 本地表：`task_events`, `task_event_state`
- 规则：
  - 选 task → 先返回本地数据
  - 本地无数据 → blocking sync
  - online 状态始终先渲染本地，再增量同步
- 同步：
  - 若本地存在 `maxSeq`，发送后台 sync 任务（`after=maxSeq`）
  - gap fill 仅后台补齐，不阻塞 UI
- WS：收到即解密入库（明文）

**Pending 状态完整生命周期**：

```typescript
// 1. UI 调用 sendTaskEvent
await dataLayer.sendTaskEvent({ taskId, payload });

// 2. DataLayer 写入 Local DB (pending=true, sequence=-1)
const tempId = generateTempId();  // 临时 ID，格式 `temp_${uuid}`
await localDb.task_events.add({
  eventId: tempId,
  taskId,
  sequence: -1,              // 临时 sequence，排序时置于末尾
  pending: true,
  payload,
  createdAt: new Date().toISOString(),
});

// 3. SyncEngine 通过 WS 发送
try {
  const { eventId, sequence } = await syncEngine.sendTaskEvent({
    taskId,
    payload,
    tempId,  // 传递临时 ID 用于关联
  });

  // 4. 收到 ACK 后更新 Local DB
  await localDb.task_events
    .where('eventId').equals(tempId)
    .modify({ eventId, sequence, pending: false });
} catch (error) {
  // 5. 失败处理：保留 pending=true，记录错误原因
  await localDb.task_events
    .where('eventId').equals(tempId)
    .modify({ error: error.message, retryCount: (retryCount || 0) + 1 });
  // UI 可根据 pending + error 字段显示重试按钮
}
```

### Machines
- 本地表：`local_machines`
- 规则：
  - 平时 render-first
  - 解密依赖缺失时允许 blocking sync

### Agents / Draft Agents
- 本地表：`agents`, `draft_agents`
- 规则：render-first + 后台同步

### Repositories
- 本地表：可选（当前以缓存/内存为主）
- 规则：render-first + 后台同步

### User Profile
- 本地表：`user_profile`
- 规则：本地优先；无本地时 blocking sync

### OAuth / Git Servers
- 本地表：可选
- 规则：本地优先；无本地时 blocking sync

## Local DB 索引 Review

### 当前索引（现状）
- `chats`: `&id, createdAt, updatedAt`
- `chat_members`: `&id, chatId, memberCode, type`
- `chat_list_state`: `&chatId, lastEventAt, lastSequence, pinnedAt`
- `agents/draft_agents`: `&id, name`
- `local_machines`: `&id, updatedAt`
- `tasks`: `&id, chatId, createdAt, updatedAt`
- `task_events`: `&eventId, taskId, sequence, [taskId+sequence], chatId`
- `task_event_state`: `&taskId`
- `user_profile`: `&userId, updatedAt`

### 建议保留（按实际查询）
- `chats`: `&id`
- `chat_members`: `&id, chatId`
- `chat_list_state`: `&chatId`
- `agents/draft_agents`: `&id`
- `local_machines`: `&id`
- `tasks`: `&id, chatId`
- `task_events`: `&eventId, [taskId+sequence]`
- `task_event_state`: `&taskId`
- `user_profile`: `&userId`

### 可移除索引（当前未使用）
- `createdAt/updatedAt` 类索引
- `chat_members.memberCode/type`
- `chat_list_state.lastEventAt/lastSequence/pinnedAt`
- `agents/draft_agents.name`
- `local_machines.updatedAt`
- `task_events.taskId/sequence/chatId` 单列索引
- `user_profile.updatedAt`

> 若未来出现"按时间分页/排序"的 Dexie 查询需求，再单独引入索引。

### 索引清理迁移方案

```typescript
// 在 localDb.ts 中使用 Dexie 版本升级
// 注意：Dexie 不支持直接删除索引，需要重新定义 stores

// 当前版本（假设 v1）
this.version(1).stores({
  chats: '&id, createdAt, updatedAt',
  tasks: '&id, chatId, createdAt, updatedAt',
  task_events: '&eventId, taskId, sequence, [taskId+sequence], chatId',
  // ...
});

// 升级版本（v2）- 移除冗余索引
this.version(2).stores({
  chats: '&id',                              // 移除 createdAt, updatedAt
  chat_members: '&id, chatId',               // 移除 memberCode, type
  chat_list_state: '&chatId',                // 移除 lastEventAt, lastSequence, pinnedAt
  agents: '&id',                             // 移除 name
  draft_agents: '&id',                       // 移除 name
  local_machines: '&id',                     // 移除 updatedAt
  tasks: '&id, chatId',                      // 移除 createdAt, updatedAt
  task_events: '&eventId, [taskId+sequence]', // 移除 taskId, sequence, chatId 单列索引
  task_event_state: '&taskId',
  user_profile: '&userId',                   // 移除 updatedAt
}).upgrade(async tx => {
  // Dexie 会自动处理索引变更，无需手动迁移数据
  console.log('DB schema upgraded to v2: removed redundant indexes');
});
```

**注意事项**：
- 索引删除是破坏性变更，需要充分测试
- 建议在 staging 环境验证后再发布
- 用户首次打开升级版本时会触发 schema 升级

## Sync Engine 设计要点

- 接收 DataLayer 的 `get/send` 请求与 `enqueueSyncTask`
- 监听 WS 入站事件，内部维护 online/offline
- 基于本地 cursor/maxSeq 决定拉取范围
- 接口语义：
  - `getXxx/sendXxx`：语义化同步接口（`await` 型）
  - `enqueueSyncTask`：异步提交同步任务（仅 pull）
- 统一调度策略：
  - 首次加载：blocking sync
  - 后台增量：after/maxSeq
  - gap fill：低优先级
- 重试策略：指数退避 + offline 冻结

### 任务队列优先级

```typescript
enum SyncPriority {
  CRITICAL = 0,   // 用户主动触发的 blocking sync（本地无数据）
  HIGH = 1,       // 当前可见页面的增量同步
  NORMAL = 2,     // 后台预加载（相邻 chat/task）
  LOW = 3,        // Gap fill, 历史数据补齐
}
```

### 重试策略参数

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,              // 最大重试次数
  baseDelayMs: 1000,          // 基础延迟 1s
  maxDelayMs: 30000,          // 最大延迟 30s
  backoffMultiplier: 2,       // 退避倍数
  // offline 时冻结队列，监听 NetworkStorage.offline 变化恢复
};

// 延迟计算：min(baseDelayMs * (backoffMultiplier ^ retryCount), maxDelayMs)
// 第1次重试：1s，第2次：2s，第3次：4s
```

### WS 事件与 Sync Engine 协作

```typescript
// WS 事件处理流程
syncEngine.handleWsEvent(event) {
  switch (event.type) {
    case 'task:message':
      // 1. 解密消息
      const payload = decrypt(event.encryptedMessage, key);

      // 2. 写入 Local DB（跳过 pending 状态）
      await localDb.task_events.put({ ...payload, pending: false });

      // 3. 更新 task_event_state.latestSequence
      await updateTaskEventState(taskId, payload.sequence);

      // 4. 取消该 task 的 pending sync 任务（避免重复拉取）
      this.cancelPendingSyncTasks({ type: 'taskEvents', taskId });
      break;

    case 'chat:updated':
      // 直接更新 Local DB，不需要重新拉取
      await localDb.chats.update(event.chatId, event.changes);
      break;

    case 'chat:memberJoined':
    case 'chat:memberLeft':
      // 单条更新 chat_members 表
      await localDb.chat_members.put(event.member);
      break;
  }
}
```

## 状态字段建议（内部）

- `maxSeq/hasMoreHistory`: 从 `task_event_state` 读取
- `syncStatus`: 仅供 DataLayer/Sync Engine 使用（UI 不依赖）

## 里程碑

1. 新增 Sync Engine（独立模块）
2. DataLayer 统一 `local-first + blocking sync` 行为
3. Task Events 先本地渲染、无本地才阻塞
4. Chats/Tasks/Agents/Machines/Profile 统一策略
5. 清理索引并升级 Dexie schema

## 错误处理策略

| 错误类型 | 处理策略 |
|---------|---------|
| 网络错误 (offline) | 冻结队列，监听 `NetworkStorage.offline` 变化恢复 |
| 401 Unauthorized | 触发重新登录流程，清空队列 |
| 403 Forbidden | 跳过该任务，记录日志 |
| 429 Rate Limit | 指数退避 + 队列暂停，根据 `Retry-After` header 决定延迟 |
| 500 Server Error | 重试 3 次后放弃，记录错误 |
| IndexedDB 错误 | 降级到 Memory Adapter（参考现有 SafeTaskEventStorageAdapter 实现） |
| 解密失败 | 跳过该事件，记录日志，不阻塞后续事件 |
| 网络超时 | 重试，超时时间建议 30s |

```typescript
// 错误处理示例
class SyncEngine {
  async executeSyncTask(task: SyncPullTask) {
    try {
      await this.handlers[task.type](task);
    } catch (error) {
      if (error.status === 401) {
        this.clearQueue();
        authStorage.logout();
        return;
      }
      if (error.status === 429) {
        const retryAfter = error.headers?.['retry-after'] || 60;
        this.pauseQueue(retryAfter * 1000);
        return;
      }
      if (error.status >= 500 || error.name === 'NetworkError') {
        if (task.retryCount < RETRY_CONFIG.maxRetries) {
          this.requeueWithBackoff(task);
        } else {
          console.error('Sync task failed after max retries:', task, error);
        }
        return;
      }
      // 其他错误：记录并跳过
      console.error('Sync task error:', task, error);
    }
  }
}
```

## 风险与限制

- IndexedDB 配额不足暂不处理
- 同步引擎引入后需谨慎避免重复同步与竞争
- 多标签页同时操作可能导致状态不一致（暂不处理，后续可考虑 BroadcastChannel）
