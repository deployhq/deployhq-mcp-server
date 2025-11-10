# Contributing to DeployHQ MCP Server

Thank you for considering contributing to the DeployHQ MCP Server! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

1. **Clear title** describing the issue
2. **Detailed description** of the problem
3. **Steps to reproduce** the issue
4. **Expected behavior** vs. actual behavior
5. **Environment details**:
   - Node.js version
   - Operating system
   - Deployment environment (local, Digital Ocean, etc.)
6. **Logs or screenshots** if applicable

### Suggesting Features

Feature suggestions are welcome! Please create an issue with:

1. **Clear title** describing the feature
2. **Use case** - why is this feature needed?
3. **Proposed solution** - how should it work?
4. **Alternatives considered** - other ways to solve the problem
5. **Additional context** - mockups, examples, etc.

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test your changes** thoroughly
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

## 📋 Development Setup

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Git
- DeployHQ account for testing

### Local Setup

1. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/deployhq-mcp-server.git
   cd deployhq-mcp-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Run linter**:
   ```bash
   npm run lint
   ```

6. **Run type check**:
   ```bash
   npm run type-check
   ```

7. **Build project**:
   ```bash
   npm run build
   ```

## 🧪 Testing

### Manual Testing

1. **Test health endpoint**:
   ```bash
   curl http://localhost:8080/health
   ```

2. **Test SSE endpoint**:
   ```bash
   curl -N http://localhost:8080/sse
   ```

3. **Test with Claude Desktop**:
   - Configure Claude Desktop with local server
   - Test each tool function
   - Verify error handling

### Docker Testing

```bash
# Build Docker image
docker build -t deployhq-mcp-server:test .

# Run container
docker run -p 8080:8080 \
  -e DEPLOYHQ_USERNAME=your-email \
  -e DEPLOYHQ_PASSWORD=your-api-key \
  -e DEPLOYHQ_ACCOUNT=your-account \
  deployhq-mcp-server:test

# Test health check
curl http://localhost:8080/health
```

## 📝 Code Style

### TypeScript Guidelines

- Use **strict mode** TypeScript
- Add **explicit return types** for functions
- Use **const** for immutable values
- Avoid **any** types when possible
- Add **JSDoc comments** for public APIs

### Code Organization

```typescript
// 1. Imports
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// 2. Types and interfaces
export interface MyInterface {
  field: string;
}

// 3. Constants
const DEFAULT_TIMEOUT = 30000;

// 4. Functions
export function myFunction(): string {
  return 'hello';
}

// 5. Classes
export class MyClass {
  constructor() {
    // ...
  }
}
```

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase` (no `I` prefix)
- **Types**: `PascalCase`

### Error Handling

```typescript
// Good - specific error classes
throw new DeployHQError('Failed to fetch projects', 500);

// Good - error context
try {
  await api.call();
} catch (error) {
  log.error('API call failed', { error, context: 'additional info' });
  throw error;
}

// Bad - generic errors
throw new Error('Something went wrong');
```

### Logging

```typescript
// Good - structured logging
log.info('Deployment created', { project, deploymentId });
log.error('Request failed', { url, statusCode, error });

// Bad - unstructured logging
console.log('Deployment created: ' + deploymentId);
```

## 🔒 Security

### Never Commit Secrets

- Use `.env` for local development
- Add sensitive files to `.gitignore`
- Use environment variables for all credentials
- Never log credentials or API keys

### Input Validation

- Validate all user inputs with Zod
- Sanitize error messages
- Use parameterized queries
- Escape output when necessary

### Security Checklist

- [ ] No hardcoded credentials
- [ ] Input validation on all endpoints
- [ ] Proper error handling (no stack traces to users)
- [ ] Secure environment variable handling
- [ ] No sensitive data in logs
- [ ] HTTPS enforced in production

## 📚 Documentation

### Code Comments

```typescript
/**
 * Creates a new deployment for a project
 * @param project - Project permalink
 * @param params - Deployment parameters
 * @returns Created deployment details
 * @throws {ValidationError} If parameters are invalid
 * @throws {AuthenticationError} If credentials are invalid
 */
async function createDeployment(
  project: string,
  params: CreateDeploymentParams
): Promise<Deployment> {
  // Implementation
}
```

### README Updates

When adding features, update:
- [ ] README.md - Feature list and usage
- [ ] USER_GUIDE.md - User-facing documentation
- [ ] CHANGELOG.md - Version history
- [ ] API documentation if applicable

## 🔄 Git Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add server groups support
fix: resolve authentication timeout issue
docs: update deployment guide
refactor: simplify error handling
test: add integration tests for deployments
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
```

## 🚀 Release Process

1. **Update version** in `package.json`
2. **Update CHANGELOG.md** with changes
3. **Create release branch**: `release/v1.x.x`
4. **Test thoroughly**
5. **Merge to main**
6. **Tag release**: `git tag v1.x.x`
7. **Push tags**: `git push --tags`
8. **Create GitHub release** with changelog

## 📞 Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Chat**: Join our community (if available)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors are recognized in:
- GitHub contributors page
- CHANGELOG.md for significant contributions
- README.md acknowledgments section

Thank you for contributing! 🎉
