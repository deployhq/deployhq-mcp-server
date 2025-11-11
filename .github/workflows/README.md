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

**Triggers**: When a version tag is pushed (e.g., `v1.0.0`)

**What it does**:
1. Checks out code and installs dependencies
2. Builds the project
3. Extracts version from `package.json`
4. Verifies tag version matches package.json version
5. Verifies package contents with `npm pack --dry-run`
6. Publishes to npm registry (public package)
7. Creates GitHub Release with version notes

**Note**: CI workflow should pass before creating release tags

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

### Tag-Based Publishing (Recommended)

Releases are triggered by pushing version tags:

```bash
# 1. Ensure you're on main with latest changes
git checkout main
git pull origin main

# 2. Ensure CI is passing
# Check: https://github.com/deployhq/deployhq-mcp-server/actions

# 3. Bump version in package.json
npm version patch  # 1.0.0 -> 1.0.1 (bug fixes)
npm version minor  # 1.0.0 -> 1.1.0 (new features)
npm version major  # 1.0.0 -> 2.0.0 (breaking changes)

# 4. Push commit and tag
git push origin main
git push origin --tags

# GitHub Actions will automatically:
# - Build the project
# - Verify tag matches package.json version
# - Publish to npm
# - Create GitHub release
```

### Manual Publishing (Not Recommended)

If automated publishing fails, you can publish manually:

```bash
npm run build
npm publish
```

**Important**: Only use manual publishing as a last resort. The automated workflow is more reliable and creates proper GitHub releases.

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
└─────────────────────────────────────────────────────┘

                 (manually create release)

┌─────────────────────────────────────────────────────┐
│  Developer creates version tag                      │
│  $ npm version patch                                │
│  $ git push origin main --tags                      │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Publish Workflow (publish.yml)                     │
│  ├─ Triggered by version tag (v*)                   │
│  ├─ Build project                                   │
│  ├─ Verify tag matches package.json                 │
│  ├─ Verify package contents                         │
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
