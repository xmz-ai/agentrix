# Repository Auto-Association Implementation Summary

## Overview

实现了 CWD 模式下自动关联已授权 Repository 的功能，使本地开发可以使用 merge-request 等 git-server 功能。

## Implementation Date

2025-12-19

## Key Features

1. ✅ 自动检测本地 git remote URL
2. ✅ 验证 Repository 是否已授权
3. ✅ 非阻塞关联（失败不影响 Task 启动）
4. ✅ 双重防护防止模式切换（API + CLI）
5. ✅ 友好的用户提示消息
6. ✅ 完全向后兼容

## Modified Files

### Shared Package (`shared/`)

**src/websocket/events.ts**
- Added `AssociateRepoEventData` schema (lines 441-449)
- Added `AssociateRepoAck` interface (lines 452-457)
- Added `repositoryId` to `baseTaskSchema` (line 214)
- Added `associate-repo` to `EventSchemaMap` (line 650)
- Added `associate-repo` to `WorkerTaskEvent` type (line 680)
- Added `associate-repo` to `workerTaskEvents` array (line 693)

### CLI Package (`cli/`)

**src/utils/git.ts**
- Added `RemoteInfo` interface (lines 142-147)
- Added `getRemoteInfo()` function (lines 149-181)
  - Parses SSH and HTTPS remote URLs
  - Handles SSH aliases (e.g., github.com-work)
  - Returns null if no origin or parse fails

**src/worker/workerClient.ts**
- Added imports for `AssociateRepoEventData`, `AssociateRepoAck` (line 18)
- Added `associateRepository()` method (lines 380-412)
  - Sends associate-repo WebSocket event
  - Uses `sendWithAck` to wait for response
  - Returns ACK with repositoryId or error
- Added `sendInfoMessage()` method (lines 417-438)
  - Sends non-error system messages to user

**src/worker/workspaceSetup.ts**
- Added import for `getRemoteInfo` (line 18)
- Added `tryAssociateRepository()` function (lines 145-199)
  - Non-blocking repository association
  - Handles all error scenarios gracefully
  - Sends user-friendly messages
- Modified `setupLocalWorkspace()` signature (lines 201-207)
  - Added `workClient` parameter
  - Added `skipRepoAssociation` parameter
  - Integrated `tryAssociateRepository()` call (line 224)
- **UPDATED**: Removed deprecated `setupWorkspace()` helper
  - Workspace setup now routes through strategy implementations
  - Source-type selection lives in `WorkspaceStrategyFactory`

**src/worker/claude/ClaudeWorker.ts**
- **UPDATED**: Switched to `InitializationOrchestrator`
  - Uses workspace strategies and phased initialization

**src/worker/codex/CodexWorker.ts**
- **UPDATED**: Switched to `InitializationOrchestrator`
  - Uses workspace strategies and phased initialization

### API Package (`api/`)

**src/services/git-server.ts**
- Added `getGitServerByHost()` function (lines 196-227)
  - Finds GitServer by hostname
  - Priority 1: Exact hostname match
  - Priority 2: Substring match (fallback)

**src/services/repository.ts**
- Modified `getRepositoryByUserAndName()` (lines 24-52)
  - Added optional `gitServerId` parameter
  - Filters results by git server if specified

**src/services/task.ts**
- **IMPROVED**: Modified `createTask()` function (lines 30-75)
  - **Auto-infers repositorySourceType** if not explicitly provided
  - Logic: `repositoryId` → 'git-server', `cwd` → 'directory', else → 'temporary'
  - Ensures CLI always receives valid repositorySourceType field
  - Logs final source type for debugging
- Added `updateTaskRepository()` function (lines 131-154)
  - Updates Task.repositoryId
  - **Does NOT modify repositorySourceType** (critical)
  - Invalidates cache

**src/services/task-messenger.ts**
- **CRITICAL**: Modified `buildResumeTaskEvent()` (lines 34-76)
  - Conditional gitUrl generation (lines 44-48)
  - Only generates gitUrl for `repositorySourceType === 'git-server'`
  - Passes `repositoryId` to worker (line 68)
  - Passes `repositorySourceType` to worker with type cast (line 69)

**src/websocket/handlers/workerTask/handlers/associateRepo.ts** (NEW FILE)
- Created complete event handler (73 lines)
- Validates GitServer existence
- Verifies Repository authorization
- Updates Task.repositoryId
- Returns ACK with success/error

**src/websocket/handlers/workerTask/index.ts**
- Added import for `associateRepo.js` (line 14)

## Architecture Patterns

### WebSocket Event Flow

```
Worker                    API
  │                        │
  │  associate-repo event  │
  ├──────────────────────→ │ Validate schema
  │                        │ Verify task access
  │                        │ Get GitServer by host
  │                        │ Verify Repository auth
  │                        │ Update Task.repositoryId
  │   ACK response         │
  │ ←──────────────────────┤
  │ {success, repositoryId}│
  │                        │
```

### Mode Switching Prevention (Dual Protection)

**Protection Layer 1 (API)**:
```typescript
// task-messenger.ts:46-48
const gitUrl = task.repositorySourceType === 'git-server'
  ? await generateGitUrlForRepository(task.repositoryId, task.userId)
  : undefined;
```

**Protection Layer 2 (CLI)**:
```typescript
// workspaceSetup.ts:277-287
if (cwd) {
  // CWD has priority - use local directory
  return setupLocalWorkspace(...);
}
if (gitUrl) {
  // Git URL mode only when no cwd
  return setupGitRepository(...);
}
```

### Non-Blocking Error Handling

All errors in `tryAssociateRepository()` are caught:
- No remote: Silent skip
- Git server not found: User message + skip
- Repository not authorized: User message + skip
- WebSocket error: Log + skip
- Any other error: Log + skip

Result: **Task always starts successfully**

## Database Schema

No schema changes required. Uses existing fields:
- `Task.repositoryId` (existing)
- `Task.repositorySourceType` (existing, not modified by association)
- `GitServer.baseUrl` (existing)
- `Repository.owner`, `Repository.name`, `Repository.gitServerId` (existing)

## Testing Status

### Build Status
- ✅ shared: Build successful
- ✅ cli: Build successful
- ✅ api: Build successful

### Manual Testing Required
See `TESTING-REPO-ASSOCIATION.md` for detailed test scenarios:
1. Success path (authorized repo)
2. Unauthorized repository
3. Git server not configured
4. No git remote
5. **CRITICAL**: Resume task after association (mode switching test)
6. Task already has repositoryId

## Performance Impact

Expected overhead:
- **With association**: +200-500ms (WebSocket + DB queries)
- **Skip association** (no remote): ~0ms (early return)
- **Failed association**: +100-300ms (caught early)

## Security Considerations

1. ✅ Uses existing authorization via `getRepositoryByUserAndName()`
2. ✅ Validates user has access via GitServerApp
3. ✅ WebSocket authentication required
4. ✅ Task access verification in handler
5. ✅ No new credentials or tokens required

## Backward Compatibility

✅ **Fully backward compatible**:
- Existing git-server mode: Unchanged
- Existing temporary mode: Unchanged
- Existing directory mode (without association): Unchanged
- Tasks created before this feature: Work normally

## Known Issues

None identified during implementation.

## Future Enhancements

1. Manual re-association command
2. Support for non-origin remotes (upstream, etc.)
3. Local caching of remote info
4. App UI showing association status
5. OAuth token injection for easier push

## Related Documentation

- Implementation Plan: `/Users/alex/.claude/plans/fluttering-mixing-koala.md`
- Testing Guide: `TESTING-REPO-ASSOCIATION.md`
- WebSocket Events: `shared/src/websocket/events.ts`
- Git Integration: `cli/CLAUDE.md`

## Contributors

- Implementation: Claude Code
- Review: Pending
- Testing: Pending

## Rollout Plan

### Phase 1: Internal Testing
1. Test all scenarios in `TESTING-REPO-ASSOCIATION.md`
2. Verify no regressions in existing modes
3. Performance profiling

### Phase 2: Beta Release
1. Deploy to staging environment
2. Monitor logs for errors
3. Collect user feedback

### Phase 3: Production Release
1. Deploy to production
2. Monitor association success rate
3. Update documentation

## Metrics to Monitor

1. **Association Success Rate**
   - Track: `success: true` vs `success: false` in ACK
   - Target: >90% success for authorized repos

2. **Performance**
   - Track: Time from worker start to workspace ready
   - Target: <500ms overhead for association

3. **Error Rates**
   - Track: `git_server_not_found`, `not_found` errors
   - Monitor for unexpected errors

4. **Feature Adoption**
   - Track: % of directory-mode tasks with repositoryId
   - Track: merge-request usage from directory mode

## Key Design Improvements (2025-12-19)

### Improvement 1: 显式模式选择

基于用户反馈进行了关键改进，移除了防御性 fallback 逻辑，采用显式模式选择：

### Problem Identified
原实现中 CLI 侧使用参数优先级判断（cwd > gitUrl），存在潜在问题：
- `cwd` 参数可能在使用前被设置
- 隐式判断逻辑不够清晰
- 依赖参数优先级不可靠

### Solution Implemented

1. **API 自动推断 repositorySourceType** (`api/src/services/task.ts`)
   - 如果 app 未提供，根据其他参数自动推断
   - Logic: `repositoryId` 存在 → 'git-server'
   - Logic: `cwd` 存在 → 'directory'
   - Logic: 默认 → 'temporary'
   - 保证 CLI 总是收到有效的 repositorySourceType

2. **CLI 显式模式选择** (`cli/src/worker/workspaceSetup.ts`)
   - 移除所有 fallback 逻辑
   - 强制要求 repositorySourceType 字段
   - 显式检查字段值，清晰的错误消息
   - 'git-server' → 验证 gitUrl 存在，克隆远程仓库
   - 'directory'/'temporary' → 使用本地目录

3. **Shared 类型支持** (`shared/src/websocket/events.ts`)
   - `baseTaskSchema` 包含 `repositorySourceType` 字段
   - `CreateTaskEventData` 和 `ResumeTaskEventData` 都支持
   - 类型安全的枚举值：`'temporary' | 'directory' | 'git-server'`

### Benefits

✅ **清晰明确**：模式由显式字段决定，无歧义
✅ **类型安全**：API 保证总是提供有效值
✅ **易于调试**：明确的错误消息，日志包含源类型
✅ **向后兼容**：API 自动推断确保旧代码继续工作
✅ **防止误用**：CLI 拒绝缺失或无效的 repositorySourceType

### Testing Impact

所有测试场景仍然有效，但现在：
- 每个测试场景都有明确的 repositorySourceType
- 错误场景会产生清晰的错误消息
- 可以通过日志验证正确的模式选择

---

### Improvement 2: Fire-and-Forget 关联

基于用户反馈进一步简化，移除 ACK 响应机制：

#### Rationale

关联操作本质上是"告知"API 建立关联，CLI 侧不需要：
- 等待关联结果
- 向用户显示关联成功/失败消息
- 处理关联失败的复杂逻辑

#### Changes Made

1. **移除 AssociateRepoAck 类型** (`shared/src/websocket/events.ts`)
   - 删除 ACK 接口定义
   - 事件变为单向通知

2. **简化 WorkerClient** (`cli/src/worker/workerClient.ts`)
   - `associateRepository()` 改为 `void` 返回
   - 使用 `send()` 而非 `sendWithAck()`
   - 移除 `sendInfoMessage()` 方法（不再需要）

3. **简化 tryAssociateRepository** (`cli/src/worker/workspaceSetup.ts`)
   - 移除 ACK 处理逻辑
   - 移除用户消息发送逻辑
   - 移除 taskId 参数（不需要）
   - 仅发送事件，不等待响应

4. **简化 API Handler** (`api/src/websocket/handlers/workerTask/handlers/associateRepo.ts`)
   - 移除 `callback` 参数
   - 不发送任何响应
   - 静默处理成功/失败

#### Benefits

✅ **更简洁**：移除 ~60 行不必要的 ACK 处理代码
✅ **更快速**：不需要等待 API 响应
✅ **更清晰**：关联操作是后台任务，不干扰用户
✅ **更可靠**：网络失败不影响关联请求发送

## Conclusion

Implementation完成，所有代码已编写并通过编译。功能遵循原计划设计，并经过两次关键改进：
1. 采用显式模式选择，消除隐式判断问题
2. 采用 fire-and-forget 模式，简化关联逻辑

下一步需要进行手动测试以验证功能正确性。
