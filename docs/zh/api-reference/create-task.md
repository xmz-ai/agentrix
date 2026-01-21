# 创建任务

使用 AI 代理创建新任务以执行您的需求。

## 端点

```
POST /v1/tasks
```

## 认证

需要在授权头中提供 API 密钥：

```bash
Authorization: Bearer YOUR_API_KEY
```

## 请求体

| 参数 | 类型 | 必需 | 描述 |
| --- | --- | --- | --- |
| title | string | 是 | 任务标题（最多200个字符） |
| description | string | 是 | 详细任务描述 |
| agent\_id | string | 没有 | 使用特定代理（默认自动选择） |
| priority | string | 没有 | 任务优先级： 低 、 正常 、 高 （默认： 正常 ） |
| tags | array | 没有 | 标签字符串数组用于组织 |
| context | 对象 | 没有 | 任务的附加上下文 |
| context.files | 数组 | 没有 | 包含上下文的文件路径或 URL 数组 |
| context.repository | string | 没有 | Git 仓库 URL |
| context.branch | string | 没有 | Git 分支名称（默认：main） |
| callback\_url | 字符串 | 没有 | 状态更新的 Webhook URL |
| config | 对象 | 没有 | 任务配置选项 |
| config.max\_execution\_time | 整数 | 没有 | 最大执行时间（秒）（默认：3600） |
| config.model | 字符串 | 没有 | 要使用的 AI 模型：claude-opus-4.5, claude-sonnet-4.5 |
| config.temperature | float | 没有 | 模型温度0.0-1.0（默认：0.7） |

### 请求体架构

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

## 响应

### 成功响应（201 创建）

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

### 响应字段

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| task\_id | 字符串 | 唯一任务标识符 |
| title | 字符串 | 任务标题 |
| description | 字符串 | 任务描述 |
| status | 字符串 | 当前状态：pending，running，completed，failed |
| priority | 字符串 | 任务优先级 |
| agent\_id | 字符串 | 分配代理标识符 |
| tags | 数组 | 任务标签 |
| created\_at | 字符串 | 创建的 ISO 8601 时间戳 |
| updated\_at | 字符串 | 最后更新时间的 ISO 8601 时间戳 |
| estimated\_completion | 字符串 | 预计完成时间 |
| url | 字符串 | Agentrix 平台查看任务的直接链接 |

### 错误响应

#### 400 错误请求

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

#### 401 未授权

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

#### 429 请求过多

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

## 示例

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

## Webhook 回调

如果你提供 `callback_url`，Agentrix 将发送 POST 请求通知你任务状态变化：

### 回调负载

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

### 回调事件

*   `task.status_changed` - 任务状态已更新
*   `task.completed` - 任务成功完成
*   `task.failed` - 任务执行失败
*   `task.timeout` - 任务超出最大执行时间

## 最佳实践

1.  **提供清晰描述** ：包括具体要求、限制条件和预期结果
2.  **有效利用上下文** : 提供相关的文件和仓库信息
3.  **设置合适的超时时间** : 估计任务复杂度并相应设置 `max_execution_time`
4.  **实现 Webhooks**: 使用回调代替轮询来处理长时间运行的任务
5.  **优雅地处理错误** : 对暂时性故障实现带指数退避的重试逻辑
6.  **使用标签** : 使用标签组织任务，以便更轻松地筛选和报告

## 相关端点

*   [获取任务状态](/api-reference/get-task) \- 检查任务进度
*   [列出任务](/api-reference/list-tasks) \- 查看所有任务
*   [创建分享链接](/api-reference/create-share-link) \- 分享任务结果
*   [取消任务](/api-reference/cancel-task) \- 停止正在运行的任务

## 需要帮助？

*   查看 [API 概览](/api-reference/overview) 获取一般 API 信息
*   查阅 [认证指南](/api-reference/authentication) 了解 API 密钥管理
*   在 [GitHub](https://github.com/xmz-ai/agentrix/issues) 上报告问题