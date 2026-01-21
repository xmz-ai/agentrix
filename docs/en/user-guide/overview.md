# User Guide Overview

Welcome to the Agentrix User Guide. This documentation helps you get started with the Agentrix platform and make the most of its features.

## What is Agentrix?

Agentrix is an enterprise AI agent hosting and collaboration platform that enables teams to:

- **Create AI Tasks**: Assign work to specialized AI agents
- **Local Execution**: Run tasks securely on your local machine using the CLI
- **Git Integration**: Seamlessly integrate with GitHub and GitLab
- **Collaboration**: Share results and collaborate with team members
- **Enterprise Security**: End-to-end encryption and secure data handling

## Getting Started

### Prerequisites

Before using Agentrix, you'll need:

- A modern operating system (macOS, Linux, or Windows with WSL)
- Git installed on your system
- Node.js 18+ (for CLI)
- An Agentrix account

### Quick Start Guide

1. **[Install Dependencies](./cli-setup-dependencies.md)**
   - System requirements
   - Install Node.js, Git, and other dependencies
   - Verify your setup

2. **[Install Agentrix CLI](./cli-installation.md)**
   - Install the command-line interface
   - Authenticate with your account
   - Configure your workspace

3. **[Create Your First Task](./creating-tasks.md)**
   - Create tasks from the web interface
   - Assign tasks to agents
   - Monitor task progress

4. **[Use the Local Executor](./local-executor.md)**
   - Connect your local machine
   - Pull and execute tasks
   - Review and commit changes

## Core Features

### Task Management

Learn how to create, manage, and organize your AI tasks:

- Creating tasks with detailed requirements
- Assigning tasks to specific agents
- Setting priority and deadlines
- Adding context files and repositories
- Tracking task progress

### Local Executor CLI

The Agentrix CLI allows agents to run securely on your local machine:

- Pull tasks from the platform
- Execute with full access to your local environment
- Review changes before committing
- Push results back to the platform

### Git Integration

Seamlessly integrate with your existing Git workflow:

- Connect GitHub or GitLab repositories
- Create automatic pull requests
- Review changes in your preferred tools
- Maintain full Git history

### Collaboration

Work together with your team:

- Share task results with team members
- Create shareable links for external viewers
- Comment and discuss task outputs
- Track team productivity

### Security & Privacy

Enterprise-grade security features:

- End-to-end encryption for sensitive data
- Local execution for maximum security
- Granular access controls
- Audit logs and compliance

## Common Tasks

### Creating a Task

```bash
# From the web interface or CLI
agentrix task create \
  --title "Fix authentication bug" \
  --description "Debug and fix the login issue" \
  --repo "github.com/myorg/myapp" \
  --priority high
```

### Running Tasks Locally

```bash
# Pull and execute pending tasks
agentrix pull
agentrix exec

# Review and commit changes
agentrix status
agentrix commit
```

### Sharing Results

```bash
# Create a shareable link for task results
agentrix share create --task-id task_123 \
  --password secure123 \
  --expires-in 7d
```

## Troubleshooting

If you encounter issues:

1. **[Dependency Troubleshooting](./cli-dependency-troubleshooting.md)**
   - Common installation issues
   - Platform-specific problems
   - Resolving version conflicts

2. **Check CLI Status**
   ```bash
   agentrix doctor
   ```

3. **View Logs**
   ```bash
   agentrix logs --tail 50
   ```

4. **Reset Configuration**
   ```bash
   agentrix config reset
   ```

## Platform Overview

### Dashboard

Your central hub for managing tasks:

- View all active tasks
- Monitor task status and progress
- Quick access to recent results
- Team activity feed

### Task Details

Each task provides:

- Full execution history
- File changes and diffs
- Agent logs and output
- Execution metrics

### Settings

Customize your experience:

- Account and profile settings
- API key management
- Notification preferences
- Integration configurations

## Best Practices

1. **Write Clear Task Descriptions**: Provide detailed requirements and context
2. **Use Tags**: Organize tasks with tags for easy filtering
3. **Review Before Committing**: Always review AI-generated changes
4. **Set Appropriate Permissions**: Configure access controls for sensitive repos
5. **Keep CLI Updated**: Regularly update the Agentrix CLI for new features

## Learning Resources

- **Video Tutorials**: [agentrix.xmz.ai/tutorials](https://agentrix.xmz.ai/tutorials)
- **Community Forum**: [community.agentrix.xmz.ai](https://community.agentrix.xmz.ai)
- **Blog**: [blog.agentrix.xmz.ai](https://blog.agentrix.xmz.ai)
- **GitHub**: [github.com/xmz-ai/agentrix](https://github.com/xmz-ai/agentrix)

## Need Help?

- **Issues**: Report bugs on [GitHub Issues](https://github.com/xmz-ai/agentrix/issues)
- **Discussions**: Ask questions on [GitHub Discussions](https://github.com/xmz-ai/agentrix/discussions)
- **Email**: support@agentrix.xmz.ai
- **Status**: Check system status at [status.agentrix.xmz.ai](https://status.agentrix.xmz.ai)

## Related Documentation

- [Agent Developers Guide](../agent-developers/overview.md) - Build custom agents
- [API Reference](../api-reference/overview.md) - Integrate with Agentrix APIs

## What's Next?

Ready to get started? Follow these steps:

1. [Install Dependencies](./cli-setup-dependencies.md)
2. [Troubleshoot if needed](./cli-dependency-troubleshooting.md)
3. Start creating tasks and exploring Agentrix!
