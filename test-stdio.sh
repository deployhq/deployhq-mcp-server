#!/bin/bash

# Test script for stdio transport
echo "Testing DeployHQ MCP Server (stdio transport)"
echo "=============================================="
echo ""

# Check if credentials are set
if [ -z "$DEPLOYHQ_USERNAME" ] || [ -z "$DEPLOYHQ_PASSWORD" ] || [ -z "$DEPLOYHQ_ACCOUNT" ]; then
    echo "Error: Please set environment variables:"
    echo "  export DEPLOYHQ_USERNAME='your-email@example.com'"
    echo "  export DEPLOYHQ_PASSWORD='your-password'"
    echo "  export DEPLOYHQ_ACCOUNT='your-account'"
    exit 1
fi

echo "1. Testing initialize..."
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}},"id":1}' | timeout 2 node dist/stdio.js 2>/dev/null | jq '.result.serverInfo' || echo "Failed"
echo ""

echo "2. Testing tools/list..."
echo '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":2}' | timeout 2 node dist/stdio.js 2>/dev/null | jq '.result.tools | length' || echo "Failed"
echo ""

echo "Done! If you see valid JSON responses above, the server is working correctly."
