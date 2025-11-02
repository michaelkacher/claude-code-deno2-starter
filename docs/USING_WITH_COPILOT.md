# Using This Project with GitHub Copilot and Claude Code

This project is designed to work with both GitHub Copilot and Claude Code, sharing the same documentation and workflows.

## Quick Start

### With Claude Code ✅
```
/new-feature          → Full feature development workflow
/mockup               → Create UI mockups
/requirements         → Gather project requirements
/api-design           → Design API endpoints
```

### With GitHub Copilot ✅
```
@workspace run new-feature workflow       → Full feature development workflow
@workspace create a mockup for [name]     → Create UI mockups
@workspace I want to create a new feature → Interactive feature creation
@workspace write tests for [name]         → Generate tests
```

## How It Works

Both tools read from the **same markdown files**:

| Workflow | Shared Documentation |
|----------|---------------------|
| New Feature | `.claude/commands/new-feature.md` |
| Mockup | `.claude/commands/mockup.md` |
| Test Writing | `.claude/agents/_full/test-writer-agent.md` |
| Backend | `.claude/agents/_full/backend-agent.md` |
| Frontend | `.claude/agents/_full/frontend-agent.md` |

**Benefits:**
- ✅ Single source of truth
- ✅ No duplication
- ✅ Update once, works everywhere
- ✅ Consistent patterns across tools

## Feature Comparison

| Capability | Claude Code | GitHub Copilot |
|------------|-------------|----------------|
| **Custom Commands** | ✅ Native `/commands` | ⚠️ Via `@workspace` |
| **Orchestration** | ✅ Automatic | ⚠️ Manual |
| **Code Generation** | ✅ Direct file edits | ✅ Suggests code |
| **Inline Completion** | ❌ | ✅ Real-time |
| **IDE Integration** | ✅ | ✅ Deep VS Code |
| **Workflow Automation** | ✅ Multi-step | ⚠️ Step-by-step |
| **Shared Docs** | ✅ | ✅ |

## Examples

### Creating a New Feature

**Claude Code:**
```
/new-feature

→ Automatically guides through:
  1. Requirements gathering
  2. API design
  3. Test writing
  4. Backend implementation
  5. Frontend implementation
```

**GitHub Copilot:**
```
@workspace I want to create a user profile feature

→ Copilot will:
  1. Read .claude/commands/new-feature.md
  2. Guide you through the workflow
  3. Generate code for each step
  4. You execute the changes
```

### Creating a Mockup

**Claude Code:**
```
/mockup

→ Creates mockup with design doc
```

**GitHub Copilot:**
```
@workspace create a mockup for the user profile page

→ Reads .claude/commands/mockup.md
→ Generates mockup route and design doc
```

### Writing Tests

**Claude Code:**
```
/test-writer

→ Generates tests using templates
```

**GitHub Copilot:**
```
@workspace write tests for the user service

→ Reads test-writer-agent.md
→ Uses templates from tests/templates/
→ Generates comprehensive tests
```

## Best Practices

### 1. Use the Right Tool for the Task

**Claude Code is better for:**
- Complex multi-step workflows
- Feature development from scratch
- Orchestrating multiple agents
- Automated code generation

**GitHub Copilot is better for:**
- Inline code completion
- Quick refactoring
- Exploring existing code
- IDE-integrated assistance

### 2. Keep Documentation Updated

When you update workflows:
1. Edit the source markdown file (e.g., `.claude/commands/new-feature.md`)
2. Both tools automatically use the updated version
3. No need to duplicate changes

### 3. Use Templates

Both tools use the same templates:
- `tests/templates/*.template.ts` - Test templates
- `backend/templates/*.template.ts` - Backend templates
- `frontend/templates/*.tsx` - Frontend templates

### 4. Follow Project Patterns

Both tools understand:
- JWT uses `payload.sub` (not `payload.userId`)
- Route order matters (specific before general)
- Islands for client interactivity
- Feature-scoped documentation

## Troubleshooting

### Copilot doesn't find workflows
- Make sure you're using `@workspace` participant
- Try: `@workspace read .github/copilot-workflows.md`
- Verify files exist in `.claude/` directory

### Copilot suggests different patterns
- Reference specific files: `@workspace follow patterns in .claude/commands/new-feature.md`
- Check `.github/copilot-instructions.md` is present

### Claude Code commands not working
- Verify `.claude/commands/` directory exists
- Check command file has proper frontmatter
- Run `/help` to see available commands

## Extending Workflows

To add a new workflow that works with both tools:

1. **Create the workflow file:**
   ```bash
   .claude/commands/my-workflow.md
   ```

2. **Add to Copilot workflows:**
   Edit `.github/copilot-workflows.md`:
   ```markdown
   ### My Workflow
   **Trigger phrases:** "run my workflow"
   **Instructions:** Read file: .claude/commands/my-workflow.md
   ```

3. **Use it:**
   - Claude Code: `/my-workflow`
   - Copilot: `@workspace run my workflow`

## Learn More

- **Claude Code Docs**: `.claude/README.md`
- **Copilot Workflows**: `.github/copilot-workflows.md`
- **Project Instructions**: `.github/copilot-instructions.md`
- **Test Patterns**: `tests/templates/TEST_PATTERNS.md`
- **E2E Patterns**: `tests/templates/E2E_PATTERNS.md`
