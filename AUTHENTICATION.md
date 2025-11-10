# DeployHQ MCP Server - Authentication Architecture

## Overview

This document explains how the DeployHQ MCP Server handles multi-tenant authentication securely.

## Architecture Decision

### ❌ Rejected Approaches

1. **Single .env credentials** - Doesn't support multiple customers
2. **Query string parameters** - Insecure (logged, visible in URLs, stored in history)
3. **Session tokens** - Adds complexity for stateless hosted service

### ✅ Chosen Approach: HTTP Headers

Credentials are passed via **custom HTTP headers** from Claude Desktop to the MCP server.

## How It Works

### 1. Customer Configuration (Claude Desktop)

Each customer configures their Claude Desktop with their own credentials:

**File**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "deployhq": {
      "url": "https://mcp.deployhq.com/sse",
      "headers": {
        "X-DeployHQ-Username": "customer@example.com",
        "X-DeployHQ-Password": "their-40-character-api-key",
        "X-DeployHQ-Account": "their-account-name"
      }
    }
  }
}
```

### 2. Request Flow

```
┌──────────────────┐
│ Claude Desktop   │
│ Config File      │
└────────┬─────────┘
         │
         │ Headers:
         │ X-DeployHQ-Username
         │ X-DeployHQ-Password
         │ X-DeployHQ-Account
         │
         ▼
┌──────────────────┐
│ HTTPS Connection │
│ (TLS Encrypted)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ MCP Server       │
│ Extract Headers  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Create DeployHQ  │
│ Client per User  │
└────────┬─────────┘
         │
         │ Basic Auth:
         │ username:password
         │
         ▼
┌──────────────────┐
│ DeployHQ API     │
└──────────────────┘
```

### 3. Server Implementation

**Location**: `src/index.ts`

```typescript
app.get('/sse', async (req, res) => {
  // Extract credentials from headers
  const username = req.headers['x-deployhq-username'] as string;
  const password = req.headers['x-deployhq-password'] as string;
  const account = req.headers['x-deployhq-account'] as string;

  // Validate credentials present
  if (!username || !password || !account) {
    return res.status(401).json({ error: 'Missing credentials' });
  }

  // Create per-user MCP server instance
  const server = createMCPServer(username, password, account);

  // ... handle connection
});
```

### 4. DeployHQ Client Creation

**Location**: `src/index.ts` - `createMCPServer()`

```typescript
function createMCPServer(
  username: string,
  password: string,
  account: string
): Server {
  // Create DeployHQ client with user's credentials
  const client = new DeployHQClient({
    username,
    password,
    account,
    timeout: 30000,
  });

  // ... setup MCP server with this client
}
```

## Security Features

### ✅ What We Do

1. **HTTPS Only in Production** - Headers encrypted in transit
2. **No Query String Credentials** - Not logged or cached
3. **Per-Request Client** - Each user gets isolated client
4. **Header Validation** - Reject requests without credentials
5. **No Credential Logging** - Sensitive data never logged
6. **Fallback to .env** - For local development/testing only

### 🔒 Security Properties

| Property | Status | Details |
|----------|--------|---------|
| Encrypted in transit | ✅ | HTTPS/TLS |
| Not in server logs | ✅ | Headers not logged by default |
| Not in browser history | ✅ | Not in URL |
| Not visible on screen | ✅ | Hidden in config file |
| Per-user isolation | ✅ | Separate client instances |
| Credential validation | ✅ | 401 if missing |

## Customer Setup Guide

### For Production (Hosted)

```json
{
  "mcpServers": {
    "deployhq": {
      "url": "https://mcp.deployhq.com/sse",
      "headers": {
        "X-DeployHQ-Username": "your-email@example.com",
        "X-DeployHQ-Password": "your-api-key-here",
        "X-DeployHQ-Account": "your-account"
      }
    }
  }
}
```

### For Local Development

**Option 1: Using Headers** (same as production)
```json
{
  "mcpServers": {
    "deployhq": {
      "url": "http://localhost:8181/sse",
      "headers": {
        "X-DeployHQ-Username": "dev@example.com",
        "X-DeployHQ-Password": "dev-api-key",
        "X-DeployHQ-Account": "dev-account"
      }
    }
  }
}
```

**Option 2: Using .env** (local only)
```env
DEPLOYHQ_USERNAME=dev@example.com
DEPLOYHQ_PASSWORD=dev-api-key
DEPLOYHQ_ACCOUNT=dev-account
PORT=8181
```

Then simple config:
```json
{
  "mcpServers": {
    "deployhq": {
      "url": "http://localhost:8181/sse"
    }
  }
}
```

## Testing Authentication

### Test with curl

```bash
# Missing headers - should return 401
curl http://localhost:8181/sse

# With headers - should connect
curl -H "X-DeployHQ-Username: test@example.com" \
     -H "X-DeployHQ-Password: test-key" \
     -H "X-DeployHQ-Account: test-account" \
     http://localhost:8181/sse
```

### Test with Claude Desktop

1. Configure `claude_desktop_config.json` with test credentials
2. Restart Claude Desktop
3. Ask: "List my DeployHQ projects"
4. Check server logs for: `Creating MCP server for account: <account>`

## Monitoring & Debugging

### Server Logs

The server logs authentication events (without credentials):

```
[INFO] New SSE connection
[INFO] Creating MCP server for account: customer-account (user: customer@example.com)
```

**Note**: Passwords/API keys are NEVER logged.

### Error Responses

**401 Unauthorized** - Missing credentials
```json
{
  "error": "Unauthorized",
  "message": "Missing required headers: X-DeployHQ-Username, X-DeployHQ-Password, X-DeployHQ-Account"
}
```

**500 Server Error** - Client initialization failed
```json
{
  "error": "Server initialization failed",
  "message": "Invalid credentials or network error"
}
```

## Best Practices

### For Customers

1. ✅ Store credentials in Claude Desktop config file
2. ✅ Keep config file secure (appropriate file permissions)
3. ✅ Rotate API keys periodically
4. ✅ Use separate DeployHQ users for different environments
5. ❌ Don't share your Claude Desktop config file
6. ❌ Don't commit config files to version control

### For Server Operators

1. ✅ Always use HTTPS in production
2. ✅ Never log credential headers
3. ✅ Validate all credentials before use
4. ✅ Create per-request client instances
5. ✅ Monitor for authentication failures
6. ❌ Don't store customer credentials server-side
7. ❌ Don't reuse client instances across requests

## Future Enhancements

Potential improvements for consideration:

1. **OAuth 2.0 Support** - If DeployHQ adds OAuth support
2. **API Key Rotation** - Automatic key rotation support
3. **Rate Limiting** - Per-customer rate limits
4. **Audit Logging** - Track API usage per customer (without credentials)
5. **Token Exchange** - Short-lived tokens instead of API keys

## FAQ

### Q: Are credentials stored on the server?
**A**: No. Credentials are only stored in the customer's Claude Desktop config file and passed via headers on each request.

### Q: Can other customers see my credentials?
**A**: No. Each connection is isolated with its own client instance.

### Q: What happens if my API key is compromised?
**A**: Revoke it in DeployHQ Settings → Security and update your Claude Desktop config.

### Q: Can I use the same server with multiple DeployHQ accounts?
**A**: Yes! Just configure different MCP server entries in Claude Desktop, each with different credentials.

### Q: Why not use environment variables?
**A**: Environment variables work for single-tenant (self-hosted) but don't support multiple customers on a shared hosted server.

### Q: Are headers secure?
**A**: Yes, when transmitted over HTTPS. Headers are encrypted in transit and not logged by default.

## Related Documentation

- [USER_GUIDE.md](./USER_GUIDE.md) - Complete setup instructions
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Digital Ocean deployment guide
- [README.md](../README.md) - Project overview
