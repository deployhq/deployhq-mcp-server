# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DeployHQ MCP Server is a Model Context Protocol (MCP) server that enables AI assistants (Claude Desktop and Claude Code) to interact with DeployHQ deployments. It provides two operational modes:

1. **stdio transport** (primary): npm package for direct use with `npx deployhq-mcp-server`
2. **HTTP/SSE transports** (optional): Express server for hosted deployment

## Development Commands

### Build & Type Checking
```bash
npm run build         # Compile TypeScript to dist/
npm run type-check    # Type check without emitting files
npm run clean         # Remove dist/ directory
```

### Development & Testing
```bash
npm run dev           # Watch mode for hosted server (index.ts)
npm run start         # Run compiled hosted server
npm run lint          # ESLint on src/
```

### Testing stdio Transport Locally
```bash
# Build first
npm run build

# Test with environment variables
DEPLOYHQ_EMAIL="email" DEPLOYHQ_API_KEY="pass" DEPLOYHQ_ACCOUNT="account" node dist/stdio.js

# Or use the test script
export DEPLOYHQ_EMAIL="email"
export DEPLOYHQ_API_KEY="pass"
export DEPLOYHQ_ACCOUNT="account"
./test-stdio.sh
```

### Testing with Claude Desktop
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "deployhq-local": {
      "command": "node",
      "args": ["/absolute/path/to/dist/stdio.js"],
      "env": {
        "DEPLOYHQ_EMAIL": "email",
        "DEPLOYHQ_API_KEY": "pass",
        "DEPLOYHQ_ACCOUNT": "account"
      }
    }
  }
}
```
Restart Claude Desktop to test.

## Architecture

### Core Components

**Two Entry Points:**
- `src/stdio.ts` → `dist/stdio.js` (bin entry, stdio transport for MCP clients)
- `src/index.ts` → `dist/index.js` (Express server for hosted deployment)

**Shared Core:**
- `src/mcp-server.ts`: Factory function `createMCPServer(username, password, account)` that returns a configured MCP Server instance. Used by both stdio and hosted modes.
- `src/tools.ts`: Defines 6 MCP tools (list_projects, get_project, list_servers, list_deployments, get_deployment, create_deployment) with Zod validation schemas
- `src/api-client.ts`: DeployHQClient class for HTTP Basic Auth API calls to DeployHQ REST API. Uses node-fetch for Node 16+ compatibility.

**Transport Handlers (hosted mode only):**
- `src/transports/sse-handler.ts`: Server-Sent Events transport
- `src/transports/http-handler.ts`: HTTP JSON-RPC transport

### Critical: stdio Transport Logging

**IMPORTANT**: When using stdio transport, stdout is reserved exclusively for JSON-RPC messages. All logging MUST go to stderr.

The `src/utils/logger.ts` uses `console.error()` for all log levels (info, error, debug) to prevent corrupting the JSON-RPC stream. Writing to stdout will cause "Unexpected token" JSON parse errors in Claude Desktop/Code.

❌ **Wrong**: `console.log('[INFO] message')` → breaks stdio
✅ **Correct**: `console.error('[INFO] message')` → works with stdio

### Tool Call Flow

1. MCP client (Claude Desktop/Code) sends JSON-RPC request via stdin
2. `StdioServerTransport` receives and parses request
3. `createMCPServer()` routes to appropriate tool handler in `mcp-server.ts`
4. Tool validates input with Zod schema from `tools.ts`
5. `DeployHQClient` makes HTTP request to DeployHQ API with Basic Auth
6. Response returned as JSON-RPC message via stdout
7. Logs go to stderr throughout (visible in client logs but not in JSON stream)

### Credential Flow

**stdio mode**: Environment variables → `stdio.ts` reads → passes to `createMCPServer()`
**hosted mode**: HTTP headers → transport handler extracts → passes to `createMCPServer()`

Per-request client initialization ensures each API call uses the correct user's credentials.

## Key Technical Decisions

### Why stdio for Primary Use Case
- Simpler than hosted deployment (no infrastructure needed)
- Credentials stay local (environment variables)
- Direct process spawning by MCP clients
- No CORS or authentication complexity

### Why Zod for Validation
All tool inputs use Zod schemas for runtime validation. Schemas defined once in `tools.ts` and used for both:
- TypeScript type inference
- Runtime validation in tool handlers

### Why Separate createMCPServer Factory
The factory function `createMCPServer()` encapsulates all MCP server logic and is transport-agnostic. This allows:
- Same business logic for stdio and hosted modes
- Easy testing (can instantiate server without transport)
- Clean separation of concerns

## Available MCP Tools

1. **list_projects**: Get all projects (no params)
2. **get_project**: Get project details (permalink)
3. **list_servers**: List project servers (project)
4. **list_deployments**: List deployments with pagination (project, page?, server_uuid?)
5. **get_deployment**: Get deployment details (project, uuid)
6. **create_deployment**: Create new deployment (project, parent_identifier, start_revision, end_revision, plus optional params)

All tools require valid DeployHQ credentials and return typed responses matching the DeployHQ API.

## Common Development Patterns

### Adding a New Tool

1. Add Zod schema to `src/tools.ts` (e.g., `export const NewToolSchema = z.object({...})`)
2. Add tool definition to `tools` array in `src/tools.ts`
3. Add case to switch statement in `src/mcp-server.ts` CallToolRequestSchema handler
4. Add corresponding method to `DeployHQClient` in `src/api-client.ts` if needed
5. Import schema in `mcp-server.ts` and use for validation

### Testing Changes

Always rebuild after TypeScript changes:
```bash
npm run build
```

For stdio testing, use absolute path to `dist/stdio.js` in client configs to avoid npx caching issues during development.

## Configuration Files

- `docs/claude-config.json`: Universal config template for both Claude Desktop and Claude Code
- `tsconfig.json`: Targets ES2022, outputs to dist/, includes all src files
- `package.json`: Dual entry points (main for hosted, bin for stdio)

## Important: Node Version

Requires Node.js >=16.0.0 (specified in package.json engines). The server uses node-fetch for HTTP requests to ensure compatibility with Node 16+, which is commonly used by Claude Desktop/Code installations.
