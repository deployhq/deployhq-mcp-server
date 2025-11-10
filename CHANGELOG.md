# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added
- Initial release of DeployHQ MCP Server
- MCP server with SSE transport for hosted deployment
- DeployHQ API client with full TypeScript support
- Six core tools:
  - `list_projects` - List all DeployHQ projects
  - `get_project` - Get project details
  - `list_servers` - List servers for a project
  - `list_deployments` - List deployments with pagination
  - `get_deployment` - Get deployment details
  - `create_deployment` - Create new deployments
- Express.js server with health check endpoint
- Docker configuration for containerized deployment
- Digital Ocean App Platform deployment configuration
- Comprehensive error handling and logging
- TypeScript with strict mode
- Zod schema validation for all inputs
- HTTP Basic Authentication for DeployHQ API
- 30-second request timeout
- Graceful shutdown handling
- Production-ready security features
- Complete documentation:
  - README.md with quick start guide
  - USER_GUIDE.md with Claude Desktop setup
  - DEPLOYMENT.md with detailed deployment steps
- Example configuration files
- ESLint configuration for code quality
- MIT License

### Security
- Environment variable-based credential management
- No credential logging
- Input validation and sanitization
- Secure error messages (no credential leaking)
- HTTPS-only in production
- Non-root Docker user

## [Unreleased]

### Planned
- Additional DeployHQ API endpoints:
  - Server groups management
  - Config files management
  - Repository settings
  - Deployment hooks
- Caching layer for improved performance
- Rate limiting support
- Webhook support for real-time updates
- Advanced deployment strategies
- Deployment rollback support
- Multi-account support
- Enhanced logging with structured output
- Metrics and observability integration
- Integration tests
- GitHub Actions CI/CD pipeline
