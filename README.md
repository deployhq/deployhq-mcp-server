# DeployHQ MCP Server

A hosted Model Context Protocol (MCP) server for DeployHQ that enables AI assistants like Claude Desktop and Claude Code CLI to interact with your DeployHQ deployments.

## 🚀 Features

- **Full DeployHQ API Integration**: Access projects, servers, and deployments
- **Hosted Solution**: Deploy to Digital Ocean App Platform at `mcp.deployhq.com`
- **SSE Transport**: Server-Sent Events for reliable real-time communication
- **Type-Safe**: Built with TypeScript and Zod validation
- **Production-Ready**: Comprehensive error handling, logging, and monitoring

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

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Claude Desktop │◄────────┤  MCP Server      │◄────────┤  DeployHQ   │
│  or Code CLI    │  SSE    │  (Digital Ocean) │  HTTPS  │  API        │
│  (Headers) ────────────────►  (Headers) ──────────────► (Basic Auth) │
└─────────────────┘         └──────────────────┘         └─────────────┘
```

- **Claude Desktop / Code CLI**: MCP clients that connect via SSE with custom headers
- **MCP Server**: Express.js server that accepts per-user credentials
- **DeployHQ API**: REST API with HTTP Basic Authentication

### Multi-Tenant Authentication Flow

1. **Customer configures Claude Desktop or Code CLI** with their DeployHQ credentials in `headers`
2. **Credentials sent via HTTP headers** (X-DeployHQ-Username, X-DeployHQ-Password, X-DeployHQ-Account)
3. **Server creates per-request client** using customer's credentials
4. **API calls authenticated** with customer's DeployHQ account

**Security**: Credentials are transmitted via HTTPS headers (not query strings or logs)

### Configuration Differences

**Claude Desktop**:
- Config file: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
- Automatically loads on application start
- JSON-based configuration

**Claude Code CLI**:
- Config file: `.claude.json` (local), `~/.config/claude/config.json` (user), or `.mcp.json` (project)
- Loads on new session start
- CLI-based configuration with `claude mcp add` command

## 📦 Prerequisites

- Node.js 20+
- DeployHQ account with API access
- Digital Ocean account (for deployment)
- `doctl` CLI (for deployment)

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

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=8080
NODE_ENV=development
LOG_LEVEL=debug
```

**Getting your DeployHQ API key**:
1. Log in to DeployHQ
2. Go to Settings → Security
3. Copy your 40-character API key

### 4. Run development server

```bash
npm run dev
```

The server will start on `http://localhost:8080`:
- Health check: `http://localhost:8080/health`
- SSE endpoint: `http://localhost:8080/sse`

### 5. Test the API

```bash
# Health check
curl http://localhost:8080/health

# Should return:
# {"status":"healthy","timestamp":"...","service":"deployhq-mcp-server","version":"1.0.0"}
```

## 🚀 Deployment to Digital Ocean

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

## 🔒 Security

- **Never commit credentials**: Use `.env` for local development (excluded by `.gitignore`)
- **Use Digital Ocean secrets**: Store credentials as encrypted environment variables
- **HTTPS only**: Digital Ocean provides automatic HTTPS
- **Minimal permissions**: Use a dedicated DeployHQ user with minimum required permissions

## 📊 Monitoring

### Health Check

The server includes a health check endpoint at `/health`:

```bash
curl https://mcp.deployhq.com/health
```

### Logs

View logs in Digital Ocean:
- Dashboard: Go to your app → Runtime Logs
- CLI: `doctl apps logs <APP_ID> --follow`

### Alerts

Digital Ocean will alert you on:
- Deployment failures
- Domain configuration issues
- Health check failures

## 🧪 Testing

### Manual Testing

Test the SSE endpoint:

```bash
# Test SSE connection
curl -N http://localhost:8080/sse
```

### Integration Testing

See `docs/USER_GUIDE.md` for Claude Desktop and Claude Code CLI configuration and testing.

## 📚 Project Structure

```
deployhq-mcp-server/
├── src/
│   ├── index.ts          # Express server entry point
│   ├── server.ts         # MCP server setup (stdio version)
│   ├── tools.ts          # Tool definitions and schemas
│   └── api-client.ts     # DeployHQ API client
├── .do/
│   └── app.yaml          # Digital Ocean configuration
├── docs/
│   └── USER_GUIDE.md     # User documentation
├── Dockerfile            # Container configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
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
