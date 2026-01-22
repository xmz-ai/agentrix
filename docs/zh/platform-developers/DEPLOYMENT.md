# Agentrix 部署指南

本指南介绍如何在本地环境中启动和管理 Agentrix 所有服务。

## 📋 系统要求

- **Nginx**: 用于反向代理 (macOS: `brew install nginx`)
- **Node.js** (>= 20.0.0) 和 **Yarn**: 用于运行 App 和 CLI
- **macOS/Linux**: 脚本使用 Bash shell

### 环境依赖服务 (二选一)

**原生模式 (推荐用于生产)**:
- **PostgreSQL** (>= 16): `brew install postgresql@18`
- **Redis** (>= 7): `brew install redis`
- **MinIO**: `brew install minio/stable/minio minio/stable/mc`

**Docker 模式 (可选)**:
- **Docker** 和 **docker-compose**: 用于容器化运行

## 🚀 快速开始

### 1. 初始化启动所有服务

首次启动或完全停止后重新启动所有服务：

```bash
./start.sh
```

这个脚本会按顺序启动：
1. **环境依赖服务** (原生模式) - PostgreSQL, Redis, MinIO
2. **API 服务** - 后端 API 服务器
3. **App 服务** (Expo) - React Native 开发服务器
4. **CLI 服务** (Dev) - CLI 开发模式
5. **Nginx** - 反向代理服务器

启动完成后，您可以通过以下地址访问：
- **主入口 (Nginx)**: http://localhost
- **API 直接访问**: http://localhost:3000
- **App 直接访问**: http://localhost:8081
- **Console 管理**: http://localhost/console

### 2. 停止所有服务

```bash
./stop.sh
```

这个脚本会按顺序停止所有服务（Nginx → App → CLI → API）。

### 3. 重新编译并重启服务

当您修改了代码并需要重新编译后重启服务时：

```bash
./restart.sh
```

这个脚本会：
1. **API**: 使用 `docker.sh rebuild` 重新构建 Docker 镜像并重启容器
2. **App**: 清除缓存并重启 Expo 开发服务器
3. **CLI**: 重新编译 TypeScript 并重启开发服务器

## 📁 服务架构

### Nginx 反向代理配置

Nginx 监听 80 端口，根据路径转发请求：
- `/v1/*` → API 服务 (localhost:3000)
- `/console/*` → API 服务 (localhost:3000)
- 其他所有路径 → App 服务 (localhost:8081)

配置文件位于: `nginx.conf`

### 服务端口分配

| 服务 | 端口 | 说明 |
|-----|-----|-----|
| Nginx | 80 | 反向代理入口 |
| API | 3000 | Fastify 后端服务 + WebSocket |
| App | 8081 | Expo 开发服务器 |
| CLI | N/A | 后台运行，无 HTTP 端口 |

### 日志文件

所有服务的日志文件存储在 `logs/` 目录：
- **API 日志**: `cd api && ./docker.sh logs`
- **App 日志**: `tail -f logs/app.log`
- **CLI 日志**: `tail -f logs/cli.log`

App 和 CLI 的 PID 文件也存储在 `logs/` 目录：
- `logs/app.pid`
- `logs/cli.pid`

## 🛠️ 单独管理服务

### API 服务

进入 `api/` 目录使用管理脚本：

```bash
cd api

# ============ 环境依赖服务 (原生模式) ============

# 启动环境依赖（PostgreSQL, Redis, MinIO）
./docker.sh start env
# 或直接运行
./env-start.sh

# 停止环境依赖
./docker.sh stop env
# 或直接运行
./env-stop.sh

# ============ API 服务 ============

# 启动所有服务（包括 API）
./docker.sh start

# 重启 API 服务
./docker.sh restart

# 重新编译并重启 API
./docker.sh rebuild

# 停止 API 服务
./docker.sh stop

# ============ 其他操作 ============

# 查看日志
./docker.sh logs        # 所有服务
./docker.sh logs api    # 仅 API

# 查看状态
./docker.sh status

# 运行数据库迁移
./docker.sh migrate

# 打开管理控制台
./docker.sh console
```

**原生模式数据目录**: `~/.agentrix/data/`
- PostgreSQL 数据: `~/.agentrix/data/postgres/`
- Redis 数据: `~/.agentrix/data/redis/`
- MinIO 数据: `~/.agentrix/data/minio/`
- 日志文件: `~/.agentrix/data/*.log`

详细文档: `api/CLAUDE.md`

### App 服务 (Expo)

进入 `app/` 目录：

```bash
cd app

# 启动开发服务器
yarn start

# 连接本地 API 服务器
yarn start:local-server

# 类型检查（必须在提交前运行）
yarn typecheck

# 运行测试
yarn test

# iOS 模拟器
yarn ios

# Android 模拟器
yarn android

# Web 浏览器
yarn web
```

详细文档: `app/CLAUDE.md`

### CLI 服务

进入 `cli/` 目录：

```bash
cd cli

# 开发模式
yarn dev

# 构建
yarn build

# 运行已构建的二进制文件
yarn start

# 类型检查
yarn typecheck

# 运行测试
yarn test

# 守护进程管理
./bin/agentrix.mjs daemon start
./bin/agentrix.mjs daemon stop
./bin/agentrix.mjs daemon status
./bin/agentrix.mjs daemon logs
```

详细文档: `cli/CLAUDE.md`

## 🔧 故障排除

### Nginx 无法启动

如果 Nginx 无法启动，可能是端口 80 已被占用：

```bash
# 查看占用 80 端口的进程
sudo lsof -i :80

# 停止现有的 Nginx
sudo nginx -s stop

# 或者杀死占用端口的进程
sudo kill -9 <PID>
```

### API 服务启动失败

检查 Docker 服务是否运行：

```bash
docker ps
```

查看 API 日志：

```bash
cd api && ./docker.sh logs api
```

### App 或 CLI 端口被占用

如果端口 8081 被占用：

```bash
# 查看并杀死占用 8081 的进程
lsof -ti:8081 | xargs kill -9
```

### 查看所有进程状态

```bash
# 查看 API 容器
docker ps

# 查看 App 进程
cat logs/app.pid && ps aux | grep $(cat logs/app.pid)

# 查看 CLI 进程
cat logs/cli.pid && ps aux | grep $(cat logs/cli.pid)

# 查看 Nginx
ps aux | grep nginx
```

## 📚 相关文档

- 根目录总览: `CLAUDE.md`
- API 文档: `api/README.md`, `api/CLAUDE.md`
- App 文档: `app/CLAUDE.md`
- CLI 文档: `cli/CLAUDE.md`
- Shared 类型: `shared/`

## 🔐 环境配置

### API 环境变量

API 需要 `.env.dev` 文件，参考 `api/QUICKSTART.md` 进行配置。

必需的环境变量：
- `DATABASE_URL`: PostgreSQL 连接字符串
- `JWT_SECRET`: JWT 签名密钥
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: GitHub OAuth
- `REDIS_URL`: Redis 连接（可选，默认 localhost）
- `ADMIN_API_KEY`: 管理控制台密钥

### App 环境变量

App 可以使用环境变量配置 API 服务器地址：
- `EXPO_PUBLIC_HAPPY_SERVER_URL`: API 服务器 URL（默认: `https://api.cluster-fluster.com`）

本地开发时使用 `yarn start:local-server` 自动配置为 `http://localhost:3000`。

### CLI 环境变量

CLI 使用以下环境变量：
- `AGENTRIX_SERVER_URL`: 后端 URL（默认: `https://agentrix.xmz.ai`）
- `AGENTRIX_HOME_DIR`: 数据目录（默认: `~/.agentrix`）

## 🎯 开发工作流

### 日常开发

1. 启动所有服务: `./start.sh`
2. 修改代码（API/App/CLI）
3. 测试更改
4. 需要重启时: `./restart.sh`
5. 完成后停止: `./stop.sh`

### 仅修改前端 (App)

```bash
# App 支持热重载，无需重启
cd app
yarn start
# 修改代码，保存后自动刷新
```

### 仅修改后端 (API)

```bash
cd api
./docker.sh rebuild  # 重新构建并重启 API
```

### 仅修改 CLI

```bash
cd cli
yarn build  # 重新构建
# CLI 在开发模式下支持热重载 (yarn dev)
```

### 提交前检查

```bash
# App 类型检查（必须通过）
cd app && yarn typecheck

# CLI 类型检查（必须通过）
cd cli && yarn typecheck

# API 类型检查（必须通过）
cd api && yarn build
```

## 📦 依赖安装

初次克隆仓库后，安装所有依赖：

```bash
# 根目录（安装所有 workspace 依赖）
yarn install

# API 依赖（包含 Prisma 生成）
cd api && yarn install

# App 依赖
cd app && yarn install

# CLI 依赖
cd cli && yarn install
```

## 🚢 生产部署

生产环境部署建议：

### 环境依赖服务

**推荐：原生模式部署** (高性能、低开销)

```bash
cd api

# 安装依赖 (macOS)
brew install postgresql@18 redis minio/stable/minio minio/stable/mc

# 启动服务
./env-start.sh

# 停止服务
./env-stop.sh
```

数据目录默认为 `~/.agentrix/data/`，可通过 `DATA_DIR` 环境变量自定义。

**可选：Docker 模式部署**

```bash
cd api
./env-setup.sh docker
```

### 其他服务

- **API**: 使用 `yarn build && yarn start` 或 Docker
- **App**: 使用 EAS Build 构建原生应用，或部署为 Web 应用
- **CLI**: 发布到 npm (`agentrix-cli` 包)
- **Nginx**: 使用生产级配置，启用 HTTPS 和缓存

详细的生产部署文档请参考各服务的 README。
