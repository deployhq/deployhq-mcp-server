#!/bin/bash

# DeployHQ MCP Server - Verification Script
# Verifies the project structure and configuration

set -e

echo "🔍 DeployHQ MCP Server - Project Verification"
echo "=============================================="
echo ""

ERRORS=0
WARNINGS=0

# Check function
check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
    else
        echo "❌ $1 (MISSING)"
        ERRORS=$((ERRORS + 1))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo "✅ $1/"
    else
        echo "❌ $1/ (MISSING)"
        ERRORS=$((ERRORS + 1))
    fi
}

# Check project structure
echo "📁 Checking project structure..."
check_file "package.json"
check_file "tsconfig.json"
check_file "Dockerfile"
check_file ".gitignore"
check_file ".dockerignore"
check_file ".env.example"
check_file "README.md"
check_file "LICENSE"
check_file "CHANGELOG.md"
check_file "CONTRIBUTING.md"
echo ""

# Check source files
echo "📝 Checking source files..."
check_dir "src"
check_file "src/index.ts"
check_file "src/server.ts"
check_file "src/tools.ts"
check_file "src/api-client.ts"
echo ""

# Check documentation
echo "📚 Checking documentation..."
check_dir "docs"
check_file "docs/USER_GUIDE.md"
check_file "docs/DEPLOYMENT.md"
echo ""

# Check deployment config
echo "🚀 Checking deployment configuration..."
check_dir ".do"
check_file ".do/app.yaml"
check_dir ".github/workflows"
check_file ".github/workflows/ci.yml"
echo ""

# Check Node.js
echo "🔧 Checking environment..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js: $NODE_VERSION"

    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 20 ]; then
        echo "⚠️  Warning: Node.js 20+ is recommended (current: $NODE_VERSION)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "❌ Node.js not found"
    ERRORS=$((ERRORS + 1))
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check dependencies
if [ -d "node_modules" ]; then
    echo "✅ node_modules/ (dependencies installed)"
else
    echo "⚠️  node_modules/ not found (run: npm install)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check environment file
if [ -f ".env" ]; then
    echo "✅ .env file exists"

    # Check for required variables
    if grep -q "DEPLOYHQ_USERNAME=" .env; then
        if grep -q "DEPLOYHQ_USERNAME=your-email" .env; then
            echo "⚠️  .env contains placeholder values - update with real credentials"
            WARNINGS=$((WARNINGS + 1))
        else
            echo "✅ DEPLOYHQ_USERNAME configured"
        fi
    else
        echo "⚠️  DEPLOYHQ_USERNAME not found in .env"
        WARNINGS=$((WARNINGS + 1))
    fi

    if grep -q "DEPLOYHQ_PASSWORD=" .env; then
        echo "✅ DEPLOYHQ_PASSWORD configured"
    else
        echo "⚠️  DEPLOYHQ_PASSWORD not found in .env"
        WARNINGS=$((WARNINGS + 1))
    fi

    if grep -q "DEPLOYHQ_ACCOUNT=" .env; then
        echo "✅ DEPLOYHQ_ACCOUNT configured"
    else
        echo "⚠️  DEPLOYHQ_ACCOUNT not found in .env"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "⚠️  .env file not found (copy from .env.example)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check TypeScript compilation
if [ -d "node_modules" ]; then
    echo "🔨 Checking TypeScript compilation..."
    if npm run type-check &> /dev/null; then
        echo "✅ TypeScript type check passed"
    else
        echo "❌ TypeScript type check failed"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "⚠️  Skipping TypeScript check (install dependencies first)"
fi
echo ""

# Summary
echo "📊 Verification Summary"
echo "======================"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "🎉 All checks passed! Project is ready."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  $WARNINGS warning(s) found"
    echo "The project should work, but review warnings above."
    exit 0
else
    echo "❌ $ERRORS error(s) and $WARNINGS warning(s) found"
    echo "Please fix the errors above before proceeding."
    exit 1
fi
