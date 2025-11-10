#!/bin/bash
# Test script for HTTP transport endpoint

set -e

echo "Testing HTTP Transport Endpoint"
echo "================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    echo "Please create .env file with DeployHQ credentials"
    exit 1
fi

# Load environment variables
source .env

if [ -z "$DEPLOYHQ_USERNAME" ] || [ -z "$DEPLOYHQ_PASSWORD" ] || [ -z "$DEPLOYHQ_ACCOUNT" ]; then
    echo "Error: Missing required environment variables"
    echo "Please set DEPLOYHQ_USERNAME, DEPLOYHQ_PASSWORD, and DEPLOYHQ_ACCOUNT in .env"
    exit 1
fi

BASE_URL="http://localhost:8080"

echo "1. Testing initialize request..."
echo ""

INIT_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "X-DeployHQ-Username: $DEPLOYHQ_USERNAME" \
  -H "X-DeployHQ-Password: $DEPLOYHQ_PASSWORD" \
  -H "X-DeployHQ-Account: $DEPLOYHQ_ACCOUNT" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    },
    "id": 1
  }')

echo "Initialize Response:"
echo "$INIT_RESPONSE" | jq .
echo ""

echo "2. Testing tools/list request..."
echo ""

TOOLS_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "X-DeployHQ-Username: $DEPLOYHQ_USERNAME" \
  -H "X-DeployHQ-Password: $DEPLOYHQ_PASSWORD" \
  -H "X-DeployHQ-Account: $DEPLOYHQ_ACCOUNT" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 2
  }')

echo "Tools List Response:"
echo "$TOOLS_RESPONSE" | jq .
echo ""

echo "3. Testing tools/call request (list_projects)..."
echo ""

CALL_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "X-DeployHQ-Username: $DEPLOYHQ_USERNAME" \
  -H "X-DeployHQ-Password: $DEPLOYHQ_PASSWORD" \
  -H "X-DeployHQ-Account: $DEPLOYHQ_ACCOUNT" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "list_projects",
      "arguments": {}
    },
    "id": 3
  }')

echo "Tool Call Response:"
echo "$CALL_RESPONSE" | jq .
echo ""

echo "4. Testing authentication failure (missing headers)..."
echo ""

AUTH_ERROR=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 4
  }')

echo "Auth Error Response:"
echo "$AUTH_ERROR" | head -n -1 | jq .
echo "HTTP Status: $(echo "$AUTH_ERROR" | tail -n 1 | cut -d':' -f2)"
echo ""

echo "✅ All tests completed!"
