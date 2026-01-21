# Create Share Link

Generate a shareable link for task results, allowing others to view task outputs without needing an Agentrix account.

## Endpoint

```
POST /v1/share-links
```

## Authentication

Requires API key in the Authorization header:

```bash
Authorization: Bearer YOUR_API_KEY
```

## Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | ID of the task to share |
| `title` | string | No | Custom title for the share link (defaults to task title) |
| `description` | string | No | Description for the share link |
| `expires_at` | string | No | ISO 8601 timestamp when link expires (default: 30 days) |
| `password` | string | No | Optional password protection (8-32 characters) |
| `permissions` | object | No | Access permissions configuration |
| `permissions.allow_download` | boolean | No | Allow downloading task outputs (default: true) |
| `permissions.allow_comments` | boolean | No | Allow viewers to leave comments (default: false) |
| `permissions.show_metadata` | boolean | No | Show task metadata (timing, agent info) (default: true) |
| `max_views` | integer | No | Maximum number of views before link expires (default: unlimited) |
| `notify_on_view` | boolean | No | Send email notification when link is viewed (default: false) |

### Request Body Schema

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

## Response

### Success Response (201 Created)

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

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `share_link_id` | string | Unique share link identifier |
| `task_id` | string | Associated task ID |
| `title` | string | Share link title |
| `description` | string | Share link description |
| `url` | string | Full shareable URL |
| `short_url` | string | Shortened URL for easier sharing |
| `password_protected` | boolean | Whether link requires password |
| `expires_at` | string | ISO 8601 expiration timestamp |
| `max_views` | integer | Maximum allowed views (null if unlimited) |
| `view_count` | integer | Current number of views |
| `permissions` | object | Access permissions |
| `created_at` | string | ISO 8601 creation timestamp |
| `created_by` | string | User ID who created the link |
| `status` | string | Link status: `active`, `expired`, `revoked` |

### Error Responses

#### 400 Bad Request

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

#### 404 Not Found

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

#### 403 Forbidden

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

## Examples

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

## Share Link Lifecycle

### Active Link

When created, the link is `active` and can be accessed by anyone with the URL (and password if protected).

### View Tracking

Each access to the share link increments the `view_count`. When `max_views` is reached, the link automatically becomes `expired`.

### Expiration

Links automatically expire when:
- The `expires_at` timestamp is reached
- The `max_views` limit is reached
- The link is manually revoked

### Expired/Revoked Links

Expired or revoked links return a 404 error when accessed. Users see a friendly message explaining the link is no longer available.

## Security Best Practices

1. **Use Password Protection**: For sensitive information, always set a password
2. **Set Expiration Dates**: Don't create permanent links; set reasonable expiration times
3. **Limit Views**: Use `max_views` for one-time or limited-audience shares
4. **Disable Downloads**: Set `allow_download: false` for view-only sharing
5. **Monitor Usage**: Enable `notify_on_view` to track when links are accessed
6. **Revoke When Done**: Manually revoke links that are no longer needed

## Permissions Configuration

### Allow Download

```json
{
  "allow_download": true  // Users can download task outputs and artifacts
}
```

### Allow Comments

```json
{
  "allow_comments": true  // Viewers can leave comments (requires email verification)
}
```

### Show Metadata

```json
{
  "show_metadata": true  // Display execution time, agent info, and technical details
}
```

## Common Use Cases

### Public Demo

Share results publicly without restrictions:

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

### Confidential Client Report

Secure sharing with password and limited views:

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

### One-Time Share

Single-use link that expires after one view:

```json
{
  "task_id": "task_123",
  "max_views": 1,
  "expires_at": "2024-01-20T23:59:59Z",
  "notify_on_view": true
}
```

## Webhook Notifications

When `notify_on_view` is enabled, you receive webhook notifications:

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

## Related Endpoints

- [Get Share Link](/api-reference/get-share-link) - Retrieve share link details
- [List Share Links](/api-reference/list-share-links) - View all your share links
- [Update Share Link](/api-reference/update-share-link) - Modify link settings
- [Revoke Share Link](/api-reference/revoke-share-link) - Invalidate a share link
- [Get Share Link Analytics](/api-reference/share-link-analytics) - View access statistics

## Need Help?

- View [API Overview](/api-reference/overview) for general API information
- Check [Authentication Guide](/api-reference/authentication) for API key management
- Learn about [Task Management](/api-reference/create-task) to create tasks
- Report issues on [GitHub](https://github.com/xmz-ai/agentrix/issues)
