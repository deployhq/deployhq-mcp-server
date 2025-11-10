# Deployment Guide

Comprehensive guide for deploying the DeployHQ MCP Server to Digital Ocean App Platform.

## 📋 Prerequisites

Before deploying, ensure you have:

- [ ] Digital Ocean account ([sign up here](https://www.digitalocean.com))
- [ ] GitHub account with repository access
- [ ] DeployHQ account with API credentials
- [ ] `doctl` CLI installed (optional, for CLI deployment)
- [ ] Domain name (optional, for custom domain)

## 🚀 Deployment Steps

### Step 1: Prepare Your Repository

1. **Fork or clone this repository**:
   ```bash
   git clone https://github.com/your-username/deployhq-mcp-server.git
   cd deployhq-mcp-server
   ```

2. **Update configuration files**:
   - Edit `.do/app.yaml` and update the `github.repo` field
   - Review instance size (default: `basic-xxs`)
   - Adjust region if needed (default: `nyc`)

3. **Commit and push**:
   ```bash
   git add .
   git commit -m "Configure for deployment"
   git push origin main
   ```

### Step 2: Deploy to Digital Ocean (Dashboard Method)

1. **Log in to Digital Ocean**:
   - Go to https://cloud.digitalocean.com
   - Navigate to Apps

2. **Create New App**:
   - Click "Create App"
   - Choose "GitHub" as source
   - Authorize Digital Ocean to access your repositories
   - Select your `deployhq-mcp-server` repository
   - Choose the `main` branch
   - Click "Next"

3. **Configure Build Settings**:
   - Digital Ocean should auto-detect the Dockerfile
   - Or it will use the `.do/app.yaml` configuration
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - HTTP Port: `8080`
   - Click "Next"

4. **Set Environment Variables**:
   Click "Edit" next to environment variables and add:

   **Required Variables** (mark as encrypted):
   ```
   DEPLOYHQ_USERNAME=your-email@example.com
   DEPLOYHQ_PASSWORD=your-40-character-api-key
   DEPLOYHQ_ACCOUNT=your-account-name
   ```

   **Optional Variables**:
   ```
   NODE_ENV=production
   PORT=8080
   LOG_LEVEL=info
   ```

   Click "Next"

5. **Review and Deploy**:
   - Choose your plan (Basic is fine for most use cases)
   - Instance size: `basic-xxs` ($5/month)
   - Review the configuration
   - Click "Create Resources"

6. **Wait for Deployment**:
   - Initial deployment takes 5-10 minutes
   - You can monitor progress in the "Activity" tab
   - Once deployed, you'll see a URL like `https://deployhq-mcp-server-xxxxx.ondigitalocean.app`

### Step 3: Deploy Using doctl CLI (Alternative)

1. **Install doctl**:

   **macOS**:
   ```bash
   brew install doctl
   ```

   **Linux**:
   ```bash
   cd ~
   wget https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz
   tar xf doctl-1.104.0-linux-amd64.tar.gz
   sudo mv doctl /usr/local/bin
   ```

   **Windows**:
   Download from https://github.com/digitalocean/doctl/releases

2. **Authenticate**:
   ```bash
   doctl auth init
   ```
   Enter your Digital Ocean API token when prompted.

3. **Validate app spec**:
   ```bash
   doctl apps spec validate .do/app.yaml
   ```

4. **Create the app**:
   ```bash
   doctl apps create --spec .do/app.yaml
   ```

5. **Get app ID**:
   ```bash
   doctl apps list
   ```
   Note your app ID from the output.

6. **Set environment variables**:
   ```bash
   # Create a temporary file with your secrets
   cat > /tmp/app-secrets.yaml <<EOF
   name: deployhq-mcp-server
   services:
   - name: mcp-server
     envs:
     - key: DEPLOYHQ_USERNAME
       value: your-email@example.com
       scope: RUN_TIME
       type: SECRET
     - key: DEPLOYHQ_PASSWORD
       value: your-40-character-api-key
       scope: RUN_TIME
       type: SECRET
     - key: DEPLOYHQ_ACCOUNT
       value: your-account-name
       scope: RUN_TIME
       type: SECRET
   EOF

   # Update the app
   doctl apps update YOUR_APP_ID --spec /tmp/app-secrets.yaml

   # Clean up
   rm /tmp/app-secrets.yaml
   ```

7. **Monitor deployment**:
   ```bash
   doctl apps list-deployments YOUR_APP_ID
   ```

### Step 4: Verify Deployment

1. **Check health endpoint**:
   ```bash
   curl https://your-app-url.ondigitalocean.app/health
   ```

   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2024-01-15T10:30:00.000Z",
     "service": "deployhq-mcp-server",
     "version": "1.0.0"
   }
   ```

2. **Test SSE endpoint**:
   ```bash
   curl -N https://your-app-url.ondigitalocean.app/sse
   ```

   You should see SSE event stream start.

3. **Check logs**:
   - Dashboard: Go to your app → Runtime Logs
   - CLI: `doctl apps logs YOUR_APP_ID --follow`

### Step 5: Configure Custom Domain (Optional)

1. **Add domain in Digital Ocean**:
   - Go to your app → Settings → Domains
   - Click "Add Domain"
   - Enter `mcp.deployhq.com`
   - Click "Add Domain"

2. **Update DNS records**:
   Digital Ocean will provide DNS configuration. Add these records to your DNS provider:

   **For CNAME (recommended)**:
   ```
   Type: CNAME
   Name: mcp
   Value: your-app-url.ondigitalocean.app
   TTL: 3600
   ```

   **For A Record**:
   ```
   Type: A
   Name: mcp
   Value: [IP address provided by Digital Ocean]
   TTL: 3600
   ```

3. **Wait for propagation**:
   - DNS changes can take 5 minutes to 48 hours
   - Check status in Digital Ocean dashboard
   - Test with: `nslookup mcp.deployhq.com`

4. **Update Claude Desktop config**:
   ```json
   {
     "mcpServers": {
       "deployhq": {
         "url": "https://mcp.deployhq.com/sse",
         "env": {
           "DEPLOYHQ_USERNAME": "your-email@example.com",
           "DEPLOYHQ_PASSWORD": "your-api-key",
           "DEPLOYHQ_ACCOUNT": "your-account"
         }
       }
     }
   }
   ```

## 🔄 Continuous Deployment

### Automatic Deployments

Once configured, Digital Ocean will automatically deploy when you push to the `main` branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

### Manual Deployments

Force a deployment without code changes:

**Dashboard**:
- Go to your app → Deployments
- Click "Create Deployment"
- Select the branch
- Click "Deploy"

**CLI**:
```bash
doctl apps create-deployment YOUR_APP_ID
```

## 📊 Monitoring and Maintenance

### View Logs

**Dashboard**:
- Navigate to Apps → Your App → Runtime Logs
- Filter by severity, component, or time range

**CLI**:
```bash
# Follow logs in real-time
doctl apps logs YOUR_APP_ID --follow

# Get recent logs
doctl apps logs YOUR_APP_ID --tail 100

# Filter by type
doctl apps logs YOUR_APP_ID --type run
```

### Monitor Performance

1. **Metrics Dashboard**:
   - Go to Apps → Your App → Insights
   - View CPU, memory, and bandwidth usage
   - Monitor response times and error rates

2. **Set Up Alerts**:
   - Go to Settings → Alerts
   - Configure alerts for:
     - Deployment failures
     - High error rates
     - Resource usage
     - Health check failures

3. **Review Health Checks**:
   - Health check runs every 30 seconds
   - 3 consecutive failures triggers alert
   - Check configuration in `.do/app.yaml`

### Scaling

**Vertical Scaling** (increase instance size):
```bash
doctl apps update YOUR_APP_ID --spec .do/app.yaml
```

Update `instance_size_slug` in `.do/app.yaml`:
- `basic-xxs` - $5/month - 512MB RAM, 1 vCPU
- `basic-xs` - $12/month - 1GB RAM, 1 vCPU
- `basic-s` - $24/month - 2GB RAM, 1 vCPU

**Horizontal Scaling** (increase instance count):
Update `instance_count` in `.do/app.yaml`, then:
```bash
doctl apps update YOUR_APP_ID --spec .do/app.yaml
```

## 🔒 Security Considerations

### Environment Variables

**Best Practices**:
- Always use `type: SECRET` for credentials
- Never commit secrets to git
- Rotate API keys regularly
- Use separate credentials per environment

**Updating Secrets**:
```bash
# Update via dashboard (recommended)
# Apps → Settings → Environment Variables → Edit

# Or via CLI
doctl apps update YOUR_APP_ID --spec updated-spec.yaml
```

### HTTPS/TLS

- Digital Ocean provides automatic HTTPS
- Certificates are managed automatically
- Force HTTPS is enabled by default
- Custom domains get automatic SSL certificates

### Network Security

- Outbound traffic to DeployHQ API only
- No inbound database connections needed
- Firewall rules managed by Digital Ocean
- DDoS protection included

## 🐛 Troubleshooting

### Deployment Fails

**Check build logs**:
```bash
doctl apps logs YOUR_APP_ID --type build
```

**Common issues**:
- Missing dependencies: Check `package.json`
- TypeScript errors: Run `npm run type-check` locally
- Out of memory: Increase instance size

### Health Check Fails

**Verify health endpoint**:
```bash
curl https://your-app-url/health
```

**Common issues**:
- Wrong port configuration
- Environment variables not set
- DeployHQ API unreachable

### Authentication Errors

**Verify credentials**:
1. Check environment variables in dashboard
2. Test credentials with DeployHQ API directly:
   ```bash
   curl -u "email:api-key" https://account.deployhq.com/projects
   ```
3. Ensure variables are marked as `SECRET` type

### Connection Timeout

**Check server status**:
```bash
curl -I https://your-app-url/health
```

**Common issues**:
- App is sleeping (upgrade from free tier)
- Network connectivity
- Health check misconfiguration

## 💰 Cost Estimation

### Basic Deployment

- **App Platform**: $5/month (basic-xxs)
- **Bandwidth**: 100GB included
- **Storage**: Not applicable (stateless app)
- **Total**: ~$5/month

### Production Deployment

- **App Platform**: $12/month (basic-xs)
- **Custom Domain**: Free (bring your own)
- **SSL Certificate**: Free (automatic)
- **Total**: ~$12/month

### High Availability

- **App Platform**: $24/month (basic-s)
- **Multiple Instances**: 2x for redundancy
- **Total**: ~$48/month

## 📞 Support

### Digital Ocean Support

- **Documentation**: https://docs.digitalocean.com/products/app-platform/
- **Community**: https://www.digitalocean.com/community
- **Support Tickets**: https://cloud.digitalocean.com/support/tickets

### Project Support

- **GitHub Issues**: [your-repo-url/issues]
- **Documentation**: See README.md and USER_GUIDE.md

## 📚 Additional Resources

- [Digital Ocean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [App Spec Reference](https://docs.digitalocean.com/products/app-platform/reference/app-spec/)
- [doctl CLI Reference](https://docs.digitalocean.com/reference/doctl/)
- [DeployHQ API Docs](https://www.deployhq.com/support/api)
