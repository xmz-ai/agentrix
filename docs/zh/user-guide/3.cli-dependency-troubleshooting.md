# CLI 依赖问题排查指南

本指南展示了在使用 Agentrix CLI 时如何排查和解决依赖问题的实际案例。

## 场景 1：macOS 首次设置

用户首次安装 Agentrix CLI：

```bash
# Install Agentrix CLI
npm install -g @agentrix/cli

# Try to start the daemon
$ agentrix start

⚠️  Missing Critical Dependencies
Cannot start daemon. Missing: ripgrep

Run "agentrix doctor" for detailed dependency information and installation instructions.

# Check what's missing
$ agentrix doctor

🩺 Agentrix CLI Doctor

📋 Basic Information
Agentrix CLI Version: 0.0.13
Platform: darwin arm64
Node.js Version: v20.10.0

🔧 Daemon Spawn Diagnostics
Project Root: /usr/local/lib/node_modules/@agentrix/cli
Wrapper Script: /usr/local/lib/node_modules/@agentrix/cli/bin/agentrix.mjs
CLI Entrypoint: /usr/local/lib/node_modules/@agentrix/cli/dist/index.mjs
Wrapper Exists: ✓ Yes
CLI Exists: ✓ Yes

⚙️  Configuration
Agentrix Home: /Users/alex/.agentrix
Server URL: https://agentrix.xmz.ai
Logs Dir: /Users/alex/.agentrix/logs

🌍 Environment Variables
AGENTRIX_HOME_DIR: not set
AGENTRIX_SERVER_URL: not set
DANGEROUSLY_LOG_TO_SERVER: not set
DEBUG: not set
NODE_ENV: not set

🔐 Authentication
✓ Authenticated (credentials found)

🔧 CLI Dependencies
✓ git - Version control system (required for all tasks)
  Location: /usr/bin/git
❌ claude - Claude Code CLI (required for most features)
  Install: npm install -g @anthropic-ai/claude-code
⚠️  codex - Codex CLI (optional, for Codex tasks)
  Install: npm install -g @codex-ai/codex-cli

🔒 Sandbox Dependencies
Platform: macos
❌ ripgrep - Fast code search tool (required by sandbox)
  Install: brew install ripgrep

⚠️  Missing Required Dependencies
  • claude
  • ripgrep

Please install missing dependencies before starting the daemon.

# Install Claude CLI
$ npm install -g @anthropic-ai/claude-code

# Install ripgrep
$ brew install ripgrep

# Now start the daemon
$ agentrix start
Starting Agentrix background service...
✓ Daemon started successfully

🤖 Daemon Status
✓ Daemon is running
  PID: 12345
  Started: 12/12/2025, 10:30:00 AM
  CLI Version: 0.0.13
  HTTP Port: 51234
```

## 场景 2：缺少依赖的 Linux 设置

```bash
$ agentrix doctor

🔧 CLI Dependencies
✓ git - Version control system (required for all tasks)
  Location: /usr/bin/git
❌ claude - Claude Code CLI (required for most features)
  Install: npm install -g @anthropic-ai/claude-code
⚠️  codex - Codex CLI (optional, for Codex tasks)
  Install: npm install -g @codex-ai/codex-cli

🔒 Sandbox Dependencies
Platform: linux
❌ bubblewrap - Sandboxing tool for Linux
  Install: sudo apt install bubblewrap  # Debian/Ubuntu
          sudo yum install bubblewrap     # RHEL/CentOS
❌ socat - Socket communication tool (required by sandbox)
  Install: sudo apt install socat  # Debian/Ubuntu

⚠️  Missing Required Dependencies
  • claude
  • bubblewrap
  • socat

Please install missing dependencies before starting the daemon.

# Install dependencies on Ubuntu/Debian
$ sudo apt update && sudo apt install bubblewrap socat

# Install Claude CLI (required)
$ npm install -g @anthropic-ai/claude-code

# Verify everything is installed
$ agentrix doctor

🔧 CLI Dependencies
✓ git - Version control system (required for all tasks)
✓ claude - Claude Code CLI (required for most features)
⚠️  codex - Codex CLI (optional, for Codex tasks)

🔒 Sandbox Dependencies
Platform: linux
✓ bubblewrap - Sandboxing tool for Linux
✓ socat - Socket communication tool (required by sandbox)

✓ All required dependencies are installed
```

## 场景3：快速状态检查

```bash
# Quick check if everything is ready
$ agentrix status

🤖 Daemon Status
✓ Daemon is running
  PID: 12345
  Started: 12/12/2025, 10:30:00 AM
  CLI Version: 0.0.13
  HTTP Port: 51234

🔐 Authentication
✓ Authenticated
  Machine ID: mch_abc123
  User: alex@example.com
```

## 场景 4：安装代理 CLI

```bash
# Check current setup
$ agentrix doctor

🔧 CLI Dependencies
✓ git - Version control system (required for all tasks)
❌ claude - Claude Code CLI (required for most features)
  Install: npm install -g @anthropic-ai/claude-code
⚠️  codex - Codex CLI (optional, for Codex tasks)
  Install: npm install -g @codex-ai/codex-cli

# Install Claude CLI (required)
$ npm install -g @anthropic-ai/claude-code

# Install Codex CLI (optional)
$ npm install -g @codex-ai/codex-cli

# Verify both are now available
$ agentrix doctor

🔧 CLI Dependencies
✓ git - Version control system (required for all tasks)
✓ claude - Claude Code CLI (required for most features)
  Location: /usr/local/bin/claude
✓ codex - Codex CLI (optional, for Codex tasks)
  Location: /usr/local/bin/codex
```

## 场景 5：CI/CD 环境设置

对于自动化设置，您可以编写脚本来安装依赖项：

```bash
#!/bin/bash
# setup-agentrix.sh

set -e

echo "Installing Agentrix dependencies..."

# Install git if not present
if ! command -v git &> /dev/null; then
    echo "Installing git..."
    sudo apt-get update && sudo apt-get install -y git
fi

# Install sandbox dependencies (Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Installing Linux sandbox dependencies..."
    sudo apt-get install -y bubblewrap socat
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Installing macOS sandbox dependencies..."
    brew install ripgrep
fi

# Install agent CLIs
echo "Installing agent CLIs..."
npm install -g @anthropic-ai/claude-code
npm install -g @codex-ai/codex-cli

# Verify installation
echo "Verifying setup..."
agentrix doctor

echo "Setup complete!"
```

## 场景 6：解决 Git 缺失问题

```bash
$ agentrix start

⚠️  Missing Critical Dependencies
Cannot start daemon. Missing: git

Run "agentrix doctor" for detailed dependency information and installation instructions.

$ agentrix doctor

🔧 CLI Dependencies
❌ git - Version control system (required for all tasks)
  Install: https://git-scm.com/downloads

# Visit the URL and install git, then verify
$ which git
/usr/local/bin/git

$ agentrix start
Starting Agentrix background service...
✓ Daemon started successfully
```

## 场景7：检查依赖路径（详细模式）

当以详细输出运行 doctor 时，您可以确切地看到每个工具的安装位置：

```bash
$ agentrix doctor

# Shows detailed paths for all installed dependencies
🔧 CLI Dependencies
✓ git - Version control system (required for all tasks)
  Location: /usr/bin/git
✓ claude - Claude Code CLI (required for most features)
  Location: /Users/alex/.bun/bin/claude
✓ codex - Codex CLI (optional, for Codex tasks)
  Location: /usr/local/bin/codex

🔒 Sandbox Dependencies
Platform: macos
✓ ripgrep - Fast code search tool (required by sandbox)
  Location: /usr/local/bin/rg
```

## 常见问题和解决方案

### 问题：macOS 上找不到"ripgrep"

```bash
# Solution 1: Install via Homebrew (recommended)
brew install ripgrep

# Solution 2: Install via MacPorts
sudo port install ripgrep

# Solution 3: Download binary from GitHub
# Visit: https://github.com/BurntSushi/ripgrep/releases
```

### 问题：Linux 上找不到"bubblewrap"

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install bubblewrap

# RHEL/CentOS/Fedora
sudo yum install bubblewrap
# or
sudo dnf install bubblewrap

# Arch Linux
sudo pacman -S bubblewrap
```

### 问题：Claude/Codex CLI 不在 PATH 中

```bash
# Check npm global bin directory
npm config get prefix

# Add to PATH in ~/.bashrc or ~/.zshrc
export PATH="$PATH:$(npm config get prefix)/bin"

# Reload shell config
source ~/.bashrc  # or source ~/.zshrc
```