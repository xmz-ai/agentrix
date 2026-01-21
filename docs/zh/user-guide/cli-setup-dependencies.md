# CLI 设置：依赖项

## 概述

Agentrix CLI 需要多个外部依赖项才能正常运行。CLI 包含一个自动依赖项检查器，在启动守护进程之前会验证所有必需的工具是否已安装。

## 检查的依赖项

### CLI 核心依赖

1.  **git**（必需）
    
    *   所有任务所需的版本控制系统
    *   安装：[https://git-scm.com/downloads](https://git-scm.com/downloads)
2.  **claude** (必填)
    
    *   Claude Code CLI 为大多数功能所必需
    *   安装： `npm install -g @anthropic-ai/claude-code`
    *   注意：大多数 Agentrix 功能依赖于 Claude Code
3.  **codex** (可选)
    
    *   仅 Codex 任务需要 Codex CLI
    *   安装： `npm install -g @codex-ai/codex-cli`

### 沙盒依赖项

#### macOS

1.  **ripgrep (rg)** (必需)
    *   沙盒运行时所需的快速代码搜索工具
    *   安装：`brew install ripgrep`

#### Linux

1.  **bubblewrap (bwrap)** (必需)
    
    *   Linux 的沙盒工具
    *   安装：
        *   Debian/Ubuntu: `sudo apt install bubblewrap`
        *   RHEL/CentOS: `sudo yum install bubblewrap`
        *   Arch: `sudo pacman -S bubblewrap`
2.  **socat** (必需)
    
    *   沙盒所需的套接字通信工具
    *   安装：
        *   Debian/Ubuntu: `sudo apt install socat`
        *   RHEL/CentOS: `sudo yum install socat`
        *   架构：`sudo pacman -S socat`

## 使用

### 使用 Doctor 命令检查依赖

```bash
# Full system diagnostics including dependencies
agentrix doctor

# Shows:
# - CLI dependencies (git, claude, codex)
# - Sandbox dependencies (platform-specific)
# - Installation status and paths
# - Installation commands for missing dependencies
```

### 启动时自动检查

```bash
# Start daemon (checks critical dependencies first)
agentrix start

# If critical dependencies are missing:
# - Shows error message with missing dependencies
# - Provides guidance to run 'agentrix doctor'
# - Exits without starting daemon
```