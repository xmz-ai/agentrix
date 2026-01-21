# API 参考概述

欢迎来到 Agentrix API 参考文档。本节提供了关于集成 Agentrix API 的全面信息。

## 简介

Agentrix 提供了一个 RESTful API，使开发者能够以编程方式与平台交互。您可以创建任务、管理分享链接，并将 Agentrix 功能集成到您的应用程序中。

## 基础 URL

```
https://api.agentrix.xmz.ai/v1
```

## 认证

所有 API 请求都需要使用 API 密钥进行认证。在请求头中包含您的 API 密钥：

```bash
Authorization: Bearer YOUR_API_KEY
```

### 获取您的 API 密钥

1.  登录 Agentrix 平台
2.  导航至设置 > API 密钥
3.  生成新的 API 密钥
4.  安全存储它 - 它只会显示一次

## 请求格式

所有 POST 和 PUT 请求应使用 JSON 格式，并带有适当的 `Content-Type` 头部：

```bash
Content-Type: application/json
```

## 响应格式

所有 API 响应均以 JSON 格式返回，并具有以下结构：

### 成功响应

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### 错误响应

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

## HTTP 状态码

| 状态码 | 描述 |
| --- | --- |
| 200 | 成功 - 请求已成功完成 |
| 201 | 已创建 - 资源已成功创建 |
| 400 | 错误请求 - 无效的请求参数 |
| 401 | 未授权 - API 密钥无效或缺失 |
| 403 | 禁止 - 权限不足 |
| 404 | 未找到 - 资源不存在 |
| 429 | 请求过多 - 超出速率限制 |
| 500 | 内部服务器错误 - 服务器错误 |

## 可用端点

### 任务

*   [创建任务](./create-task.md) \- 使用 AI 代理创建新任务
*   获取任务 - 检索任务详情
*   列出任务 - 获取您账户的所有任务
*   更新任务 - 修改现有任务
*   删除任务 - 移除任务

### 分享链接

*   [创建分享链接](./create-share-link.md) \- 为任务结果生成可分享的链接
*   获取分享链接 - 检索分享链接详情
*   列出分享链接 - 获取所有分享链接
*   撤销分享链接 - 使分享链接失效

## SDKs 和库

为流行编程语言提供官方 SDK：

*   **JavaScript/TypeScript**: `npm install @agentrix/shared`

## 支持

关于 API 支持和问题：

*   GitHub 问题： [github.com/xmz-ai/agentrix/issues](https://github.com/xmz-ai/agentrix/issues)
*   电子邮件： [api-support@agentrix.xmz.ai](mailto:api-support@agentrix.xmz.ai)
*   文档：[agentrix.xmz.ai/docs](https://agentrix.xmz.ai/docs)

## 变更日志

跟踪 API 变更和更新：

*   **v1.0.0** (2024-01-01)：初始 API 发布
*   查看我们的[变更日志](./changelog.md)以获取详细的版本历史