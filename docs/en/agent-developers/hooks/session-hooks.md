# Session Lifecycle Hooks

Hooks for tracking agent session lifecycle events.

## SessionStart

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

## SessionEnd

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

## Stop

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
