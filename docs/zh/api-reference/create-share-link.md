# 创建分享链接

为任务结果生成可分享的链接，允许其他人无需 Agentrix 账户即可查看任务输出。

## 端点

```
POST /v1/share-links
```

## 认证

需要在授权头中提供 API 密钥：

```bash
Authorization: Bearer YOUR_API_KEY
```

## 请求体

| 参数 | 类型 | 必需 | 描述 |
| --- | --- | --- | --- |
| task\_id | 字符串 | 是 | 要分享的任务 ID |
| title | 字符串 | 没有 | 分享链接的自定义标题（默认为任务标题） |
| description | 字符串 | 没有 | 分享链接的描述 |
| expires\_at | 字符串 | 没有 | 链接过期时的 ISO 8601 时间戳（默认：30 天） |
| password | 字符串 | 没有 | 可选的密码保护（8-32个字符） |
| permissions | 对象 | 没有 | 访问权限配置 |
| permissions.allow\_download | 布尔值 | 没有 | 允许下载任务输出（默认：true） |
| permissions.allow\_comments | 布尔值 | 没有 | 允许观众留言（默认：false） |
| permissions.show\_metadata | 布尔值 | 没有 | 显示任务元数据（时间、代理信息）（默认：true） |
| max\_views | 整数 | 没有 | 链接过期前的最大查看次数（默认：无限制） |
| notify\_on\_view | 布尔值 | 没有 | 当链接被查看时发送邮件通知（默认：false） |

### 请求体架构

```json
{
  "task_id": "string",
  "title": "string",
  "description": "string",
  "expires_at": "2024-12-31T23:59:59Z",
  "password": "string",
  "permissions": {
    "allow_download": true,
    "allow_comments": false,
    "show_metadata": true
  },
  "max_views": 100,
  "notify_on_view": false
}
```

## 响应

### 成功响应（201 创建）

```json
{
  "success": true,
  "data": {
    "share_link_id": "share_9876543210fedcba",
    "task_id": "task_1234567890abcdef",
    "title": "Login Bug Fix Results",
    "description": "Shared results of the authentication bug fix",
    "url": "https://share.agentrix.xmz.ai/s/9876543210fedcba",
    "short_url": "https://agx.ai/s/abc123",
    "password_protected": true,
    "expires_at": "2024-02-15T23:59:59Z",
    "max_views": 100,
    "view_count": 0,
    "permissions": {
      "allow_download": true,
      "allow_comments": false,
      "show_metadata": true
    },
    "created_at": "2024-01-15T10:30:00Z",
    "created_by": "user_abc123",
    "status": "active"
  }
}
```

### 响应字段

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| share\_link\_id | 字符串 | 唯一分享链接标识符 |
| task\_id | 字符串 | 关联的任务 ID |
| title | 字符串 | 分享链接标题 |
| description | 字符串 | 分享链接描述 |
| url | 字符串 | 完整的可分享链接 |
| short\_url | 字符串 | 缩短的链接以便更容易分享 |
| password\_protected | 布尔值 | 链接是否需要密码 |
| expires\_at | 字符串 | ISO 8601 格式的过期时间戳 |
| max\_views | 整数 | 最大允许查看次数（如果无限制则为 null） |
| view\_count | 整数 | 当前查看次数 |
| permissions | 对象 | 访问权限 |
| created\_at | 字符串 | ISO 8601 创建时间戳 |
| created\_by | 字符串 | 创建链接的用户 ID |
| status | 字符串 | 链接状态：active，expired，revoked |

### 错误响应

#### 400 错误请求

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters",
    "details": {
      "field": "task_id",
      "issue": "Task ID is required"
    }
  }
}
```

#### 404 未找到

```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task not found or not accessible",
    "details": {
      "task_id": "task_1234567890abcdef"
    }
  }
}
```

#### 403 禁止访问

```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_COMPLETED",
    "message": "Cannot create share link for incomplete tasks",
    "details": {
      "task_id": "task_1234567890abcdef",
      "status": "running"
    }
  }
}
```

## 示例

### cURL

```bash
curl -X POST https://api.agentrix.xmz.ai/v1/share-links \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "task_1234567890abcdef",
    "title": "Login Bug Fix Results",
    "description": "Results from fixing the authentication issue",
    "expires_at": "2024-02-15T23:59:59Z",
    "password": "securepass123",
    "permissions": {
      "allow_download": true,
      "allow_comments": false,
      "show_metadata": true
    },
    "max_views": 100,
    "notify_on_view": true
  }'
```

### JavaScript/TypeScript

```typescript
import { AgentrixClient } from '@agentrix/sdk';

const client = new AgentrixClient({
  apiKey: process.env.AGENTRIX_API_KEY
});

async function createShareLink() {
  try {
    const shareLink = await client.shareLinks.create({
      task_id: 'task_1234567890abcdef',
      title: 'Login Bug Fix Results',
      description: 'Results from fixing the authentication issue',
      expires_at: '2024-02-15T23:59:59Z',
      password: 'securepass123',
      permissions: {
        allow_download: true,
        allow_comments: false,
        show_metadata: true
      },
      max_views: 100,
      notify_on_view: true
    });

    console.log('Share link created:', shareLink.url);
    console.log('Short URL:', shareLink.short_url);
    console.log('Share link ID:', shareLink.share_link_id);
  } catch (error) {
    console.error('Error creating share link:', error.message);
  }
}

createShareLink();
```

### Python

```python
from agentrix_sdk import AgentrixClient
import os
from datetime import datetime, timedelta

client = AgentrixClient(api_key=os.environ['AGENTRIX_API_KEY'])

# Calculate expiration date (30 days from now)
expires_at = (datetime.now() + timedelta(days=30)).isoformat()

try:
    share_link = client.share_links.create(
        task_id='task_1234567890abcdef',
        title='Login Bug Fix Results',
        description='Results from fixing the authentication issue',
        expires_at=expires_at,
        password='securepass123',
        permissions={
            'allow_download': True,
            'allow_comments': False,
            'show_metadata': True
        },
        max_views=100,
        notify_on_view=True
    )

    print(f'Share link created: {share_link.url}')
    print(f'Short URL: {share_link.short_url}')
    print(f'Share link ID: {share_link.share_link_id}')
except Exception as e:
    print(f'Error creating share link: {str(e)}')
```

### Go

```go
package main

import (
    "fmt"
    "os"
    "time"
    "github.com/agentrix/agentrix-go"
)

func main() {
    client := agentrix.NewClient(os.Getenv("AGENTRIX_API_KEY"))

    // Calculate expiration date (30 days from now)
    expiresAt := time.Now().AddDate(0, 0, 30)

    shareLink, err := client.ShareLinks.Create(&agentrix.CreateShareLinkRequest{
        TaskID:      "task_1234567890abcdef",
        Title:       "Login Bug Fix Results",
        Description: "Results from fixing the authentication issue",
        ExpiresAt:   expiresAt.Format(time.RFC3339),
        Password:    "securepass123",
        Permissions: &agentrix.ShareLinkPermissions{
            AllowDownload: true,
            AllowComments: false,
            ShowMetadata:  true,
        },
        MaxViews:     100,
        NotifyOnView: true,
    })

    if err != nil {
        fmt.Printf("Error creating share link: %v\n", err)
        return
    }

    fmt.Printf("Share link created: %s\n", shareLink.URL)
    fmt.Printf("Short URL: %s\n", shareLink.ShortURL)
    fmt.Printf("Share link ID: %s\n", shareLink.ShareLinkID)
}
```

## 分享链接生命周期

### 活跃链接

创建时，链接是`激活`状态，任何拥有 URL 的人（如果受保护，还需要密码）都可以访问。

### 查看跟踪

每次访问分享链接都会增加 `view_count`。当 `max_views` 达到时，链接会自动变成`过期` 。

### 过期

链接在以下情况下自动过期：

*   `expires_at` 时间戳被达到
*   `max_views` 限制被达到
*   链接被手动撤销

### 过期/已撤销链接

过期或已撤销的链接在访问时返回404错误。用户会看到一个友好的消息，解释链接不再可用。

## 安全最佳实践

1.  **使用密码保护** ：对于敏感信息，始终设置密码
2.  **设置过期时间** : 不要创建永久链接；设置合理的过期时间
3.  **限制查看次数** : 使用 `max_views` 进行一次性或限受众分享
4.  **禁用下载** : 设置 `allow_download: false` 进行仅查看分享
5.  **监控使用情况** : 启用 `notify_on_view` 跟踪链接访问时间
6.  **完成时撤销** : 手动撤销不再需要的链接

## 权限配置

### 允许下载

```json
{
  "allow_download": true  // Users can download task outputs and artifacts
}
```

### 允许评论

```json
{
  "allow_comments": true  // Viewers can leave comments (requires email verification)
}
```

### 显示元数据

```json
{
  "show_metadata": true  // Display execution time, agent info, and technical details
}
```

## 常见使用场景

### 公共演示

无限制地公开分享结果：

```json
{
  "task_id": "task_abc",
  "title": "Public Demo: AI Code Review",
  "permissions": {
    "allow_download": true,
    "allow_comments": true,
    "show_metadata": true
  }
}
```

### 机密客户报告

密码保护和有限查看的共享：

```json
{
  "task_id": "task_xyz",
  "title": "Confidential Security Audit Results",
  "password": "client-pass-2024",
  "max_views": 5,
  "expires_at": "2024-02-01T23:59:59Z",
  "permissions": {
    "allow_download": false,
    "allow_comments": false,
    "show_metadata": false
  },
  "notify_on_view": true
}
```

### 一次性共享

单次使用的链接，在查看后过期：

```json
{
  "task_id": "task_123",
  "max_views": 1,
  "expires_at": "2024-01-20T23:59:59Z",
  "notify_on_view": true
}
```

## Webhook 通知

当 `notify_on_view` 开启时，您将收到 webhook 通知：

```json
{
  "event": "share_link.viewed",
  "share_link_id": "share_9876543210fedcba",
  "task_id": "task_1234567890abcdef",
  "timestamp": "2024-01-15T14:30:00Z",
  "viewer": {
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "country": "US",
    "city": "San Francisco"
  },
  "view_count": 1,
  "max_views": 100
}
```

## 相关端点

*   [获取分享链接](/api-reference/get-share-link) \- 检索分享链接详情
*   [列出分享链接](/api-reference/list-share-links) \- 查看您所有的分享链接
*   [更新分享链接](/api-reference/update-share-link) \- 修改链接设置
*   [撤销分享链接](/api-reference/revoke-share-link) \- 使分享链接失效
*   [获取分享链接分析](/api-reference/share-link-analytics) \- 查看访问统计

## 需要帮助？

*   查看 [API 概览](/api-reference/overview) 获取一般 API 信息
*   查阅 [认证指南](/api-reference/authentication) 了解 API 密钥管理
*   了解[任务管理](/api-reference/create-task)以创建任务
*   在 [GitHub](https://github.com/xmz-ai/agentrix/issues) 上报告问题