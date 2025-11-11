# DeployHQ MCP Server

A Model Context Protocol (MCP) server for DeployHQ that enables AI assistants like Claude Desktop and Claude Code to interact with your DeployHQ deployments.

## 🚀 Features

- **Full DeployHQ API Integration**: Access projects, servers, and deployments
- **Easy Installation**: Use directly with `npx` - no installation required
- **Works with Claude Desktop & Claude Code**: stdio transport for both MCP clients
- **Secure**: Credentials via environment variables, never stored
- **Type-Safe**: Built with TypeScript and Zod validation
- **Multiple Transports**: stdio (primary), SSE, and HTTP (optional for hosting)
- **Production-Ready**: Comprehensive error handling and logging

## 📋 Available Tools

The MCP server provides the following tools for AI assistants:

### `list_projects`

List all projects in your DeployHQ account.

**Returns**: Array of projects with repository information and deployment status.

### `get_project`
Get detailed information about a specific project.

**Parameters**:
- `permalink` (string): Project permalink or identifier

### `list_servers`
List all servers configured for a project.

**Parameters**:
- `project` (string): Project permalink

### `list_deployments`
List deployments for a project with pagination support.

**Parameters**:
- `project` (string): Project permalink
- `page` (number, optional): Page number for pagination
- `server_uuid` (string, optional): Filter by server UUID

### `get_deployment`
Get detailed information about a specific deployment.

**Parameters**:
- `project` (string): Project permalink
- `uuid` (string): Deployment UUID

### `create_deployment`
Create a new deployment for a project.

**Parameters**:
- `project` (string): Project permalink
- `parent_identifier` (string): Server or server group UUID
- `start_revision` (string): Starting commit hash
- `end_revision` (string): Ending commit hash
- `branch` (string, optional): Branch to deploy from
- `mode` (string, optional): "queue" or "preview"
- `copy_config_files` (boolean, optional): Copy config files
- `run_build_commands` (boolean, optional): Run build commands
- `use_build_cache` (boolean, optional): Use build cache
- `use_latest` (string, optional): Use latest deployed commit as start

## 🚀 Quick Start

### Configuration (Works for Both Claude Desktop and Claude Code)

The same configuration works for both clients. Copy from `docs/claude-config.json` and add your credentials.

**For Claude Desktop:**

Edit your config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Then restart Claude Desktop.

**For Claude Code:**

Add to your `.claude.json` file in your project directory.

**Configuration:**

```json
{
  "mcpServers": {
    "deployhq": {
      "command": "npx",
      "args": ["-y", "deployhq-mcp-server"],
      "env": {
        "DEPLOYHQ_USERNAME": "your-email@example.com",
        "DEPLOYHQ_PASSWORD": "your-password",
        "DEPLOYHQ_ACCOUNT": "your-account-name"
      }
    }
  }
}
```

### Start Using

Once configured, you can ask Claude to interact with DeployHQ:
- "List all my DeployHQ projects"
- "Show me the servers for project X"
- "Get the latest deployment status for project Y"
- "Create a new deployment for project Z"

### Getting Your DeployHQ Credentials

1. **Username**: Your DeployHQ login email
2. **Password**: Your DeployHQ password
3. **Account**: Your DeployHQ account name (visible in the URL: `https://ACCOUNT.deployhq.com`)

## 🏗️ Architecture

```
┌─────────────────┐                    ┌─────────────┐
│  Claude Desktop │    stdio/JSON-RPC  │  DeployHQ   │
│  or Claude Code │◄──────────────────►│  API        │
│                 │    (via npx)       │             │
│  Environment    │                    │             │
│  Variables ─────┼───────────────────►│ Basic Auth  │
└─────────────────┘                    └─────────────┘
```

- **Claude Desktop/Code**: MCP clients that spawn the server via `npx`
- **MCP Server**: Reads credentials from environment variables, communicates via stdio
- **DeployHQ API**: REST API with HTTP Basic Authentication

## 📦 Prerequisites

- Node.js 20+
- DeployHQ account with API access

## 🔧 Local Development

### 1. Clone the repository

```bash
git clone https://github.com/your-username/deployhq-mcp-server.git
cd deployhq-mcp-server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Build the project

```bash
npm run build
```

### 4. Test locally with environment variables

```bash
DEPLOYHQ_USERNAME="your-email@example.com" \
DEPLOYHQ_PASSWORD="your-password" \
DEPLOYHQ_ACCOUNT="your-account" \
node dist/stdio.js
```

The server will start in stdio mode and wait for JSON-RPC messages on stdin.

### 5. Test with Claude Code

Configure your local `.claude.json` to use the built version:

```json
{
  "mcpServers": {
    "deployhq": {
      "command": "node",
      "args": ["/path/to/deployhq-mcp-server/dist/stdio.js"],
      "env": {
        "DEPLOYHQ_USERNAME": "your-email@example.com",
        "DEPLOYHQ_PASSWORD": "your-password",
        "DEPLOYHQ_ACCOUNT": "your-account-name"
      }
    }
  }
}
```

## 🔒 Security

- **Environment Variables**: Credentials are never stored, only passed via environment variables
- **HTTPS**: When using npx, credentials stay local to your machine
- **No Telemetry**: No data is sent anywhere except directly to DeployHQ API
- **Minimal Permissions**: Use a dedicated DeployHQ user with minimum required permissions

---

## 🌐 Optional: Hosted Deployment

The server can also be deployed as a hosted service with SSE/HTTP transports. This is useful for web integrations or shared team access.

### 🚀 Deployment to Digital Ocean

### Option 1: Using the Dashboard

1. **Prepare your repository**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create a new app**:
   - Go to [Digital Ocean Apps](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Select your GitHub repository
   - Choose the branch (main)

3. **Configure the app**:
   - Digital Ocean will detect the Dockerfile automatically
   - Or use the `.do/app.yaml` configuration

4. **Set environment variables**:
   - Go to App Settings → Environment Variables
   - Add the following as **encrypted** variables:
     - `DEPLOYHQ_USERNAME`
     - `DEPLOYHQ_PASSWORD`
     - `DEPLOYHQ_ACCOUNT`
   - Add these as regular variables:
     - `NODE_ENV=production`
     - `PORT=8080`
     - `LOG_LEVEL=info`

5. **Deploy**:
   - Click "Next" and "Create Resources"
   - Wait for deployment to complete

6. **Configure custom domain** (optional):
   - Go to Settings → Domains
   - Add `mcp.deployhq.com`
   - Update your DNS records as instructed

### Option 2: Using doctl CLI

1. **Install doctl**:
   ```bash
   # macOS
   brew install doctl

   # Linux
   cd ~
   wget https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz
   tar xf doctl-1.104.0-linux-amd64.tar.gz
   sudo mv doctl /usr/local/bin
   ```

2. **Authenticate**:
   ```bash
   doctl auth init
   ```

3. **Update `.do/app.yaml`**:
   - Edit the `github.repo` field with your repository
   - Review and adjust instance size if needed

4. **Create the app**:
   ```bash
   doctl apps create --spec .do/app.yaml
   ```

5. **Set environment secrets**:
   ```bash
   # Get your app ID
   doctl apps list

   # Update environment variables (replace APP_ID)
   doctl apps update APP_ID --spec .do/app.yaml
   ```

6. **View logs**:
   ```bash
   doctl apps logs APP_ID --follow
   ```

### 🔒 Hosted Security

- **Never commit credentials**: Use `.env` for local development (excluded by `.gitignore`)
- **Use Digital Ocean secrets**: Store credentials as encrypted environment variables
- **HTTPS only**: Digital Ocean provides automatic HTTPS
- **Minimal permissions**: Use a dedicated DeployHQ user with minimum required permissions

### 📊 Hosted Monitoring

#### Health Check

The hosted server includes a health check endpoint at `/health`:

```bash
curl https://mcp.deployhq.com/health
```

#### Logs

View logs in Digital Ocean:
- Dashboard: Go to your app → Runtime Logs
- CLI: `doctl apps logs <APP_ID> --follow`

#### Alerts

Digital Ocean will alert you on:
- Deployment failures
- Domain configuration issues
- Health check failures

### 🧪 Testing Hosted Server

Test the SSE endpoint:

```bash
curl -N http://localhost:8080/sse \
  -H "X-DeployHQ-Username: your-username" \
  -H "X-DeployHQ-Password: your-password" \
  -H "X-DeployHQ-Account: your-account"
```

Test the HTTP transport endpoint:

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "X-DeployHQ-Username: your-username" \
  -H "X-DeployHQ-Password: your-password" \
  -H "X-DeployHQ-Account: your-account" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 1
  }'
```

See the hosted deployment documentation for full testing examples.

## 📚 Project Structure

```
deployhq-mcp-server/
├── src/
│   ├── stdio.ts          # stdio transport entrypoint (for Claude Desktop/Code)
│   ├── index.ts          # Express server (for hosted deployment)
│   ├── mcp-server.ts     # Core MCP server factory (shared)
│   ├── tools.ts          # Tool definitions and schemas (shared)
│   ├── api-client.ts     # DeployHQ API client (shared)
│   ├── transports/       # SSE/HTTP handlers (for hosted)
│   └── utils/            # Logging and utilities
├── docs/
│   ├── claude-config.json          # Universal config template (Desktop & Code)
│   ├── USER_GUIDE.md               # User documentation
│   ├── DEPLOYMENT.md               # Hosted deployment guide
│   └── HTTP_TRANSPORT.md           # HTTP transport documentation
├── .do/
│   └── app.yaml          # Digital Ocean configuration (optional)
├── Dockerfile            # Container configuration (optional)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── STDIO_MIGRATION.md    # stdio migration documentation
└── README.md             # This file
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **DeployHQ API Documentation**: https://www.deployhq.com/support/api
- **MCP Documentation**: https://modelcontextprotocol.io
- **Issues**: https://github.com/your-username/deployhq-mcp-server/issues

## 🔗 Related Links

- [DeployHQ](https://www.deployhq.com)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Digital Ocean App Platform](https://www.digitalocean.com/products/app-platform)
- [Claude Desktop](https://claude.ai/desktop)
- [Claude Code CLI](https://github.com/anthropics/claude-code)
