# Release Process

This document describes how to create a new release of the DeployHQ MCP Server.

## Prerequisites

Before creating a release, ensure you have:

- [ ] Maintainer access to the GitHub repository
- [ ] npm publish access (verify with `npm whoami`)
- [ ] Local `main` branch is up to date
- [ ] All CI checks are passing on `main`

## Release Types

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (`1.0.x`): Bug fixes, documentation updates, minor improvements
- **Minor** (`1.x.0`): New features, non-breaking changes
- **Major** (`x.0.0`): Breaking changes, major rewrites

## Release Checklist

### 1. Prepare the Release

```bash
# Ensure you're on main with latest changes
git checkout main
git pull origin main

# Verify CI is passing
# Check: https://github.com/deployhq/deployhq-mcp-server/actions

# Run tests locally
npm test

# Build locally to verify
npm run build
```

### 2. Update Version and Changelog

```bash
# Choose the appropriate version bump
npm version patch  # For bug fixes (1.0.0 -> 1.0.1)
npm version minor  # For new features (1.0.0 -> 1.1.0)
npm version major  # For breaking changes (1.0.0 -> 2.0.0)

# This will:
# - Update package.json version
# - Create a git commit "1.0.1"
# - Create a git tag "v1.0.1"
```

**Optional**: Update CHANGELOG.md with release notes before running `npm version`.

### 3. Push Changes and Tags

```bash
# Push the version commit
git push origin main

# Push the version tag (triggers publish workflow)
git push origin --tags
```

### 4. Monitor the Release

1. **Watch GitHub Actions**: https://github.com/deployhq/deployhq-mcp-server/actions
   - Wait for "Publish to npm" workflow to complete
   - Should take ~2-3 minutes

2. **Verify npm Publication**: https://www.npmjs.com/package/deployhq-mcp-server
   - Check that new version appears
   - Verify package contents are correct

3. **Check GitHub Release**: https://github.com/deployhq/deployhq-mcp-server/releases
   - Verify release was created automatically
   - Edit release notes if needed

### 5. Verify the Release

```bash
# Test installing from npm
npx deployhq-mcp-server@latest --version

# Or install in a test project
mkdir test-install && cd test-install
npm init -y
npm install deployhq-mcp-server
node -e "import('deployhq-mcp-server')"
```

### 6. Announce the Release (Optional)

If it's a significant release:
- Update README.md if needed
- Post announcement (Discord, Twitter, etc.)
- Update documentation site

## Troubleshooting

### Publish Workflow Failed

**Check the logs**:
```bash
# View workflow runs
https://github.com/deployhq/deployhq-mcp-server/actions
```

**Common issues**:

1. **Tag version mismatch**
   - Error: "Git tag version does not match package.json version"
   - Fix: Ensure tag and package.json versions match
   ```bash
   # Delete the tag locally and remotely
   git tag -d v1.0.1
   git push origin :refs/tags/v1.0.1

   # Fix package.json version and create tag again
   npm version 1.0.1
   git push origin main --tags
   ```

2. **npm publish failed - version already exists**
   - Error: "Cannot publish over existing version"
   - Fix: Version was already published, bump to next version
   ```bash
   npm version patch
   git push origin main --tags
   ```

3. **npm publish failed - authentication**
   - Error: "authentication failed"
   - Fix: Check NPM_TOKEN secret in GitHub
   - Go to: Settings → Secrets → Actions → NPM_TOKEN
   - Regenerate token: `npm token create --type automation`

4. **Build failed**
   - Run build locally to diagnose: `npm run build`
   - Fix issues and commit to main
   - Delete failed tag and recreate

### Manual Rollback

If a published version has critical issues:

```bash
# Deprecate the broken version on npm
npm deprecate deployhq-mcp-server@1.0.1 "Critical bug, use 1.0.2 instead"

# Create a hotfix release
npm version patch
git push origin main --tags
```

**Note**: You cannot unpublish versions after 72 hours. Use deprecation instead.

### Manual Publishing (Emergency Only)

If the automated workflow is broken:

```bash
# Ensure you're logged in
npm whoami

# Build the project
npm run build

# Publish manually
npm publish

# Manually create GitHub release
# Go to: https://github.com/deployhq/deployhq-mcp-server/releases/new
```

## Version History

Track versions and release dates:

| Version | Date | Type | Notes |
|---------|------|------|-------|
| 1.0.0 | 2025-11-11 | Initial | First stable release |

## Best Practices

### DO:
- ✅ Always run tests before releasing
- ✅ Ensure CI passes before tagging
- ✅ Test the package after publishing
- ✅ Use semantic versioning correctly
- ✅ Write clear release notes
- ✅ Batch multiple small changes into one release

### DON'T:
- ❌ Force push to main
- ❌ Delete published npm versions (use deprecate)
- ❌ Skip version bumps in package.json
- ❌ Publish breaking changes as patches
- ❌ Release on Friday afternoon (Murphy's Law)

## Release Cadence

**Suggested schedule**:
- **Patch releases**: As needed for bugs (any time)
- **Minor releases**: Weekly or bi-weekly for features
- **Major releases**: Quarterly or when necessary for breaking changes

## Questions?

- Check `.github/workflows/README.md` for CI/CD details
- Check `package.json` for current version
- Check GitHub Actions for workflow status
- Check npm for published versions

## Quick Reference

```bash
# Complete release in 4 commands
git checkout main && git pull
npm version patch
git push origin main
git push origin --tags
```

Then monitor: https://github.com/deployhq/deployhq-mcp-server/actions
