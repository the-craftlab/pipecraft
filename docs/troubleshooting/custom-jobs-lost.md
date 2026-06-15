# Troubleshooting: Custom Jobs Lost During Regeneration

## Issue Description

When running `pipecraft generate`, custom jobs defined in `.github/workflows/pipeline.yml` may be deleted, leaving only the Pipecraft-managed jobs (changes, version, gate, tag, promote, release).

## Root Causes

### 1. **Mismatched or Missing Markers** (Most Common)

Pipecraft preserves custom jobs between these comment markers:

```yaml
# <--START CUSTOM JOBS-->

your-custom-job:
  # ...
# <--END CUSTOM JOBS-->
```

**Problem**: If one or both markers are missing or corrupted, Pipecraft's extraction logic may fail.

**Symptoms**:

- File has END marker but no START marker (or vice versa)
- Original markers were manually edited or removed
- Previous regeneration failed partway through

**Detection**:

```bash
# Check for markers
grep -n "<--START CUSTOM JOBS-->" .github/workflows/pipeline.yml
grep -n "<--END CUSTOM JOBS-->" .github/workflows/pipeline.yml
```

### 2. **Custom Jobs Outside Markers**

Custom jobs placed outside the marker boundaries won't be preserved by marker-based extraction.

**Example**:

```yaml
jobs:
  changes: # ... managed by Pipecraft
  version:
    # ... managed by Pipecraft
    # <--START CUSTOM JOBS-->

  lint:
    # ... your custom job
    # <--END CUSTOM JOBS-->

  my-custom-job:# ❌ THIS JOB IS OUTSIDE MARKERS AND MAY BE LOST
    # ...
```

### 3. **YAML Parsing Errors**

If the pipeline contains invalid YAML, Pipecraft may fail to parse it correctly, leading to data loss.

## Prevention

### Before Running `pipecraft generate`:

1. **Backup your pipeline**:

   ```bash
   cp .github/workflows/pipeline.yml .github/workflows/pipeline.yml.backup
   ```

2. **Verify markers exist**:

   ```bash
   # Should show exactly 2 lines (one for each marker)
   grep -c "<--START CUSTOM JOBS-->" .github/workflows/pipeline.yml
   grep -c "<--END CUSTOM JOBS-->" .github/workflows/pipeline.yml
   ```

3. **Ensure all custom jobs are between markers**:

   - Open `.github/workflows/pipeline.yml`
   - Find all your custom jobs
   - Verify they are ALL between the START and END markers

4. **Use version control**:
   ```bash
   git status
   git diff .github/workflows/pipeline.yml
   ```

## Recovery

### If Custom Jobs Were Deleted:

1. **Restore from git**:

   ```bash
   git checkout .github/workflows/pipeline.yml
   ```

2. **Or restore from backup**:

   ```bash
   cp .github/workflows/pipeline.yml.backup .github/workflows/pipeline.yml
   ```

3. **Fix the markers**:
   - Ensure both START and END markers exist
   - Place ALL custom jobs between the markers
   - Run `pipecraft generate` again

### If You Don't Have a Backup:

1. **Check git history**:

   ```bash
   git log --oneline -- .github/workflows/pipeline.yml
   git show <commit-hash>:.github/workflows/pipeline.yml > recovered-pipeline.yml
   ```

2. **Check GitHub Actions**:
   - Go to your repository's Actions tab
   - Find a recent successful workflow run
   - View the workflow file from that run

## Enhanced Logging (v0.38.0+)

As of v0.38.0, Pipecraft includes enhanced diagnostics:

```bash
pipecraft generate
```

Will now show:

- `📋 Preserving X custom job(s): job1, job2, job3`
- `⚠️  Found END marker but missing START marker - markers are mismatched!`
- `✅ Successfully converted X custom jobs`
- `❌ Failed to convert custom jobs to YAML`

## Reporting Issues

If you experience custom jobs being lost:

1. **Gather information**:

   - Pipecraft version: `pipecraft --version`
   - Pipeline file structure (before/after)
   - Full output of `pipecraft generate`
   - Your `.pipecraftrc` config

2. **Create a minimal reproduction**:

   - Simplify your pipeline to the minimum that reproduces the issue
   - Remove sensitive information

3. **Report at**: https://github.com/anthropics/pipecraft/issues

Include:

- Steps to reproduce
- Expected vs actual behavior
- Pipeline file (or simplified version)
- Pipecraft version and config

## Best Practices

1. **Always use version control** for `.github/workflows/pipeline.yml`
2. **Commit before regenerating** - makes recovery trivial
3. **Keep custom jobs between markers** - don't place jobs outside the boundaries
4. **Test with `--dry-run`** first (if available in future versions)
5. **Review diffs before committing** - catch issues early

## Technical Details

Pipecraft uses two modes for regeneration:

1. **Merge Mode** (default):

   - Parses existing pipeline
   - Extracts content between markers
   - Updates managed jobs
   - Preserves custom jobs

2. **Force Mode** (`--force` flag):
   - Rebuilds from scratch
   - Preserves custom jobs by converting them to YAML
   - Use with caution

### Fallback Logic

If markers are missing, Pipecraft attempts to:

1. Extract all non-managed jobs from the existing file
2. Convert them to YAML text
3. Insert them with fresh markers

This fallback should prevent data loss, but relies on proper YAML parsing.

## See Also

- [Pipeline Customization Guide](../guides/pipeline-customization.md)
- [Migration Guide](../guides/migration.md)
- [Configuration Reference](../reference/configuration.md)
