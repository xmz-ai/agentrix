# 本地模式 WebRTC 点对点文件传输方案（设计与规划）

## 背景

本地模式下，App 通过 API 获取任务的 patch 与项目文件。API 会向本地 CLI 发起 `workspace-file-request` 并将文件内容转发给 App，导致：

- 服务器带宽和 CPU 被文件流量占用
- 本地文件访问路径变长，实时性一般
- 本地模式的“端到端”属性被弱化

在 `/Users/alex/git/yanxiyue/rtc-test` 中已验证 WebRTC 数据通道可以在 App 与 CLI 之间稳定传输文件，因此规划将本地模式的文件访问改为 WebRTC 点对点传输。

## 目标

- 本地模式下的 patch、项目文件、目录列表全部走 WebRTC P2P
- 云端模式继续使用现有 API 获取文件
- API 仅做信令转发与鉴权，不再中转本地文件内容
- 保持现有缓存语义（`If-Modified-Since` / `X-File-Modified`）
- 兼容桌面 Web 与移动端 WebRTC 实现

## 非目标

- 不替换现有任务消息通道（`task-message` 仍走 WebSocket）
- 不改变云端模式与分享模式的文件访问路径
- 不在本阶段实现端到端断点续传或多端同步
- 不提供本地模式 API 中继回退

## 现状梳理

- App：`TaskApi.getPatchContent` / `getProjectFile` 通过 `/v1/tasks/:id/patch|project/*` 获取文件
- API：`handleWorkspaceFileAccess` 通过 WebSocket `workspace-file-request` 获取 CLI 文件并返回给 App
- CLI：`workspaceFileRequestHandler` 读取文件、Base64 编码后回传
- 本地模式加密：CLI 通过 `dataEncryptionKey` 加密内容，App 解密

## 总体方案

### 架构概览

- **信令层**：复用 API 的 Socket.IO 连接，新增 WebRTC 信令事件与 ICE 配置拉取
- **数据层**：App 与本地 CLI 通过 WebRTC DataChannel 传输文件
- **连接管理**：RTC 连接按需建立、长期保持，超时后主动断开

### 信令流程（参考 demo）

0. App 与 CLI 在 WebSocket 连接建立后主动请求 `RTC_ICE_SERVERS` 配置（`rtc-ice-servers-request/response`）
1. App 通过 WebSocket 发送 `machine-rtc-request`（包含 machineId / role=app）
2. API 校验权限后转发给机器侧 Socket
3. CLI 回复 `machine-rtc-response`（包含可用 ICE 能力）
4. App 发起 offer，双方交换 `rtc-signal`（SDP + ICE candidate）
5. DataChannel 建立成功后，进入文件懒加载传输

建议在 `shared/src/websocket/events.ts` 增加信令事件 Schema，并在 API 与 CLI 侧注册处理器。

### ICE / TURN 配置

- API 提供 `RTC_ICE_SERVERS` 配置（STUN/TURN）
- 初版直接从环境变量返回，后续按订阅级别下发不同配置
- TURN 可作为默认兜底方案

## 数据通道协议设计

### 协议形态

- **控制消息**使用 JSON（text）帧；**数据内容**使用二进制帧
- DataChannel 是 message-oriented，每次 `send` 即一个 frame
- v1 直接支持并发多流：二进制帧固定携带 `chunkHeader`，用于标识 streamId/序号/长度

### 控制消息 Envelope（JSON）

所有控制消息统一使用以下结构，便于扩展到文件、终端、日志等场景：

```
{
  "v": 1,
  "type": "file.request" | "file.meta" | "file.end" | "shell.open" | "shell.output" | ...,
  "channel": "file" | "shell" | "control",
  "requestId": "req_xxx",
  "streamId": "stream_xxx",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "payload": { ... },
  "error": { "code": "...", "message": "..." }
}
```

### 文件传输消息

- `file.request`：请求文件或目录（payload: relativePath, ifModifiedSince, maxFileSizeMB）
- `file.meta`：文件元信息（payload: size, mime, modifiedAt, accessDenied, dataMode）
- `file.dir`：目录列表（payload: entries, modifiedAt）
- `file.end`：文件传输结束（payload: size, checksum 可选）
- `file.not_modified`：文件未变更
- `file.error`：错误响应（file_not_found / permission_denied / file_too_large）

二进制 chunk 在 `file.meta` 后发送，接收端通过 `chunkHeader.streamId` 关联到同一流。

### 终端（Web Shell）扩展示例

- `shell.open`：打开终端（payload: cols, rows, cwd）
- `shell.input`：输入（payload: data/base64 or utf8）
- `shell.output`：输出（payload: data/base64 or utf8）
- `shell.resize`：调整窗口（payload: cols, rows）
- `shell.close`：关闭终端（payload: reason）

### 关键字段

- `v`：协议版本（便于升级）
- `type`：消息类型（以 `channel.action` 形式扩展）
- `channel`：业务通道（file/shell/control）
- `requestId`：请求唯一 ID
- `streamId`：数据流 ID（文件/终端等复用）
- `payload`：业务数据

### v1 `chunkHeader` 约定

- 每个二进制帧均携带固定头部，便于多流并发与校验
- 推荐 16 字节 header（大端）：
  - `streamId`（uint32）
  - `seq`（uint32）
  - `flags`（uint16）
  - `reserved`（uint16，预留扩展）
  - `payloadLength`（uint32）
- `flags` 建议位：`0x1`=start，`0x2`=end，`0x4`=binary，`0x8`=compressed
- `payloadLength` 可用于快速校验 frame 完整性

### Stream 生命周期

1. `*.request` 创建 streamId
2. `*.meta` 宣告传输信息（文件/终端）
3. 发送二进制 chunk（按 seq 递增）
4. `*.end` 结束流并释放资源
5. 异常时发送 `*.error` 并释放 stream

建议 **max in-flight streams = 4**（可配置），避免占用过多 DataChannel 缓冲区。

### 加密策略

- WebRTC 自带 DTLS 加密
- 本地模式不再使用 `dataEncryptionKey` 做额外 E2E 加密

### 并发与背压

- 文件块分片 16~64KB（与 demo 一致）
- 简化实现可先串行传输
- 需要支持多请求并发时，以 `transferId` 区分并维护每个传输的状态

## 文件访问流程（本地模式）

1. App 请求 patch 或项目文件时，走 P2P
2. CLI 读取文件，发送 `FILE_META` → `FILE_CHUNK` → `FILE_END`
3. App 按需写入缓存，保持现有 UI 行为

目录请求走 `DIR_RESPONSE`，保留 `If-Modified-Since` 语义。

## 兼容与回退策略

- 本地模式仅走 P2P，不走 API 中转
- 云端模式继续走 `/v1/tasks/:id/patch|project/*`
- 分享模式不特殊处理，本地的继续同本地走P2P，云端的继续云端API

## 影响面与模块改动

### App

- 新增 `RtcConnectionManager` 管理本地机器的 P2P 连接与超时
- `TaskFileCache` 本地模式走 P2P，云端走 HTTP
- UI 侧增加本地连接状态提示（可选）

### CLI

- 在 daemon 进程引入 WebRTC responder（node-datachannel）
- 复用 `workspaceFileRequestHandler` 逻辑，输出到 DataChannel
- 维护多 session 连接与资源回收

### API

- 新增 WebRTC 信令事件转发（App ⇄ Machine）
- 权限校验：仅允许同用户的本地机器配对
- 增加 ICE 配置拉取事件（初版环境变量直出）

### Shared

- 增加 WebRTC 信令事件类型、ICE 配置事件与 DataChannel 消息类型
- 抽象 `workspaceFile` 逻辑的公共结构，减少双端重复

## 里程碑与实施计划

1. **协议与事件定义**：补充 WebRTC 信令事件与 DataChannel 帧协议
2. **API 信令转发**：App/Machine WebSocket 事件路由、权限校验、ICE 配置拉取
3. **CLI P2P 接入**：node-datachannel 建连、文件服务与资源释放（daemon）
4. **App P2P 接入**：WebRTC 发起方、文件请求改造、懒连接与超时
5. **观测与灰度**：连接成功率、传输耗时监控

## 风险与待确认事项

- NAT 穿透失败时的 TURN 成本与部署方案
- node-datachannel 在不同 OS 上的编译/兼容性
- React Native WebRTC 实现差异（Web vs Mobile）
- 多任务并发下载对 DataChannel 背压的影响
