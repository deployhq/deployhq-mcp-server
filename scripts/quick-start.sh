#!/bin/bash

# DeployHQ MCP Server - Quick Start Script
# This script helps you set up the development environment quickly

set -e

echo "🚀 DeployHQ MCP Server - Quick Start"
echo "===================================="
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Error: Node.js 20 or higher is required"
    echo "   Current version: $(node -v)"
    echo "   Please upgrade Node.js and try again"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "⚙️  Setting up environment..."
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo ""
    echo "⚠️  Please edit .env and add your DeployHQ credentials:"
    echo "   - DEPLOYHQ_USERNAME (your email)"
    echo "   - DEPLOYHQ_PASSWORD (your API key)"
    echo "   - DEPLOYHQ_ACCOUNT (your account name)"
    echo ""
    read -p "Press Enter to edit .env now, or Ctrl+C to exit and edit manually..."
    ${EDITOR:-nano} .env
else
    echo "✅ .env file already exists"
fi
echo ""

# Type check
echo "🔍 Running type check..."
npm run type-check
echo "✅ Type check passed"
echo ""

# Build
echo "🔨 Building project..."
npm run build
echo "✅ Build completed"
echo ""

# Test health endpoint preparation
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify your .env file has correct DeployHQ credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Test the health endpoint: curl http://localhost:8080/health"
echo "4. Configure Claude Desktop (see docs/USER_GUIDE.md)"
echo ""
echo "For deployment instructions, see docs/DEPLOYMENT.md"
echo ""
