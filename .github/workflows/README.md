# GitHub Actions CI/CD Workflows

This repository uses GitHub Actions for continuous integration and automated npm publishing.

## Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers**: Push or PR to `main` or `develop` branches

**What it does**:
- Runs on Node.js 18.x, 20.x, and 22.x
- Lints code with ESLint
- Type checks with TypeScript
- Runs full test suite (108 tests)
- Builds the project
- Verifies build artifacts exist
- Tests module loading

**Status**: Must pass before code can be merged

### 2. Publish Workflow (`publish.yml`)

**Triggers**: Automatically after CI workflow succeeds on `main` branch

**What it does**:
1. Waits for CI workflow to complete successfully
2. Checks out code and installs dependencies
3. Builds the project
4. Extracts version from `package.json`
5. Verifies package contents with `npm pack --dry-run`
6. Publishes to npm registry (public package)
7. Creates GitHub Release with tag `v{version}`

**Dependencies**: Only runs if CI workflow passes

## Setup Requirements

### npm Token (Required for Publishing)

You need to add an `NPM_TOKEN` secret to your GitHub repository:

1. **Generate npm token**:
   ```bash
   npm login
   npm token create --type automation
   ```

2. **Add to GitHub**:
   - Go to: `https://github.com/deployhq/deployhq-mcp-server/settings/secrets/actions`
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your npm automation token

### GitHub Token (Automatic)

The `GITHUB_TOKEN` is automatically provided by GitHub Actions - no setup needed.

## Publishing Process

### Automatic Publishing (Recommended)

When you merge to `main`:

```bash
# 1. Create PR with version bump
git checkout -b release/v1.0.1
npm version patch  # or minor, major
git push origin release/v1.0.1

# 2. Create and merge PR to main
# GitHub Actions will automatically:
# - Run CI tests
# - Publish to npm (if CI passes)
# - Create GitHub release
```

### Manual Publishing (Not Recommended)

If you need to publish manually:

```bash
npm run build
npm publish
```

## Version Management

Follow semantic versioning (SemVer):

- **Patch** (`1.0.x`): Bug fixes, small changes
  ```bash
  npm version patch
  ```

- **Minor** (`1.x.0`): New features, backwards compatible
  ```bash
  npm version minor
  ```

- **Major** (`x.0.0`): Breaking changes
  ```bash
  npm version major
  ```

## Workflow Diagram

```
┌─────────────────────────────────────────────────────┐
│  Push/PR to main/develop                            │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  CI Workflow (ci.yml)                               │
│  ├─ Lint                                            │
│  ├─ Type Check                                      │
│  ├─ Test (108 tests)                                │
│  ├─ Build                                           │
│  └─ Verify artifacts                                │
└────────────────┬────────────────────────────────────┘
                 │
                 │ (only on main branch)
                 ▼
┌─────────────────────────────────────────────────────┐
│  Publish Workflow (publish.yml)                     │
│  ├─ Wait for CI to succeed                          │
│  ├─ Build project                                   │
│  ├─ Verify package                                  │
│  ├─ Publish to npm                                  │
│  └─ Create GitHub Release                           │
└─────────────────────────────────────────────────────┘
```

## Monitoring

### View Workflow Runs
- GitHub Actions tab: https://github.com/deployhq/deployhq-mcp-server/actions

### Check Published Packages
- npm package: https://www.npmjs.com/package/deployhq-mcp-server
- GitHub Releases: https://github.com/deployhq/deployhq-mcp-server/releases

## Troubleshooting

### Publish workflow doesn't run
- Verify CI workflow completed successfully
- Check that push was to `main` branch
- Check GitHub Actions tab for workflow status

### npm publish fails
- Verify `NPM_TOKEN` secret is set correctly
- Check token hasn't expired: `npm token list`
- Verify package name isn't taken
- Check version hasn't been published already

### GitHub Release fails
- Usually safe to ignore if npm publish succeeded
- Can manually create release from GitHub UI
- Check `GITHUB_TOKEN` permissions

## Security Notes

- Never commit `NPM_TOKEN` to repository
- Use automation tokens for CI/CD, not personal tokens
- Rotate tokens regularly
- Limit token scope to publishing only
