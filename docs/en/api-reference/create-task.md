# Create Task

Create a new task with AI agents to execute your requirements.

## Endpoint

```
POST /v1/tasks
```

## Authentication

Requires API key in the Authorization header:

```bash
Authorization: Bearer YOUR_API_KEY
```

## Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Task title (max 200 characters) |
| `description` | string | Yes | Detailed task description |
| `agent_id` | string | No | Specific agent to use (defaults to auto-select) |
| `priority` | string | No | Task priority: `low`, `normal`, `high` (default: `normal`) |
| `tags` | array | No | Array of tag strings for organization |
| `context` | object | No | Additional context for the task |
| `context.files` | array | No | Array of file paths or URLs to include as context |
| `context.repository` | string | No | Git repository URL |
| `context.branch` | string | No | Git branch name (default: `main`) |
| `callback_url` | string | No | Webhook URL for status updates |
| `config` | object | No | Task configuration options |
| `config.max_execution_time` | integer | No | Maximum execution time in seconds (default: 3600) |
| `config.model` | string | No | AI model to use: `claude-opus-4.5`, `claude-sonnet-4.5` |
| `config.temperature` | float | No | Model temperature 0.0-1.0 (default: 0.7) |

### Request Body Schema

```json
{
  "title": "string",
  "description": "string",
  "agent_id": "string",
  "priority": "low" | "normal" | "high",
  "tags": ["string"],
  "context": {
    "files": ["string"],
    "repository": "string",
    "branch": "string"
  },
  "callback_url": "string",
  "config": {
    "max_execution_time": 3600,
    "model": "claude-opus-4.5" | "claude-sonnet-4.5",
    "temperature": 0.7
  }
}
```

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "task_id": "task_1234567890abcdef",
    "title": "Fix login authentication bug",
    "description": "Debug and fix the authentication issue in the login flow",
    "status": "pending",
    "priority": "high",
    "agent_id": "agent_default",
    "tags": ["bug", "authentication"],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "estimated_completion": "2024-01-15T11:30:00Z",
    "url": "https://app.agentrix.xmz.ai/tasks/task_1234567890abcdef"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `task_id` | string | Unique task identifier |
| `title` | string | Task title |
| `description` | string | Task description |
| `status` | string | Current status: `pending`, `running`, `completed`, `failed` |
| `priority` | string | Task priority level |
| `agent_id` | string | Assigned agent identifier |
| `tags` | array | Task tags |
| `created_at` | string | ISO 8601 timestamp of creation |
| `updated_at` | string | ISO 8601 timestamp of last update |
| `estimated_completion` | string | Estimated completion time |
| `url` | string | Direct link to view task in Agentrix platform |

### Error Responses

#### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters",
    "details": {
      "field": "description",
      "issue": "Description is required and cannot be empty"
    }
  }
}
```

#### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key",
    "details": {}
  }
}
```

#### 429 Too Many Requests

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "limit": 100,
      "remaining": 0,
      "reset_at": "2024-01-15T11:00:00Z"
    }
  }
}
```

## Examples

### cURL

```bash
curl -X POST https://api.agentrix.xmz.ai/v1/tasks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix login authentication bug",
    "description": "Debug and fix the authentication issue in the login flow. Check JWT token validation and session management.",
    "priority": "high",
    "tags": ["bug", "authentication"],
    "context": {
      "repository": "https://github.com/myorg/myapp.git",
      "branch": "develop",
      "files": ["src/auth/login.ts", "src/middleware/auth.ts"]
    },
    "config": {
      "model": "claude-opus-4.5",
      "max_execution_time": 7200
    }
  }'
```

### JavaScript/TypeScript

```typescript
import { AgentrixClient } from '@agentrix/sdk';

const client = new AgentrixClient({
  apiKey: process.env.AGENTRIX_API_KEY
});

async function createTask() {
  try {
    const task = await client.tasks.create({
      title: 'Fix login authentication bug',
      description: 'Debug and fix the authentication issue in the login flow. Check JWT token validation and session management.',
      priority: 'high',
      tags: ['bug', 'authentication'],
      context: {
        repository: 'https://github.com/myorg/myapp.git',
        branch: 'develop',
        files: ['src/auth/login.ts', 'src/middleware/auth.ts']
      },
      config: {
        model: 'claude-opus-4.5',
        max_execution_time: 7200
      }
    });

    console.log('Task created:', task.task_id);
    console.log('View at:', task.url);
  } catch (error) {
    console.error('Error creating task:', error.message);
  }
}

createTask();
```

### Python

```python
from agentrix_sdk import AgentrixClient
import os

client = AgentrixClient(api_key=os.environ['AGENTRIX_API_KEY'])

try:
    task = client.tasks.create(
        title='Fix login authentication bug',
        description='Debug and fix the authentication issue in the login flow. Check JWT token validation and session management.',
        priority='high',
        tags=['bug', 'authentication'],
        context={
            'repository': 'https://github.com/myorg/myapp.git',
            'branch': 'develop',
            'files': ['src/auth/login.ts', 'src/middleware/auth.ts']
        },
        config={
            'model': 'claude-opus-4.5',
            'max_execution_time': 7200
        }
    )

    print(f'Task created: {task.task_id}')
    print(f'View at: {task.url}')
except Exception as e:
    print(f'Error creating task: {str(e)}')
```

### Go

```go
package main

import (
    "fmt"
    "os"
    "github.com/agentrix/agentrix-go"
)

func main() {
    client := agentrix.NewClient(os.Getenv("AGENTRIX_API_KEY"))

    task, err := client.Tasks.Create(&agentrix.CreateTaskRequest{
        Title:       "Fix login authentication bug",
        Description: "Debug and fix the authentication issue in the login flow. Check JWT token validation and session management.",
        Priority:    "high",
        Tags:        []string{"bug", "authentication"},
        Context: &agentrix.TaskContext{
            Repository: "https://github.com/myorg/myapp.git",
            Branch:     "develop",
            Files:      []string{"src/auth/login.ts", "src/middleware/auth.ts"},
        },
        Config: &agentrix.TaskConfig{
            Model:            "claude-opus-4.5",
            MaxExecutionTime: 7200,
        },
    })

    if err != nil {
        fmt.Printf("Error creating task: %v\n", err)
        return
    }

    fmt.Printf("Task created: %s\n", task.TaskID)
    fmt.Printf("View at: %s\n", task.URL)
}
```

## Webhook Callbacks

If you provide a `callback_url`, Agentrix will send POST requests to notify you of task status changes:

### Callback Payload

```json
{
  "event": "task.status_changed",
  "task_id": "task_1234567890abcdef",
  "status": "completed",
  "previous_status": "running",
  "timestamp": "2024-01-15T11:15:00Z",
  "data": {
    "result": "Task completed successfully",
    "execution_time": 2700,
    "output_url": "https://api.agentrix.xmz.ai/v1/tasks/task_1234567890abcdef/output"
  }
}
```

### Callback Events

- `task.status_changed` - Task status updated
- `task.completed` - Task finished successfully
- `task.failed` - Task execution failed
- `task.timeout` - Task exceeded max execution time

## Best Practices

1. **Provide Clear Descriptions**: Include specific requirements, constraints, and expected outcomes
2. **Use Context Effectively**: Provide relevant files and repository information
3. **Set Appropriate Timeouts**: Estimate task complexity and set `max_execution_time` accordingly
4. **Implement Webhooks**: Use callbacks for long-running tasks instead of polling
5. **Handle Errors Gracefully**: Implement retry logic with exponential backoff for transient failures
6. **Use Tags**: Organize tasks with tags for easier filtering and reporting

## Related Endpoints

- [Get Task Status](/api-reference/get-task) - Check task progress
- [List Tasks](/api-reference/list-tasks) - View all your tasks
- [Create Share Link](/api-reference/create-share-link) - Share task results
- [Cancel Task](/api-reference/cancel-task) - Stop a running task

## Need Help?

- View [API Overview](/api-reference/overview) for general API information
- Check [Authentication Guide](/api-reference/authentication) for API key management
- Report issues on [GitHub](https://github.com/xmz-ai/agentrix/issues)
