# Hook Types Reference

Complete reference for all 12 Agentrix hook types.

## Overview

- **11 Claude SDK Hooks**: From `@anthropic-ai/claude-agent-sdk`
- **1 Agentrix Hook**: From `@agentrix/shared`

## Import Types

**Claude SDK hooks**:

```typescript
import type {
  PreToolUseHookInput,
  PostToolUseHookInput,
  SessionStartHookInput,
  SessionEndHookInput,
  UserPromptSubmitHookInput,
  StopHookInput,
  SubagentStartHookInput,
  SubagentStopHookInput,
  PreCompactHookInput,
  NotificationHookInput,
  PermissionRequestHookInput,
} from '@anthropic-ai/claude-agent-sdk';
```

**Agentrix custom hooks**:

```typescript
import type {
  RepositoryInitHookInput,
} from '@agentrix/shared';
```

## Tool Control Hooks

### PreToolUse

**Trigger**: Before each tool execution

```typescript
interface PreToolUseHookInput {
  hook_event_name: 'PreToolUse';
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  tool_name: string;
  tool_input: unknown;
  tool_use_id: string;
}

type PreToolUseResult = {
  decision?: 'approve' | 'block';
  systemMessage?: string;
  hookSpecificOutput?: {
    hookEventName: 'PreToolUse';
    permissionDecision?: 'allow' | 'deny' | 'ask';
    permissionDecisionReason?: string;
    updatedInput?: Record<string, unknown>;
  };
};
```

### PostToolUse

**Trigger**: After each tool execution

```typescript
interface PostToolUseHookInput {
  hook_event_name: 'PostToolUse';
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  tool_name: string;
  tool_input: unknown;
  tool_response: unknown;
  tool_use_id: string;
}

type PostToolUseResult = {
  hookSpecificOutput?: {
    hookEventName: 'PostToolUse';
    additionalContext?: string;
    updatedMCPToolOutput?: unknown;
  };
};
```

## Session Lifecycle Hooks

### SessionStart

**Trigger**: Agent session begins

```typescript
interface SessionStartHookInput {
  hook_event_name: 'SessionStart';
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  source: 'startup' | 'resume' | 'clear' | 'compact';
}

type SessionStartResult = {
  hookSpecificOutput?: {
    hookEventName: 'SessionStart';
    additionalContext?: string;
  };
};
```

### SessionEnd

**Trigger**: Agent session ends

```typescript
interface SessionEndHookInput {
  hook_event_name: 'SessionEnd';
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  reason: string;
}

type SessionEndResult = {};
```

### UserPromptSubmit

**Trigger**: User submits a prompt

```typescript
interface UserPromptSubmitHookInput {
  hook_event_name: 'UserPromptSubmit';
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  prompt: string;
}

type UserPromptSubmitResult = {
  hookSpecificOutput?: {
    hookEventName: 'UserPromptSubmit';
    additionalContext?: string;
  };
};
```

### Stop

**Trigger**: Agent is stopping

```typescript
interface StopHookInput {
  hook_event_name: 'Stop';
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  stop_hook_active: boolean;
}

type StopResult = {};
```

### SubagentStart

**Trigger**: Subagent starts

```typescript
interface SubagentStartHookInput {
  hook_event_name: 'SubagentStart';
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  agent_id: string;
  agent_type: string;
}

type SubagentStartResult = {
  hookSpecificOutput?: {
    hookEventName: 'SubagentStart';
    additionalContext?: string;
  };
};
```

### SubagentStop

**Trigger**: Subagent completes

```typescript
interface SubagentStopHookInput {
  hook_event_name: 'SubagentStop';
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  stop_hook_active: boolean;
  agent_id: string;
  agent_transcript_path: string;
}

type SubagentStopResult = {};
```

## Context Management Hooks

### PreCompact

**Trigger**: Before context compaction

```typescript
interface PreCompactHookInput {
  hook_event_name: 'PreCompact';
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  trigger: 'manual' | 'auto';
  custom_instructions: string | null;
}

type PreCompactResult = {};
```

## System Event Hooks

### Notification

**Trigger**: System notifications

```typescript
interface NotificationHookInput {
  hook_event_name: 'Notification';
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  message: string;
  title?: string;
  notification_type: string;
}

type NotificationResult = {};
```

### PermissionRequest

**Trigger**: When permission is needed for a tool call

```typescript
interface PermissionRequestHookInput {
  hook_event_name: 'PermissionRequest';
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  tool_name: string;
  tool_input: unknown;
  permission_suggestions?: PermissionUpdate[];
}

type PermissionRequestResult = {
  hookSpecificOutput?: {
    hookEventName: 'PermissionRequest';
    decision: {
      behavior: 'allow';
      updatedInput?: Record<string, unknown>;
      updatedPermissions?: PermissionUpdate[];
    } | {
      behavior: 'deny';
      message?: string;
      interrupt?: boolean;
    };
  };
};
```

## Repository Hooks (Agentrix Custom)

### RepositoryInit

**Trigger**: New git repository created (git init mode only)

```typescript
interface RepositoryInitHookInput {
  hook_event_name: 'RepositoryInit';
  workspace_path: string;
  task_id: string;
}

type RepositoryInitResult = {};
```

See [RepositoryInit documentation](./repository-init.md) for details.

## Hook Execution Order

```
SessionStart
  ↓
UserPromptSubmit (each message)
  ↓
PreToolUse (each tool)
  ↓
PermissionRequest (if needed)
  ↓
[Tool Executes]
  ↓
PostToolUse (each result)
  ↓
PreCompact (if needed)
  ↓
Stop / SessionEnd
```

Special:
- **RepositoryInit**: Once during git init (Agentrix custom)
- **SubagentStart/SubagentStop**: When subagents start/complete
- **Notification**: On system events

## Related

- [Hook Overview](./overview.md)
- [Development Guide](./development-guide.md)
- [Examples](./examples.md)
