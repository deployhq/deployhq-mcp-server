# DeployHQ MCP Server - Project Summary

## 📦 What This Project Does

The DeployHQ MCP Server is a hosted Model Context Protocol (MCP) server that enables AI assistants like Claude to interact with your DeployHQ deployments. It provides a bridge between Claude Desktop and the DeployHQ API, allowing you to manage deployments through natural language conversations.

## 🏗️ Architecture

```
┌─────────────────────┐
│   Claude Desktop    │
│   (MCP Client)      │
└──────────┬──────────┘
           │ SSE/HTTPS
           ↓
┌─────────────────────┐
│   Express Server    │
│   (Port 8080)       │
│                     │
│  ┌──────────────┐   │
│  │ MCP Server   │   │
│  │ + SSE Trans. │   │
│  └──────────────┘   │
│                     │
│  ┌──────────────┐   │
│  │ DeployHQ API │   │
│  │   Client     │   │
│  └──────────────┘   │
└──────────┬──────────┘
           │ HTTPS
           │ Basic Auth
           ↓
┌─────────────────────┐
│   DeployHQ API      │
│ (api.deployhq.com)  │
└─────────────────────┘
```

## 🔧 Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript (strict mode)
- **Framework**: Express.js
- **MCP SDK**: @modelcontextprotocol/sdk v1.0.4
- **Transport**: SSE (Server-Sent Events)
- **Validation**: Zod schemas
- **Deployment**: Docker on Digital Ocean App Platform

## 📁 Project Structure

```
deployhq-mcp-server/
├── src/
│   ├── index.ts          # Express server with SSE endpoint
│   ├── server.ts         # MCP server initialization (stdio version)
│   ├── tools.ts          # Tool definitions with Zod schemas
│   └── api-client.ts     # DeployHQ API wrapper with auth
│
├── docs/
│   ├── USER_GUIDE.md              # Claude Desktop setup guide
│   ├── DEPLOYMENT.md              # Digital Ocean deployment guide
│   └── claude-desktop-config.json # Example MCP config
│
├── scripts/
│   ├── quick-start.sh    # Quick setup script
│   └── verify.sh         # Project verification script
│
├── .do/
│   └── app.yaml          # Digital Ocean App Platform config
│
├── .github/
│   └── workflows/
│       └── ci.yml        # GitHub Actions CI pipeline
│
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── Dockerfile            # Multi-stage container build
├── .env.example          # Environment variable template
├── .gitignore            # Git ignore rules
├── .dockerignore         # Docker ignore rules
├── eslint.config.js      # ESLint configuration
├── README.md             # Main documentation
├── CHANGELOG.md          # Version history
├── CONTRIBUTING.md       # Contribution guidelines
└── LICENSE               # MIT License
```

## 🛠️ Available MCP Tools

### 1. `list_projects`
- **Purpose**: List all DeployHQ projects
- **Parameters**: None
- **Returns**: Array of project objects with repository info

### 2. `get_project`
- **Purpose**: Get detailed project information
- **Parameters**: `permalink` (project identifier)
- **Returns**: Full project details

### 3. `list_servers`
- **Purpose**: List all servers for a project
- **Parameters**: `project` (project permalink)
- **Returns**: Array of server configurations

### 4. `list_deployments`
- **Purpose**: List deployments with pagination
- **Parameters**: `project`, `page` (optional), `server_uuid` (optional)
- **Returns**: Paginated deployment list

### 5. `get_deployment`
- **Purpose**: Get deployment details and status
- **Parameters**: `project`, `uuid`
- **Returns**: Full deployment information with logs

### 6. `create_deployment`
- **Purpose**: Create a new deployment
- **Parameters**: `project`, `parent_identifier`, `start_revision`, `end_revision`, plus optional params
- **Returns**: Created deployment details

## 🔐 Authentication

- **Method**: HTTP Basic Authentication
- **Username**: DeployHQ email address
- **Password**: 40-character API key
- **Configuration**: Environment variables via `.env` or Digital Ocean secrets

## 🚀 Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Run development server
npm run dev

# 4. Test
curl http://localhost:8080/health
```

### Production Deployment

```bash
# Deploy to Digital Ocean
doctl apps create --spec .do/app.yaml

# Or use the dashboard
# See docs/DEPLOYMENT.md for detailed instructions
```

## 📊 Key Features

### Production-Ready
- ✅ Comprehensive error handling
- ✅ Request timeout (30s)
- ✅ Graceful shutdown
- ✅ Health check endpoint
- ✅ Structured logging
- ✅ Security best practices

### Type Safety
- ✅ TypeScript strict mode
- ✅ Zod schema validation
- ✅ Full type inference
- ✅ Explicit return types

### DevOps
- ✅ Multi-stage Docker build
- ✅ Non-root container user
- ✅ Health check configuration
- ✅ GitHub Actions CI
- ✅ Auto-deployment on push

### Documentation
- ✅ Comprehensive README
- ✅ User guide with examples
- ✅ Deployment instructions
- ✅ API documentation
- ✅ Contributing guidelines

## 🔒 Security Features

1. **Credential Management**
   - Environment variables for secrets
   - No hardcoded credentials
   - Secure logging (credentials filtered)

2. **Input Validation**
   - Zod schema validation
   - Type-safe parameters
   - Sanitized error messages

3. **Network Security**
   - HTTPS in production
   - Basic Auth for API calls
   - Request timeouts
   - CORS configuration

4. **Container Security**
   - Non-root user
   - Minimal base image
   - Multi-stage builds
   - Health checks

## 📈 Performance Characteristics

- **Startup Time**: ~2-3 seconds
- **Memory Usage**: ~50-100MB
- **Response Time**: <200ms (health check)
- **Request Timeout**: 30 seconds
- **Container Size**: ~150MB (compressed)

## 🧪 Testing Strategy

### Manual Testing
```bash
# Health check
curl http://localhost:8080/health

# SSE endpoint
curl -N http://localhost:8080/sse

# With Claude Desktop
# See docs/USER_GUIDE.md
```

### CI/CD Testing
- TypeScript type checking
- ESLint validation
- Docker build test
- Automated on every push

## 💰 Cost Estimation

### Digital Ocean App Platform
- **Basic (XXS)**: $5/month - 512MB RAM, 1 vCPU
- **Basic (XS)**: $12/month - 1GB RAM, 1 vCPU
- **Basic (S)**: $24/month - 2GB RAM, 1 vCPU

### Included
- 100GB bandwidth
- Automatic HTTPS/SSL
- Free custom domain
- Health checks
- Monitoring
- Logs

## 🔄 Development Workflow

### Local Development
```bash
npm run dev      # Start with hot reload
npm run build    # Compile TypeScript
npm run lint     # Run ESLint
npm run type-check  # TypeScript validation
```

### Git Workflow
```bash
# Feature branch
git checkout -b feature/my-feature

# Commit
git commit -m "feat: add amazing feature"

# Push and deploy
git push origin main  # Auto-deploys on Digital Ocean
```

## 📚 Documentation Index

1. **README.md** - Overview and quick start
2. **docs/USER_GUIDE.md** - Claude Desktop setup and usage
3. **docs/DEPLOYMENT.md** - Digital Ocean deployment guide
4. **docs/claude-desktop-config.json** - Example MCP configuration
5. **CONTRIBUTING.md** - Development guidelines
6. **CHANGELOG.md** - Version history

## 🎯 Use Cases

### 1. Deployment Monitoring
"Show me all deployments from the last day"
- Claude uses `list_deployments` with filtering

### 2. Quick Deployments
"Deploy the latest changes to production"
- Claude gets servers, confirms, creates deployment

### 3. Troubleshooting
"Why did my last deployment fail?"
- Claude checks deployment status and analyzes logs

### 4. Status Checks
"What's deployed on staging right now?"
- Claude lists deployments and shows current state

## 🚧 Limitations

- **Read-heavy**: Optimized for read operations (listing, getting)
- **No caching**: Each request hits DeployHQ API
- **Rate limits**: Subject to DeployHQ API rate limits
- **Single account**: One DeployHQ account per server instance

## 🔮 Future Enhancements

- [ ] Server groups management
- [ ] Config files management
- [ ] Webhook support
- [ ] Caching layer
- [ ] Multi-account support
- [ ] Advanced deployment strategies
- [ ] Rollback support
- [ ] Metrics and analytics

## 📞 Support Resources

- **GitHub Issues**: Bug reports and features
- **DeployHQ API Docs**: https://www.deployhq.com/support/api
- **MCP Docs**: https://modelcontextprotocol.io
- **Digital Ocean Docs**: https://docs.digitalocean.com/products/app-platform/

## ✅ Deployment Checklist

- [ ] Fork/clone repository
- [ ] Update `.do/app.yaml` with repo URL
- [ ] Create Digital Ocean app
- [ ] Set environment variables (secrets)
- [ ] Deploy and verify health endpoint
- [ ] Configure custom domain (optional)
- [ ] Set up Claude Desktop
- [ ] Test with sample conversations
- [ ] Monitor logs and metrics
- [ ] Set up alerts

## 🎉 Success Criteria

Your deployment is successful when:
1. ✅ Health endpoint returns 200 OK
2. ✅ SSE endpoint accepts connections
3. ✅ Claude Desktop can list tools
4. ✅ Test deployment succeeds
5. ✅ No errors in application logs

## 📄 License

MIT License - See LICENSE file for details

---

**Version**: 1.0.0
**Last Updated**: 2024-01-15
**Maintained By**: DeployHQ MCP Server Contributors
