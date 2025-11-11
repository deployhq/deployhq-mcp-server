# stdio Transport Migration

This document describes the changes made to convert the DeployHQ MCP server from a hosted SSE/HTTP server to a npm package that uses stdio transport for direct use with Claude Desktop and Claude Code.

## Changes Made

### 1. New Files

#### `src/stdio.ts`
- Main entrypoint for stdio transport
- Reads credentials from environment variables:
  - `DEPLOYHQ_USERNAME`
  - `DEPLOYHQ_PASSWORD`
  - `DEPLOYHQ_ACCOUNT`
- Uses `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`
- Connects the MCP server to stdio transport
- Handles graceful shutdown (SIGTERM, SIGINT)

#### `docs/claude-config.json`
- Universal configuration file for both Claude Desktop and Claude Code
- Template for setting up the MCP server with stdio transport
- Replaces separate config files (same config works for both clients)

### 2. Updated Files

#### `package.json`
- Added `bin` field pointing to `./dist/stdio.js`
- This allows the package to be used as a CLI tool with `npx deployhq-mcp-server`
- Kept all existing scripts for hosted deployment

#### `README.md`
- Restructured to focus on stdio usage as primary use case
- Added Quick Start sections for both Claude Desktop and Claude Code
- Added configuration examples for both clients
- Moved hosted deployment to "Optional: Hosted Deployment" section
- Updated architecture diagram to show stdio transport
- Updated security section to emphasize local credential management

#### `src/utils/logger.ts`
- **CRITICAL FIX**: Changed all logging to use `console.error` instead of `console.log`
- stdio transport requires stdout to be reserved exclusively for JSON-RPC messages
- Logging to stdout causes "Unexpected token" errors in Claude Desktop
- All logs (info, error, debug) now properly go to stderr

### 3. Unchanged Files (for hosted deployment)

- `src/index.ts` - Express server entrypoint
- `src/mcp-server.ts` - Core MCP server factory (shared by both transports)
- `src/tools.ts` - Tool definitions (shared)
- `src/api-client.ts` - DeployHQ API client (shared)
- `src/transports/` - SSE and HTTP transport handlers

## Usage

### Primary: stdio for Claude Desktop and Claude Code

```bash
npx deployhq-mcp-server
```

**Universal configuration** (copy from `docs/claude-config.json`):

For Claude Desktop → `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
For Claude Code → `.claude.json` (project directory)

```json
{
  "mcpServers": {
    "deployhq": {
      "command": "npx",
      "args": ["-y", "deployhq-mcp-server"],
      "env": {
        "DEPLOYHQ_USERNAME": "user@example.com",
        "DEPLOYHQ_PASSWORD": "password",
        "DEPLOYHQ_ACCOUNT": "account-name"
      }
    }
  }
}
```

The same configuration works for both clients!

### Optional: Hosted Server

```bash
npm start
```

The hosted server still works with SSE and HTTP transports for web integrations.

## Testing

### Test stdio transport locally:

```bash
npm run build
export DEPLOYHQ_USERNAME="your-email@example.com"
export DEPLOYHQ_PASSWORD="your-password"
export DEPLOYHQ_ACCOUNT="your-account"
node dist/stdio.js
```

The server will wait for JSON-RPC messages on stdin.

### Test with Claude Desktop:

1. Add configuration to `claude_desktop_config.json`
2. Restart Claude Desktop
3. Ask Claude to interact with DeployHQ:
   - "List all my DeployHQ projects"
   - "Show me the servers for project X"
   - "Get the latest deployment for project Y"

### Test with Claude Code:

1. Add configuration to `.claude.json`
2. Start Claude Code
3. Ask Claude to interact with DeployHQ:
   - "List all my DeployHQ projects"
   - "Show me the servers for project X"
   - "Get the latest deployment for project Y"

## Architecture

```
Before (Hosted):
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Claude Desktop │  HTTP   │  Express Server  │  HTTPS  │  DeployHQ   │
│  or Claude Code │────────►│  (Digital Ocean) │────────►│  API        │
└─────────────────┘         └──────────────────┘         └─────────────┘

After (stdio):
┌─────────────────┐                    ┌─────────────┐
│  Claude Desktop │    stdio/JSON-RPC  │  DeployHQ   │
│  or Claude Code │◄──────────────────►│  API        │
│                 │    (via npx)       │             │
│  (spawns via    │                    │             │
│   npx)          │                    │             │
└─────────────────┘                    └─────────────┘
```

## Benefits

1. **Simpler Setup**: No need to deploy or manage a hosted server
2. **Secure**: Credentials stay local, never sent over network
3. **Easy Installation**: `npx` downloads and runs automatically
4. **Local Execution**: Runs directly on user's machine
5. **No Infrastructure**: No hosting costs or maintenance
6. **Backwards Compatible**: Hosted version still available if needed

## Troubleshooting

### "Unexpected token" JSON errors in Claude Desktop

**Problem**: Claude Desktop shows errors like:
```
Unexpected token 'I', "[INFO] 2025"... is not valid JSON
```

**Cause**: The stdio transport uses stdout exclusively for JSON-RPC messages. Any other output (logs, debug messages, etc.) to stdout will corrupt the JSON stream.

**Solution**: All logging must use `console.error` (stderr) instead of `console.log` (stdout).

```typescript
// ❌ Wrong - writes to stdout, breaks stdio
console.log('[INFO] Starting server...');

// ✅ Correct - writes to stderr, preserves stdio
console.error('[INFO] Starting server...');
```

This is why our logger uses `console.error` for all log levels.

## Next Steps

To publish to npm:

```bash
npm login
npm publish
```

Then users can use it immediately with:
```bash
npx deployhq-mcp-server
```
