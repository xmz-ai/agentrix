# CLI Dependency Troubleshooting Guide

This guide shows practical examples of how to troubleshoot and resolve dependency issues when using the Agentrix CLI.

## Scenario 1: First-time Setup on macOS

User installs Agentrix CLI for the first time:

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

## Scenario 2: Linux Setup with Missing Dependencies

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

## Scenario 3: Quick Status Check

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

## Scenario 4: Installing Agent CLIs

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

## Scenario 5: CI/CD Environment Setup

For automated setups, you can script the dependency installation:

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

## Scenario 6: Troubleshooting Missing Git

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

## Scenario 7: Checking Dependency Paths (Verbose Mode)

When running doctor with verbose output, you can see exactly where each tool is installed:

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

## Common Issues and Solutions

### Issue: "ripgrep not found" on macOS

```bash
# Solution 1: Install via Homebrew (recommended)
brew install ripgrep

# Solution 2: Install via MacPorts
sudo port install ripgrep

# Solution 3: Download binary from GitHub
# Visit: https://github.com/BurntSushi/ripgrep/releases
```

### Issue: "bubblewrap not found" on Linux

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

### Issue: Claude/Codex CLI not in PATH

```bash
# Check npm global bin directory
npm config get prefix

# Add to PATH in ~/.bashrc or ~/.zshrc
export PATH="$PATH:$(npm config get prefix)/bin"

# Reload shell config
source ~/.bashrc  # or source ~/.zshrc
```
