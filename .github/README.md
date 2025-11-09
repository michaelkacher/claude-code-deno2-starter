# GitHub Copilot Prompt Files

> **GitHub Copilot Prompt Files** allow you to create custom slash commands in Copilot Chat!
> Each `.prompt.md` file in `.github/prompts/` becomes a `/command` in Copilot Chat.

This directory contains prompt files that mirror the Claude Code commands in `.claude/commands/`.

## How It Works

Each prompt file uses the `#file:` directive to reference the Claude command markdown:

```markdown
#file:../../.claude/commands/new-feature.md

Additional instructions specific to this prompt...
```

This means:
- ✅ **Single source of truth** - maintain only the Claude commands
- ✅ **Automatic sync** - prompt files stay up-to-date with Claude commands
- ✅ **Less maintenance** - update one file, both tools benefit

## Available Commands

Once you reload VS Code, type `/` in Copilot Chat to see these commands:

### `/customize`
Customize application branding, colors, navigation, and feature flags

**File:** `.github/prompts/customize.prompt.md`  
**References:** `.claude/commands/customize.md`

### `/new-feature`
Create a complete feature with requirements, tests, backend, and frontend

**File:** `.github/prompts/new-feature.prompt.md`  
**References:** `.claude/commands/new-feature.md`

### `/feature-complete`
Finalize feature and move from proposed to implemented

**File:** `.github/prompts/feature-complete.prompt.md`  
**References:** `.claude/commands/feature-complete.md`

### `/mockup`
Create UI mockup for rapid prototyping

**File:** `.github/prompts/mockup.prompt.md`  
**References:** `.claude/commands/mockup.md`

### `/requirements`
Create comprehensive project requirements documentation

**File:** `.github/prompts/requirements.prompt.md`  
**References:** `.claude/commands/requirements.md`

### `/architect`
Design or update system architecture documentation

**File:** `.github/prompts/architect.prompt.md`  
**References:** `.claude/commands/architect.md`

### `/review`
Review code quality, tests, and security best practices

**File:** `.github/prompts/review.prompt.md`  
**References:** `.claude/commands/review.md`

## Usage

1. **Reload VS Code** to activate the prompt files
2. **Open GitHub Copilot Chat** (Ctrl/Cmd + I or sidebar)
3. **Type `/`** to see available commands
4. **Select a command** (e.g., `/new-feature`)
5. **Add details** and press Enter

**Example:**
```
/new-feature implement task management with priority levels
```

## Maintenance

To update a command:
1. Edit the Claude command file (`.claude/commands/*.md`)
2. The prompt file automatically references the updated content
3. Reload VS Code if needed

No need to edit both files!

---

## Recommended Workflow

**For new projects:**

1. **Customize the template:** `/customize`
2. **Create UI mockups** (optional): `/mockup create a user profile page`
3. **Build features:** `/new-feature implement user-profile mockup`
4. **Review quality:** `/review user-profile`
5. **Finalize feature:** `/feature-complete user-profile`

---

## See Also

- `.claude/commands/` - Source Claude Code command definitions
- `docs/` - Project documentation
- `features/_templates/` - Feature templates
- `tests/README.md` - Testing guidelines
