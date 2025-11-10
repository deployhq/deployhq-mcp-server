# HTTP Transport Guide

This guide explains how to use the HTTP transport endpoint for the DeployHQ MCP Server.

## Overview

The HTTP transport provides a stateless JSON-RPC 2.0 interface for interacting with the MCP server. Unlike the SSE transport which maintains a persistent connection, each HTTP request is independent and includes authentication credentials in headers.

## Endpoint

```
POST /mcp
```

## Authentication

All requests must include the following HTTP headers:

- `X-DeployHQ-Username`: Your DeployHQ username or email
- `X-DeployHQ-Password`: Your DeployHQ password
- `X-DeployHQ-Account`: Your DeployHQ account name

Example:

```bash
curl -X POST https://mcp.deployhq.com/mcp \
  -H "Content-Type: application/json" \
  -H "X-DeployHQ-Username: user@example.com" \
  -H "X-DeployHQ-Password: your-password" \
  -H "X-DeployHQ-Account: your-account" \
  -d '{ ... }'
```

### Authentication Errors

If credentials are missing or invalid, you'll receive a 401 response:

```json
{
  "error": "Missing credentials in request headers"
}
```

## JSON-RPC 2.0 Protocol

All requests and responses follow the [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification).

### Request Format

```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": { ... },
  "id": 1
}
```

### Response Format

**Success:**

```json
{
  "jsonrpc": "2.0",
  "result": { ... },
  "id": 1
}
```

**Error:**

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Internal error",
    "data": {
      "details": "Error details here"
    }
  },
  "id": 1
}
```

## Supported Methods

### 1. Initialize Connection

Initialize the MCP connection and exchange capabilities.

**Method:** `initialize`

**Request:**

```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "my-client",
      "version": "1.0.0"
    }
  },
  "id": 1
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "deployhq-mcp-server",
      "version": "1.0.0"
    }
  },
  "id": 1
}
```

### 2. List Available Tools

Get a list of all available tools.

**Method:** `tools/list`

**Request:**

```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "params": {},
  "id": 2
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "list_projects",
        "description": "List all projects in your DeployHQ account",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "required": []
        }
      },
      {
        "name": "get_project",
        "description": "Get detailed information about a specific project",
        "inputSchema": {
          "type": "object",
          "properties": {
            "permalink": {
              "type": "string",
              "description": "Project permalink or identifier"
            }
          },
          "required": ["permalink"]
        }
      }
      // ... more tools
    ]
  },
  "id": 2
}
```

### 3. Call a Tool

Execute a specific tool with parameters.

**Method:** `tools/call`

**Request:**

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "list_projects",
    "arguments": {}
  },
  "id": 3
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[{\"name\": \"My Project\", \"repository_url\": \"...\"}]"
      }
    ]
  },
  "id": 3
}
```

### 4. Send Notification (optional)

Send notifications to the server (e.g., `notifications/initialized`).

**Method:** `notifications/initialized`

**Request:**

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized",
  "params": {}
}
```

**Note:** Notifications don't require an `id` field and don't return a response.

## Example Workflows

### Complete Workflow: List and Call Tool

```bash
#!/bin/bash

# Set credentials
USERNAME="user@example.com"
PASSWORD="your-password"
ACCOUNT="your-account"
BASE_URL="https://mcp.deployhq.com"

# 1. Initialize
echo "Initializing..."
curl -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "X-DeployHQ-Username: $USERNAME" \
  -H "X-DeployHQ-Password: $PASSWORD" \
  -H "X-DeployHQ-Account: $ACCOUNT" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "bash-client", "version": "1.0.0"}
    },
    "id": 1
  }'

# 2. List tools
echo -e "\n\nListing tools..."
curl -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "X-DeployHQ-Username: $USERNAME" \
  -H "X-DeployHQ-Password: $PASSWORD" \
  -H "X-DeployHQ-Account: $ACCOUNT" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 2
  }'

# 3. Call list_projects tool
echo -e "\n\nCalling list_projects..."
curl -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "X-DeployHQ-Username: $USERNAME" \
  -H "X-DeployHQ-Password: $PASSWORD" \
  -H "X-DeployHQ-Account: $ACCOUNT" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "list_projects",
      "arguments": {}
    },
    "id": 3
  }'
```

### Using with JavaScript/TypeScript

```typescript
interface MCPRequest {
  jsonrpc: '2.0';
  method: string;
  params: any;
  id: number;
}

interface MCPResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number;
}

class DeployHQMCPClient {
  constructor(
    private baseUrl: string,
    private username: string,
    private password: string,
    private account: string
  ) {}

  async call(method: string, params: any = {}, id: number = 1): Promise<MCPResponse> {
    const request: MCPRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id,
    };

    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DeployHQ-Username': this.username,
        'X-DeployHQ-Password': this.password,
        'X-DeployHQ-Account': this.account,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async initialize() {
    return this.call('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'ts-client', version: '1.0.0' },
    });
  }

  async listTools() {
    return this.call('tools/list', {});
  }

  async callTool(name: string, args: any = {}) {
    return this.call('tools/call', { name, arguments: args });
  }
}

// Usage
const client = new DeployHQMCPClient(
  'https://mcp.deployhq.com',
  'user@example.com',
  'password',
  'account'
);

await client.initialize();
const tools = await client.listTools();
const projects = await client.callTool('list_projects');
```

### Using with Python

```python
import requests
import json

class DeployHQMCPClient:
    def __init__(self, base_url, username, password, account):
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'X-DeployHQ-Username': username,
            'X-DeployHQ-Password': password,
            'X-DeployHQ-Account': account,
        }
        self.request_id = 0

    def call(self, method, params=None):
        self.request_id += 1
        request = {
            'jsonrpc': '2.0',
            'method': method,
            'params': params or {},
            'id': self.request_id,
        }

        response = requests.post(
            f'{self.base_url}/mcp',
            headers=self.headers,
            json=request
        )
        response.raise_for_status()
        return response.json()

    def initialize(self):
        return self.call('initialize', {
            'protocolVersion': '2024-11-05',
            'capabilities': {},
            'clientInfo': {'name': 'py-client', 'version': '1.0.0'}
        })

    def list_tools(self):
        return self.call('tools/list')

    def call_tool(self, name, args=None):
        return self.call('tools/call', {
            'name': name,
            'arguments': args or {}
        })

# Usage
client = DeployHQMCPClient(
    'https://mcp.deployhq.com',
    'user@example.com',
    'password',
    'account'
)

client.initialize()
tools = client.list_tools()
projects = client.call_tool('list_projects')
print(json.dumps(projects, indent=2))
```

## Error Handling

### HTTP Status Codes

- `200 OK`: Request processed successfully
- `401 Unauthorized`: Missing or invalid credentials
- `400 Bad Request`: Invalid JSON-RPC request format
- `500 Internal Server Error`: Server error during processing

### JSON-RPC Error Codes

- `-32700`: Parse error (invalid JSON)
- `-32600`: Invalid request (malformed JSON-RPC)
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error

## CORS Support

The HTTP transport endpoint supports CORS (Cross-Origin Resource Sharing) for web integrations:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, X-DeployHQ-Username, X-DeployHQ-Password, X-DeployHQ-Account`

## Comparison with SSE Transport

| Feature | HTTP Transport | SSE Transport |
|---------|----------------|---------------|
| Connection | Stateless | Stateful |
| Protocol | JSON-RPC over POST | SSE + POST messages |
| Use Case | Web integrations, simple workflows | Claude Desktop, long-lived sessions |
| Authentication | Per-request headers | Initial headers + session |
| Complexity | Simple | Moderate |
| Streaming | No | Yes |

## Best Practices

1. **Reuse connections**: Use HTTP keep-alive for multiple requests
2. **Handle errors gracefully**: Check both HTTP status and JSON-RPC error fields
3. **Secure credentials**: Never log or expose credentials in client-side code
4. **Use HTTPS**: Always use HTTPS in production
5. **Rate limiting**: Implement client-side rate limiting to avoid overwhelming the server
6. **Timeouts**: Set reasonable request timeouts (30s recommended)

## Troubleshooting

### "Missing credentials in request headers"

**Cause:** One or more authentication headers are missing.

**Solution:** Ensure all three headers are present: `X-DeployHQ-Username`, `X-DeployHQ-Password`, `X-DeployHQ-Account`

### "Internal error"

**Cause:** Server error during request processing.

**Solution:** Check the error details in the JSON-RPC error response. Common causes include:
- Invalid DeployHQ credentials
- DeployHQ API unavailable
- Invalid tool parameters

### CORS Errors (Browser)

**Cause:** Browser blocking cross-origin requests.

**Solution:** The server already enables CORS. Ensure you're:
- Using HTTPS for the MCP server
- Not blocking CORS in browser dev tools
- Including proper headers in preflight requests

## Additional Resources

- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [DeployHQ API Documentation](https://www.deployhq.com/support/api)
