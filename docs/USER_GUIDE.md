# DeployHQ MCP Server - User Guide

This guide will help you configure and use the DeployHQ MCP Server with Claude Desktop or Claude Code CLI.

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Claude Desktop Configuration](#claude-desktop-configuration)
3. [Claude Code CLI Configuration](#claude-code-cli-configuration)
4. [Example Conversations](#example-conversations)
5. [Troubleshooting](#troubleshooting)

## 🚀 Getting Started

### Quick Comparison: Desktop vs CLI

| Feature | Claude Desktop | Claude Code CLI |
|---------|----------------|-----------------|
| **Interface** | GUI Application | Terminal/Command-line |
| **Config Location** | `~/Library/Application Support/Claude/` | `.claude.json` or `~/.config/claude/` |
| **Configuration Method** | Manual JSON editing | `claude mcp add` command |
| **Session Management** | Restart application | Start new terminal session |
| **Best For** | Visual workflows, drag-and-drop | Automation, scripting, SSH sessions |

### Prerequisites

- **Claude Desktop** (for GUI) or **Claude Code CLI** (for terminal) installed
- **DeployHQ account with API access** (API is **not available** for Solo and Free plans)
- Access to the hosted MCP server at `mcp.deployhq.com` (or your own deployment)

### Getting Your DeployHQ Credentials

1. **Log in to DeployHQ**: Go to https://your-account.deployhq.com
2. **Navigate to Settings**: Click on your account name → Settings
3. **Go to Security**: Click on "Security" in the left sidebar
4. **Copy API Key**: Find your 40-character API key and copy it
5. **Note Your Details**:
   - Username: Your email address
   - Password: Your API key (40 characters)
   - Account: Your account name (the subdomain of your DeployHQ URL)

## ⚙️ Claude Desktop Configuration

### 1. Locate Configuration File

The Claude Desktop MCP configuration is stored in:

**macOS**:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows**:
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux**:
```
~/.config/Claude/claude_desktop_config.json
```

### 2. Edit Configuration

Open the configuration file and add the DeployHQ MCP server:

```json
{
  "mcpServers": {
    "deployhq": {
      "url": "https://mcp.deployhq.com/sse",
      "headers": {
        "X-DeployHQ-Username": "your-email@example.com",
        "X-DeployHQ-Password": "your-40-character-api-key",
        "X-DeployHQ-Account": "your-account-name"
      }
    }
  }
}
```

**Important**:
- Replace the placeholder values with your actual credentials
- Credentials are sent via **secure HTTP headers** (not query strings)
- Headers are only transmitted over HTTPS in production

### 3. Restart Claude Desktop

Close and reopen Claude Desktop for the changes to take effect.

### 4. Verify Connection

In Claude Desktop, you should see the DeployHQ tools available. You can verify by asking:

```
What DeployHQ tools are available?
```

Claude should respond with a list of available tools.

## 🖥️ Claude Code CLI Configuration

Claude Code CLI uses a **different configuration system** than Claude Desktop. Follow these steps if you're using the command-line interface.

### 1. Install Claude Code CLI

If you haven't already:

```bash
npm install -g @anthropic-ai/claude-code
```

Or via Homebrew (macOS):

```bash
brew install claude-code
```

### 2. Add MCP Server

Use the `claude mcp add` command to configure the DeployHQ MCP server:

```bash
claude mcp add deployhq http://localhost:8181/sse \
  --transport sse \
  --header "X-DeployHQ-Username: your-email@example.com" \
  --header "X-DeployHQ-Password: your-40-character-api-key" \
  --header "X-DeployHQ-Account: your-account-name"
```

**For production (hosted server)**:

```bash
claude mcp add deployhq https://mcp.deployhq.com/sse \
  --transport sse \
  --header "X-DeployHQ-Username: your-email@example.com" \
  --header "X-DeployHQ-Password: your-40-character-api-key" \
  --header "X-DeployHQ-Account: your-account-name"
```

**Important**:
- Replace the placeholder values with your actual DeployHQ credentials
- Use `http://localhost:8181/sse` for local development
- Use `https://mcp.deployhq.com/sse` for production
- The `--transport sse` flag specifies Server-Sent Events protocol

> **⚠️ IMPORTANT**: After adding the MCP server, you **must exit and restart** your Claude Code session for the changes to take effect. Type `exit` or press Ctrl+D, then run `claude` again.

### 3. Verify Configuration

Check that the server was added successfully:

```bash
claude mcp list
```

You should see:

```
deployhq: https://mcp.deployhq.com/sse (SSE) - ✓ Connected
```

### 4. Start a New Session

**Important**: The MCP server is only loaded when you start a new Claude Code session. If you added the server while Claude was already running:

1. Exit your current Claude Code session (type `exit` or press Ctrl+D)
2. Start a new session:

```bash
claude
```

### 5. Verify Connection

In your new Claude Code session, ask:

```
What DeployHQ tools are available?
```

Claude should respond with a list of available tools like:
- `list_projects`
- `get_project`
- `list_servers`
- `list_deployments`
- `get_deployment`
- `create_deployment`

### Configuration Scopes

Claude Code CLI supports three configuration scopes:

- **`--scope local`** (default): Project-specific (stored in `.claude.json`)
- **`--scope user`**: User-wide configuration
- **`--scope project`**: Shared project configuration (`.mcp.json`)

Example:

```bash
# Add for all your projects
claude mcp add deployhq https://mcp.deployhq.com/sse \
  --scope user \
  --transport sse \
  --header "X-DeployHQ-Username: your-email@example.com" \
  --header "X-DeployHQ-Password: your-40-character-api-key" \
  --header "X-DeployHQ-Account: your-account-name"
```

### Managing MCP Servers

**Remove a server**:
```bash
claude mcp remove deployhq
```

**View server details**:
```bash
claude mcp get deployhq
```

**Import from Claude Desktop** (macOS/WSL only):
```bash
claude mcp add-from-claude-desktop
```

## 💬 Example Conversations

### Example 1: Listing Projects

**You**: "Can you list all my DeployHQ projects?"

**Claude**: "I'll use the list_projects tool to get your DeployHQ projects."

*Claude will call the tool and show you a formatted list of projects with their details.*

### Example 2: Checking Deployment Status

**You**: "What's the status of the latest deployment for my 'website' project?"

**Claude**: "Let me check the deployments for your website project."

*Claude will:*
1. Call `list_deployments` for the project
2. Show you the latest deployment status
3. Include timestamps and deployment details

### Example 3: Creating a Deployment

**You**: "Deploy the latest changes from the main branch to production for my website project"

**Claude**: "I'll help you create a deployment. First, let me get the server information for your website project."

*Claude will:*
1. Call `list_servers` to find the production server
2. Ask you to confirm the deployment details
3. Call `create_deployment` with the appropriate parameters
4. Show you the deployment status

### Example 4: Investigating Failed Deployment

**You**: "Why did my last deployment fail?"

**Claude**: "Let me check your recent deployments to see what went wrong."

*Claude will:*
1. Call `list_deployments` to find recent deployments
2. Call `get_deployment` with the failed deployment UUID
3. Analyze the logs and error messages
4. Explain what caused the failure

## 🔍 Advanced Usage

### Filtering Deployments by Server

**You**: "Show me all deployments to the staging server for my API project"

*Claude will use the `server_uuid` parameter to filter deployments.*

### Paginating Through Results

**You**: "Show me page 2 of deployments for my website project"

*Claude will use the `page` parameter to get additional results.*

### Preview Deployments

**You**: "Preview what would be deployed if I deployed my feature branch to staging"

*Claude will use `mode: "preview"` when creating the deployment.*

## 🐛 Troubleshooting

### Common Issues (Both Claude Desktop & CLI)

### Issue: "Authentication failed"

**Possible Causes**:
- Incorrect username (email) or API key
- API key has been revoked or expired

**Solution**:
1. Verify your credentials in DeployHQ Settings → Security
2. Update `claude_desktop_config.json` with correct credentials
3. Restart Claude Desktop

### Issue: "Connection timeout"

**Possible Causes**:
- MCP server is down
- Network connectivity issues
- Firewall blocking the connection

**Solution**:
1. Check server status at `https://mcp.deployhq.com/health`
2. Verify your internet connection
3. Check firewall settings

### Issue: "Tool not found"

**Possible Causes**:
- Claude Desktop hasn't loaded the MCP configuration
- Configuration file has syntax errors

**Solution**:
1. Verify JSON syntax in `claude_desktop_config.json`
2. Ensure no trailing commas or syntax errors
3. Restart Claude Desktop
4. Check Claude Desktop logs for errors

### Issue: "Invalid project permalink"

**Possible Causes**:
- Project doesn't exist
- Incorrect project name or permalink

**Solution**:
1. Ask Claude to list all projects first
2. Use the exact permalink from the list
3. Verify the project exists in DeployHQ dashboard

### Issue: "Server UUID not found"

**Possible Causes**:
- Server doesn't exist for the project
- Incorrect server identifier

**Solution**:
1. Ask Claude to list servers for the project first
2. Use the `identifier` field from the server list
3. Verify the server exists in DeployHQ project settings

### Claude Code CLI Specific Issues

### Issue: "No MCP servers configured" or tools not available

**Possible Causes**:
- MCP server not added to Claude Code CLI configuration
- Using Claude Desktop configuration instead of CLI configuration
- MCP server added after session started

**Solution**:
1. Add the MCP server using the CLI command:
   ```bash
   claude mcp add deployhq https://mcp.deployhq.com/sse \
     --transport sse \
     --header "X-DeployHQ-Username: your-email@example.com" \
     --header "X-DeployHQ-Password: your-api-key" \
     --header "X-DeployHQ-Account: your-account"
   ```
2. **Exit and restart** your Claude Code session (important!)
3. Verify with `claude mcp list`

### Issue: "Failed to connect" in `claude mcp list`

**Possible Causes**:
- Local MCP server not running (if using localhost)
- Incorrect URL or port
- Network connectivity issues

**Solution**:

**For local development**:
1. Check if the server is running:
   ```bash
   curl http://localhost:8181/health
   ```
2. If not running, start the server:
   ```bash
   cd /path/to/deployhq-mcp-server
   npm run dev
   ```
3. Verify the port matches your configuration (8181 by default)

**For production**:
1. Check server health:
   ```bash
   curl https://mcp.deployhq.com/health
   ```
2. Verify your internet connection
3. Check if the URL is correct (https, not http)

### Issue: Configuration changes not taking effect

**Possible Causes**:
- MCP servers are only loaded at session start
- Configuration cached from previous session

**Solution**:
1. **Exit Claude Code completely** (type `exit` or Ctrl+D)
2. Start a new session: `claude`
3. MCP servers will be reloaded from configuration

### Issue: Different configuration than Claude Desktop

**Explanation**:
- Claude Desktop uses: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Claude Code CLI uses: `.claude.json` (local), `~/.config/claude/config.json` (user), or `.mcp.json` (project)

**Solution**:
- Configure each tool separately, OR
- Use `claude mcp add-from-claude-desktop` to import Desktop config (macOS/WSL only)

## 📊 Understanding Response Data

### Project Response

```json
{
  "name": "My Website",
  "permalink": "my-website",
  "zone": "us_east",
  "repository": {
    "scm_type": "git",
    "url": "git@github.com:user/repo.git",
    "branch": "main",
    "hosting_service": "github"
  },
  "last_deployed_at": "2024-01-15T10:30:00Z"
}
```

### Server Response

```json
{
  "identifier": "abc123-def456",
  "name": "Production Server",
  "protocol_type": "sftp",
  "server_path": "/var/www/html",
  "hostname": "server.example.com",
  "username": "deploy",
  "automatic_deployment": true
}
```

### Deployment Response

```json
{
  "identifier": "xyz789-abc123",
  "status": "completed",
  "start_revision": "abc123",
  "end_revision": "def456",
  "branch": "main",
  "created_at": "2024-01-15T10:00:00Z",
  "completed_at": "2024-01-15T10:05:00Z"
}
```

## 🔒 Security Best Practices

1. **Protect Your Credentials**:
   - Never share your API key
   - Use environment variables, not hardcoded values
   - Rotate API keys periodically

2. **Limit Permissions**:
   - Create a dedicated DeployHQ user for API access
   - Grant only necessary permissions
   - Use separate credentials for different environments

3. **Monitor Usage**:
   - Regularly check deployment logs
   - Review API usage in DeployHQ
   - Set up alerts for suspicious activity

4. **Secure Your Configuration**:
   - Protect `claude_desktop_config.json` file permissions
   - Don't commit configuration files to version control
   - Use encrypted storage for sensitive data

## 💡 Tips and Tricks

### Tip 1: Use Natural Language

You don't need to know the exact tool names. Just ask naturally:
- "Show me my projects" → Claude will use `list_projects`
- "Deploy my site" → Claude will guide you through `create_deployment`

### Tip 2: Ask for Explanations

Claude can explain deployment status and logs:
- "Why did this fail?"
- "What files were changed in this deployment?"
- "Is this deployment safe to run?"

### Tip 3: Batch Operations

Ask Claude to perform multiple operations:
- "Check all my projects and tell me which ones haven't been deployed recently"
- "Show me all failed deployments from the last week"

### Tip 4: Get Recommendations

Claude can provide deployment advice:
- "Should I deploy this to production?"
- "What's the best way to deploy this feature?"
- "How can I prevent deployment failures?"

## 📞 Getting Help

If you encounter issues:

1. **Check this guide** for common solutions
2. **Review server logs** at Digital Ocean dashboard
3. **Verify API status** at DeployHQ
4. **Open an issue** on GitHub: [your-repo-url/issues]

## 🔄 Updates and Maintenance

The MCP server is updated regularly. Updates are deployed automatically on Digital Ocean App Platform when changes are pushed to the main branch.

**Staying Updated**:
- Watch the GitHub repository for updates
- Check the changelog for new features
- Update your configuration if new environment variables are added

## 📚 Additional Resources

- **DeployHQ API Documentation**: https://www.deployhq.com/support/api
- **MCP Specification**: https://modelcontextprotocol.io
- **Claude Desktop**: https://claude.ai/desktop
- **Digital Ocean Docs**: https://docs.digitalocean.com/products/app-platform/

---

**Questions or feedback?** Open an issue on GitHub or contact support.
