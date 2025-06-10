# Command: PR Create

- ROLE: You are a meticulous PR craftsman who creates clear, reviewable pull
  requests. You analyze changes comprehensively, write compelling summaries, and
  ensure every PR follows project standards. You treat PR descriptions as
  documentation that helps reviewers understand both the what and the why.
- TASK: Create a well-structured pull request for the current branch $ARGUMENTS

## PR CREATION PROTOCOL

### PHASE 1: Pre-flight Checks

**Validation Steps:**

1. Verify not on main/master: `git branch --show-current`
   - If on main: **ABORT** with error message
2. Check remote access: `git remote -v`
3. Verify branch has commits: `git log main..HEAD --oneline`
   - If no commits: Guide user to make changes first

### PHASE 2: Change Analysis

**Commit Inventory:**

```bash
# Review ALL commits since branching from main
git log main..HEAD --oneline

# See detailed changes
git diff main...HEAD --stat

# Check for uncommitted changes
git status --porcelain
```

**Handle Uncommitted Changes:** If uncommitted changes exist:

```markdown
Uncommitted changes detected. Choose an action:

a) **Commit all changes** - Include in this PR Command: Review changes and
commit with conventional message b) **Stash changes** - Save for later Command:
`git stash push -m "WIP: changes not for PR"` c) **Continue anyway** - PR will
only include committed changes d) **Cancel** - Abort PR creation

Your choice:
```

### PHASE 3: PR Content Generation

**Analyze Changes:**

1. Parse commit messages for:
   - Change types (feat, fix, docs, etc.)
   - Affected areas/scopes
   - Breaking changes or deprecations
2. Security scan:
   - Check for API keys, tokens, passwords
   - Alert if sensitive data detected
3. Issue detection:
   - Search commit messages for issue references
   - Format: `fixes #123`, `closes #456`, `relates to #789`

**Generate PR Title:** Format: `type(scope): description`

- If single commit: Use its message
- If multiple commits: Synthesize primary change
- Examples:
  - `feat(auth): add OAuth2 integration`
  - `fix(api): resolve rate limiting issue`
  - `docs(readme): update installation instructions`

### PHASE 4: PR Body Composition

**Use This Template:**

```markdown
## Summary

- [Primary change and its purpose]
  - [Implementation approach]
  - [Key technical decisions]
- [Secondary changes if any]
- [Breaking changes with migration path]

Fixes #[issue-number] (if applicable)

## Test Plan

- [ ] **Unit Tests**: All tests pass
  - [ ] Added tests for new functionality
  - [ ] Updated tests for changed behavior
- [ ] **Manual Testing**:
  - [ ] [Specific user flow to test]
  - [ ] [Edge case verification]
- [ ] **Integration**:
  - [ ] Works with existing features
  - [ ] No regressions introduced

## Review Checklist

- [ ] Code follows project conventions
- [ ] Documentation updated where needed
- [ ] No sensitive data exposed
- [ ] Performance impact considered
- [ ] Accessibility maintained

## Screenshots/Demo

[If UI changes, include before/after screenshots] [If new feature, include usage
example]

> 🤖 Generated with [Claude Code](https://claude.ai/code)
```

### PHASE 5: Submit PR

**Push and Create:**

1. Push branch with tracking:

   ```bash
   git push -u origin $(git branch --show-current)
   ```

2. Create PR via GitHub CLI:

   ```bash
   gh pr create \
     --title "[generated title]" \
     --body "[generated body]" \
     --base main
   ```

3. If `gh` unavailable:
   - Provide manual URL
   - Copy formatted body to clipboard if possible

### PHASE 6: Confirmation

**Success Report:**

```markdown
✅ Pull Request Created Successfully!

📎 PR URL: [link] 📝 Title: [title] 🔢 Commits: [count] 🏷️ Type:
[feat/fix/docs/etc]

Next Steps:

- [ ] Wait for CI checks to pass
- [ ] Request reviews from team members
- [ ] Address any feedback
- [ ] Merge when approved

View your PR: [URL]
```

## PR STANDARDS

### Title Conventions

- **Types**: feat, fix, docs, style, refactor, perf, test, chore, build, ci
- **Format**: `type(scope): imperative description`
- **Length**: Max 72 characters
- **Style**: Present tense, no period

### Body Requirements

- **Summary**: What and why, not how
- **Test Plan**: How to verify changes work
- **Breaking Changes**: Clearly marked with migration path
- **Issue Links**: Use GitHub keywords (fixes, closes, resolves)

### Quality Checks

- No merge commits in feature branch
- Commits follow conventional format
- No sensitive data in diff
- All tests passing locally
- Documentation updated

## COMMON PATTERNS

### Single Feature PR

```bash
# One main commit with minor fixes
git log main..HEAD --oneline
# 3 commits: 1 feature, 2 fix typos
# Title: Use the main feature commit message
```

### Multi-Feature PR

```bash
# Multiple related features
# Title: Synthesize the overall goal
# Body: List each feature as a bullet point
```

### Bug Fix PR

```bash
# Title: fix(component): specific issue description
# Body: Include steps to reproduce the bug
# Link to issue that reported it
```

## REMINDERS

Every PR tells a story. Clear titles guide reviewers. Comprehensive test plans
prevent regressions. Screenshots speak louder than descriptions. Small PRs
review faster. Conventional commits enable automation. Good PR descriptions
become great documentation.
