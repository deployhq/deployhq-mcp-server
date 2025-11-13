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
| **Configuration Method** | Manual JSON editing | Manual JSON editing |
| **Transport** | stdio (local process) | stdio (local process) |
| **Session Management** | Restart application | Start new terminal session |
| **Best For** | Visual workflows, drag-and-drop | Automation, scripting, SSH sessions |

### Prerequisites

- **Claude Desktop** (for GUI) or **Claude Code CLI** (for terminal) installed
- DeployHQ account with API access
- Node.js 18 or higher installed (Node 20+ recommended)
- For development: Git and npm/npx

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

**Note**: Claude Desktop requires manual JSON configuration. The `claude mcp add` CLI command is only available for Claude Code CLI.

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

### 2. Choose Your Setup Method

You have two options depending on your use case:

#### Option A: Using the Published npm Package (Recommended for Users)

Open the configuration file and add the DeployHQ MCP server:

```json
{
  "mcpServers": {
    "deployhq": {
      "command": "npx",
      "args": ["-y", "deployhq-mcp-server"],
      "env": {
        "DEPLOYHQ_EMAIL": "your-email@example.com",
        "DEPLOYHQ_API_KEY": "your-40-character-api-key",
        "DEPLOYHQ_ACCOUNT": "your-account-name"
      }
    }
  }
}
```

**Important**:
- Replace the placeholder values with your actual credentials
- The `-y` flag auto-confirms package installation
- Credentials are passed as environment variables (secure and local)
- No separate installation needed - `npx` handles it automatically

#### Option B: Using Local Development Build (For Contributors)

If you're developing or testing local changes:

```json
{
  "mcpServers": {
    "deployhq-local": {
      "command": "node",
      "args": ["/absolute/path/to/deployhq-mcp-server/dist/stdio.js"],
      "env": {
        "DEPLOYHQ_EMAIL": "your-email@example.com",
        "DEPLOYHQ_API_KEY": "your-40-character-api-key",
        "DEPLOYHQ_ACCOUNT": "your-account-name"
      }
    }
  }
}
```

**Setup Steps**:
1. Clone the repository: `git clone https://github.com/your-repo/deployhq-mcp-server.git`
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Use the **absolute path** to `dist/stdio.js` in your config
5. Replace the placeholder credentials with your actual values

**Development Workflow**:
- After code changes, run `npm run build` to recompile
- Restart Claude Desktop to load the updated code
- Use `npm run dev` for watch mode (for hosted server testing only)

### 3. Restart Claude Desktop

Close and reopen Claude Desktop for the changes to take effect.

### 4. Verify Connection

In Claude Desktop, you should see the DeployHQ tools available. You can verify by asking:

```
What DeployHQ tools are available?
```

Claude should respond with a list of available tools.

## 🖥️ Claude Code CLI Configuration

Claude Code CLI supports two configuration approaches: the `claude mcp add` command (easier) or manual JSON editing (more control).

**Quick Comparison**:

| Feature | `claude mcp add` Command | Manual JSON Editing |
|---------|--------------------------|---------------------|
| **Ease of Use** | ✅ Easiest (one command) | Requires file editing |
| **Error Checking** | ✅ Built-in validation | Manual validation needed |
| **Management** | ✅ Easy with CLI commands | Manual file edits |
| **Best For** | Quick setup, beginners | Advanced users, automation |

### 1. Choose Your Configuration Approach

#### Approach A: Using `claude mcp add` Command (Recommended)

This is the easiest way to configure the MCP server for Claude Code CLI.

**Using the Published npm Package**:

```bash
claude mcp add deployhq npx -- -y deployhq-mcp-server \
  --env DEPLOYHQ_EMAIL=your-email@example.com \
  --env DEPLOYHQ_API_KEY=your-40-character-api-key \
  --env DEPLOYHQ_ACCOUNT=your-account-name
```

**Using Local Development Build**:

```bash
claude mcp add deployhq-local node -- /absolute/path/to/deployhq-mcp-server/dist/stdio.js \
  --env DEPLOYHQ_EMAIL=your-email@example.com \
  --env DEPLOYHQ_API_KEY=your-40-character-api-key \
  --env DEPLOYHQ_ACCOUNT=your-account-name
```

**Important Notes**:
- The `--` separator is required before command arguments (`-y` for npx, or the path for node)
- Add `--scope user` to configure for all your projects (default is local)
- Add `--scope project` for shared team configuration
- Replace placeholder credentials with your actual values
- For local development, use the absolute path to `dist/stdio.js`

**Verify the configuration**:
```bash
claude mcp list
```

You should see your server listed with a checkmark indicating it's configured correctly.

**What this creates**: The `claude mcp add` command automatically creates the appropriate JSON configuration in your config file, equivalent to the manual JSON approach below.

#### Approach B: Manual JSON Configuration

If you prefer manual configuration, need more control, or want to understand what the CLI command creates:

**Locate Configuration File**:

**Local (project-specific)**:
```
.claude.json (in your project directory)
```

**User-wide**:
```
~/.config/claude/config.json
```

**Option A: Using the Published npm Package (Recommended for Users)**

Edit your configuration file and add:

```json
{
  "mcpServers": {
    "deployhq": {
      "command": "npx",
      "args": ["-y", "deployhq-mcp-server"],
      "env": {
        "DEPLOYHQ_EMAIL": "your-email@example.com",
        "DEPLOYHQ_API_KEY": "your-40-character-api-key",
        "DEPLOYHQ_ACCOUNT": "your-account-name"
      }
    }
  }
}
```

**Important**:
- Replace the placeholder values with your actual credentials
- The `-y` flag auto-confirms package installation
- Credentials are passed as environment variables (secure and local)
- No separate installation needed - `npx` handles it automatically

#### Option B: Using Local Development Build (For Contributors)

If you're developing or testing local changes:

```json
{
  "mcpServers": {
    "deployhq-local": {
      "command": "node",
      "args": ["/absolute/path/to/deployhq-mcp-server/dist/stdio.js"],
      "env": {
        "DEPLOYHQ_EMAIL": "your-email@example.com",
        "DEPLOYHQ_API_KEY": "your-40-character-api-key",
        "DEPLOYHQ_ACCOUNT": "your-account-name"
      }
    }
  }
}
```

**Setup Steps**:
1. Clone the repository: `git clone https://github.com/your-repo/deployhq-mcp-server.git`
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Use the **absolute path** to `dist/stdio.js` in your config
5. Replace the placeholder credentials with your actual values

**Development Workflow**:
- After code changes, run `npm run build` to recompile
- Start a new Claude Code session to load the updated code
- Test with environment variables: `DEPLOYHQ_EMAIL=email DEPLOYHQ_API_KEY=pass DEPLOYHQ_ACCOUNT=account node dist/stdio.js`

### 2. Managing MCP Servers (CLI Command Approach)

If you used `claude mcp add`, you can manage servers with these commands:

**List configured servers**:
```bash
claude mcp list
```

**View server details**:
```bash
claude mcp get deployhq
```

**Remove a server**:
```bash
claude mcp remove deployhq
```

**Update configuration** (re-add with new credentials):
```bash
claude mcp remove deployhq
claude mcp add deployhq npx -- -y deployhq-mcp-server \
  --env DEPLOYHQ_EMAIL=new-email@example.com \
  --env DEPLOYHQ_API_KEY=new-api-key \
  --env DEPLOYHQ_ACCOUNT=new-account
```

### 3. Start a New Session

**Important**: The MCP server is only loaded when you start a new Claude Code session.

1. Exit your current Claude Code session (type `exit` or press Ctrl+D) if running
2. Start a new session:

```bash
claude
```

### 4. Verify Connection

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

You can configure the MCP server at different scopes:

**Using `claude mcp add` command**:
- Default: `--scope local` (stored in `.claude.json`)
- User-wide: `--scope user` (stored in `~/.config/claude/config.json`)
- Shared: `--scope project` (stored in `.mcp.json`)

**Using manual JSON editing**:
- **Local**: Edit `.claude.json` in your project directory (project-specific)
- **User**: Edit `~/.config/claude/config.json` (applies to all projects)

Choose the scope that best fits your needs. For most users, `--scope user` or user-wide configuration is recommended.

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
- Environment variables not set correctly

**Solution**:
1. Verify your credentials in DeployHQ Settings → Security
2. Check environment variables in your config file's `env` section
3. Ensure no extra spaces or quotes around credential values
4. Restart Claude Desktop/Code

### Issue: "Command not found" or "node: not found"

**Possible Causes**:
- Node.js not installed
- Node.js version too old (requires v18+, v20+ recommended)
- PATH not configured correctly

**Solution**:
1. Install Node.js 18 or higher: `brew install node` (macOS) or download from nodejs.org
2. Verify installation: `node --version` (should show v18.0.0 or higher)
3. Restart Claude Desktop/Code after installing Node.js
4. For development builds, ensure you ran `npm run build`

### Issue: "Tool not found" or MCP server not loading

**Possible Causes**:
- Configuration file has syntax errors
- Wrong file path (for local development)
- Missing `dist/stdio.js` file (development builds)

**Solution**:
1. Verify JSON syntax in your config file (no trailing commas)
2. For npm package: Ensure `npx` is in your PATH
3. For local development: Use absolute path to `dist/stdio.js`
4. For local development: Run `npm run build` to generate `dist/` folder
5. Restart Claude Desktop/Code
6. Check logs in Claude Desktop/Code for error messages

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
- MCP server not configured
- Configuration file has syntax errors (manual JSON approach)
- MCP server configuration added after session started

**Solution**:

**If using `claude mcp add` command**:
1. Run `claude mcp list` to verify the server is configured
2. If not listed, run the `claude mcp add` command again
3. Check for any error messages during `claude mcp add`
4. **Exit and restart** your Claude Code session (important!)

**If using manual JSON configuration**:
1. Check your configuration file exists (`.claude.json` or `~/.config/claude/config.json`)
2. Verify JSON syntax is correct (no trailing commas)
3. Ensure the `mcpServers` section is properly formatted
4. Verify the server name matches what's in your config
5. **Exit and restart** your Claude Code session (important!)

### Issue: "JSON parse error" or stdio communication errors

**Possible Causes**:
- Logs being written to stdout instead of stderr
- Corrupted stdio stream
- Node.js version incompatibility

**Solution**:
1. Verify Node.js version is 20 or higher: `node --version`
2. For local development: Ensure `src/utils/logger.ts` uses `console.error()` not `console.log()`
3. Rebuild after any code changes: `npm run build`
4. Check Claude Code logs for specific error messages
5. Test stdio directly: `echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | DEPLOYHQ_EMAIL=email DEPLOYHQ_API_KEY=pass DEPLOYHQ_ACCOUNT=account node dist/stdio.js`

### Issue: Configuration changes not taking effect

**Possible Causes**:
- MCP servers are only loaded at session start
- npx caching old package version
- Configuration file not saved

**Solution**:
1. Save your configuration file changes
2. **Exit Claude Code completely** (type `exit` or Ctrl+D)
3. For npm package users: Clear npx cache if needed: `rm -rf ~/.npm/_npx`
4. Start a new session: `claude`
5. MCP servers will be reloaded from configuration

### Issue: Local development changes not reflected

**Possible Causes**:
- Forgot to rebuild after code changes
- Claude Code using cached version
- Using relative path instead of absolute path

**Solution**:
1. Run `npm run build` after every code change
2. Use absolute path in config: `/full/path/to/deployhq-mcp-server/dist/stdio.js`
3. Restart Claude Code session
4. Verify the build succeeded (check for `dist/stdio.js` file)

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

### Read-Only Mode (Optional)

**By default, the MCP server allows all operations, including creating deployments.** This is the recommended configuration for most users who want full functionality.

For users who want additional protection against accidental deployments, the server includes an **optional read-only mode** that can be enabled to block deployment creation while still allowing read operations.

**Default Behavior (No Configuration Needed):**
- ✅ Deployments are **allowed by default**
- ✅ All operations work: list projects, get details, and create deployments
- ✅ Full functionality out of the box

**When you might want to enable read-only mode:**
- You want extra protection against accidental deployments via AI
- You're connecting to production environments and want an additional safety layer
- You only need read access to monitor deployments
- You're still testing the integration and want to be cautious

**Important:** Read-only mode is **completely optional**. The server works fully without it.

**Enabling Read-Only Mode:**

If you want to prevent deployments through the MCP server, you can enable read-only mode in two ways:

**Method 1: Environment Variable**
```json
{
  "mcpServers": {
    "deployhq": {
      "command": "npx",
      "args": ["-y", "deployhq-mcp-server"],
      "env": {
        "DEPLOYHQ_EMAIL": "your-email@example.com",
        "DEPLOYHQ_API_KEY": "your-api-key",
        "DEPLOYHQ_ACCOUNT": "your-account",
        "DEPLOYHQ_READ_ONLY": "true"
      }
    }
  }
}
```

**Method 2: CLI Flag**
```json
{
  "mcpServers": {
    "deployhq": {
      "command": "npx",
      "args": [
        "-y",
        "deployhq-mcp-server",
        "--read-only"
      ],
      "env": {
        "DEPLOYHQ_EMAIL": "your-email@example.com",
        "DEPLOYHQ_API_KEY": "your-api-key",
        "DEPLOYHQ_ACCOUNT": "your-account"
      }
    }
  }
}
```

**Configuration Precedence:**
1. CLI flag `--read-only` (highest priority)
2. Environment variable `DEPLOYHQ_READ_ONLY`
3. Default value: `false` (deployments allowed)

**Accepted Values:**
- Enable read-only: `"true"`, `"1"`, `"yes"` (case-insensitive)
- Disable read-only: `"false"`, `"0"`, `"no"` (case-insensitive)

**When to Enable Read-Only Mode:**
- You want to prevent accidental deployments via AI
- You're connecting to production environments
- You want an extra layer of protection
- You only need read access to monitor deployments

**Security Warning:**
- Deployment logs may contain environment variables, API keys, and secrets
- Exercise extreme caution when using tools that retrieve logs
- Consider using separate API keys for read-only vs. read-write operations

### Additional Security Best Practices

1. **Protect Your Credentials**:
   - Never share your API key
   - Credentials stay local (environment variables, never transmitted externally)
   - Rotate API keys periodically in DeployHQ Settings → Security

2. **Limit Permissions**:
   - Create a dedicated DeployHQ user for API access
   - Grant only necessary permissions
   - Use separate credentials for different environments

3. **Monitor Usage**:
   - Regularly check deployment logs in DeployHQ dashboard
   - Review API usage in DeployHQ
   - Set up alerts for suspicious activity

4. **Secure Your Configuration Files**:
   - Protect config file permissions: `chmod 600 ~/.config/claude/config.json`
   - Don't commit configuration files with credentials to version control
   - Add `.claude.json` to `.gitignore` for local project configs
   - For team environments, use placeholder values and document required env vars

5. **stdio Transport Security**:
   - Credentials passed as environment variables (local process only)
   - No network transmission of credentials (unlike HTTP/SSE transports)
   - Each MCP server runs as a local subprocess with your user permissions

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
2. **Check Claude Desktop/Code logs** for error messages
3. **Verify API status** at DeployHQ
4. **Test credentials** directly with the DeployHQ API
5. **Open an issue** on GitHub with logs and configuration (redact credentials)

## 🔄 Updates and Maintenance

The MCP server npm package is updated regularly. Updates are published to npm when changes are pushed to the main branch.

**Staying Updated**:

**For npm package users**:
- The `npx -y` flag automatically uses the latest version
- No manual updates needed - npx fetches the latest on each run
- Check the changelog at https://github.com/your-repo/deployhq-mcp-server/releases

**For local development users**:
- Pull latest changes: `git pull origin main`
- Reinstall dependencies if package.json changed: `npm install`
- Rebuild: `npm run build`
- Restart Claude Desktop/Code to load updated code

## 📚 Additional Resources

- **DeployHQ API Documentation**: https://www.deployhq.com/support/api
- **MCP Specification**: https://modelcontextprotocol.io
- **MCP SDK Documentation**: https://github.com/modelcontextprotocol/typescript-sdk
- **Claude Desktop**: https://claude.ai/desktop
- **Claude Code CLI**: https://docs.anthropic.com/claude/docs/claude-code
- **Node.js Downloads**: https://nodejs.org/

---

**Questions or feedback?** Open an issue on GitHub or contact support.
