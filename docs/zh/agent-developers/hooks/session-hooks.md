# 会话生命周期钩子

用于跟踪代理会话生命周期事件的钩子。

## 会话开始

```typescript
export async function SessionStart(
  input: SessionStartHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  console.log(`Session started: ${input.session_id}`);
  return {};
}
```

## 会话结束

```typescript
export async function SessionEnd(
  input: SessionEndHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  console.log(`Session ended: ${input.reason}`);
  return {};
}
```

## UserPromptSubmit

```typescript
export async function UserPromptSubmit(
  input: UserPromptSubmitHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  console.log(`User prompt: ${input.prompt.substring(0, 50)}...`);
  return {};
}
```

## 停止

```typescript
export async function Stop(
  input: StopHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  console.log('Agent stopping');
  return {};
}
```

## SubagentStop

```typescript
export async function SubagentStop(
  input: SubagentStopHookInput,
  toolUseID: string,
  options: { signal: AbortSignal }
) {
  console.log('Subagent stopped');
  return {};
}
```