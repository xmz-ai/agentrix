# API Reference Overview

Welcome to the Agentrix API Reference documentation. This section provides comprehensive information about integrating with Agentrix APIs.

## Introduction

Agentrix provides a RESTful API that enables developers to programmatically interact with the platform. You can create tasks, manage share links, and integrate Agentrix capabilities into your applications.

## Base URL

```
https://api.agentrix.xmz.ai/v1
```

## Authentication

All API requests require authentication using an API key. Include your API key in the request header:

```bash
Authorization: Bearer YOUR_API_KEY
```

### Getting Your API Key

1. Log in to the Agentrix platform
2. Navigate to Settings > API Keys
3. Generate a new API key
4. Store it securely - it will only be shown once

## Request Format

All POST and PUT requests should use JSON format with the appropriate `Content-Type` header:

```bash
Content-Type: application/json
```

## Response Format

All API responses are returned in JSON format with the following structure:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

## HTTP Status Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success - Request completed successfully |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request parameters |
| 401 | Unauthorized - Invalid or missing API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Available Endpoints

### Tasks

- [Create Task](./create-task.md) - Create a new task with AI agents
- Get Task - Retrieve task details
- List Tasks - Get all tasks for your account
- Update Task - Modify an existing task
- Delete Task - Remove a task

### Share Links

- [Create Share Link](./create-share-link.md) - Generate a shareable link for task results
- Get Share Link - Retrieve share link details
- List Share Links - Get all share links
- Revoke Share Link - Invalidate a share link

## SDKs and Libraries

Official SDKs are available for popular programming languages:

- **JavaScript/TypeScript**: `npm install @agentrix/shared`

## Support

For API support and questions:

- GitHub Issues: [github.com/xmz-ai/agentrix/issues](https://github.com/xmz-ai/agentrix/issues)
- Email: api-support@agentrix.xmz.ai
- Documentation: [agentrix.xmz.ai/docs](https://agentrix.xmz.ai/docs)

## Changelog

Track API changes and updates:

- **v1.0.0** (2024-01-01): Initial API release
- Check our [changelog](./changelog.md) for detailed version history
