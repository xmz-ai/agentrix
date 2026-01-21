# CLI Setup: Dependencies

## Overview

The Agentrix CLI requires several external dependencies to function properly. The CLI includes an automatic dependency checker that verifies all required tools are installed before starting the daemon.

## Dependencies Checked

### CLI Core Dependencies

1. **git** (Required)
   - Version control system required for all tasks
   - Installation: https://git-scm.com/downloads

2. **claude** (Required)
   - Claude Code CLI required for most features
   - Installation: `npm install -g @anthropic-ai/claude-code`
   - Note: Most Agentrix functionality depends on Claude Code

3. **codex** (Optional)
   - Codex CLI required for Codex tasks only
   - Installation: `npm install -g @codex-ai/codex-cli`

### Sandbox Dependencies

#### macOS
1. **ripgrep (rg)** (Required)
   - Fast code search tool required by sandbox runtime
   - Installation: `brew install ripgrep`

#### Linux
1. **bubblewrap (bwrap)** (Required)
   - Sandboxing tool for Linux
   - Installation:
     - Debian/Ubuntu: `sudo apt install bubblewrap`
     - RHEL/CentOS: `sudo yum install bubblewrap`
     - Arch: `sudo pacman -S bubblewrap`

2. **socat** (Required)
   - Socket communication tool required by sandbox
   - Installation:
     - Debian/Ubuntu: `sudo apt install socat`
     - RHEL/CentOS: `sudo yum install socat`
     - Arch: `sudo pacman -S socat`

## Usage

### Check Dependencies with Doctor Command

```bash
# Full system diagnostics including dependencies
agentrix doctor

# Shows:
# - CLI dependencies (git, claude, codex)
# - Sandbox dependencies (platform-specific)
# - Installation status and paths
# - Installation commands for missing dependencies
```

### Automatic Check on Start

```bash
# Start daemon (checks critical dependencies first)
agentrix start

# If critical dependencies are missing:
# - Shows error message with missing dependencies
# - Provides guidance to run 'agentrix doctor'
# - Exits without starting daemon
```