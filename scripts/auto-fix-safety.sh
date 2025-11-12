#!/usr/bin/env bash
# Auto-Fix Safety Issues Script
# Automatically applies defensive patterns to fix common runtime safety issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

FEATURE_NAME="${1}"
DRY_RUN="${2:-false}"

if [ -z "$FEATURE_NAME" ]; then
  echo -e "${RED}Error: Feature name required${NC}"
  echo "Usage: ./scripts/auto-fix-safety.sh <feature-name> [--dry-run]"
  echo "Example: ./scripts/auto-fix-safety.sh campaign-creator"
  echo ""
  echo "Options:"
  echo "  --dry-run    Show what would be fixed without making changes"
  exit 1
fi

if [ "$2" = "--dry-run" ]; then
  DRY_RUN=true
fi

echo -e "${BLUE}🔧 Auto-Fix Safety Issues${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}DRY RUN MODE - No files will be modified${NC}"
  echo ""
fi

FIXES_APPLIED=0
FILES_MODIFIED=()

# Determine search paths based on feature name
if [ -n "$FEATURE_NAME" ]; then
  SEARCH_PATHS=(
    "frontend/islands/${FEATURE_NAME^}*.tsx"
    "frontend/routes/${FEATURE_NAME}/**/*.tsx"
    "frontend/routes/api/${FEATURE_NAME}/**/*.ts"
  )
else
  SEARCH_PATHS=(
    "frontend/islands/**/*.tsx"
    "frontend/routes/**/*.tsx"
  )
fi

echo -e "${YELLOW}[1/4] Fixing unsafe array operations...${NC}"
echo ""

# Find files with unsafe array operations
for pattern in "${SEARCH_PATHS[@]}"; do
  for file in $pattern 2>/dev/null; do
    if [ -f "$file" ]; then
      # Check for .map() without null check
      UNSAFE_MAP=$(grep -n "^\s*[a-zA-Z_][a-zA-Z0-9_]*\.map(" "$file" 2>/dev/null || true)

      if [ -n "$UNSAFE_MAP" ]; then
        echo -e "  ${CYAN}→${NC} Found unsafe .map() in: ${MAGENTA}$file${NC}"

        while IFS= read -r line; do
          LINE_NUM=$(echo "$line" | cut -d: -f1)
          LINE_CONTENT=$(echo "$line" | cut -d: -f2-)

          # Extract variable name
          VAR_NAME=$(echo "$LINE_CONTENT" | sed -E 's/^[[:space:]]*([a-zA-Z_][a-zA-Z0-9_]*)\.map\(.*/\1/')

          echo -e "    ${YELLOW}Line $LINE_NUM:${NC} $VAR_NAME.map(...)"
          echo -e "    ${GREEN}Fix:${NC} ($VAR_NAME || []).map(...)"

          if [ "$DRY_RUN" = false ]; then
            # Apply fix using sed (platform-compatible)
            # This replaces "varName.map(" with "(varName || []).map("
            sed -i.bak "s/\b${VAR_NAME}\.map(/(${VAR_NAME} || []).map(/g" "$file"
            FIXES_APPLIED=$((FIXES_APPLIED + 1))

            # Track modified files
            if [[ ! " ${FILES_MODIFIED[@]} " =~ " ${file} " ]]; then
              FILES_MODIFIED+=("$file")
            fi
          fi
        done <<< "$UNSAFE_MAP"

        echo ""
      fi

      # Check for .filter() without null check
      UNSAFE_FILTER=$(grep -n "^\s*[a-zA-Z_][a-zA-Z0-9_]*\.filter(" "$file" 2>/dev/null || true)

      if [ -n "$UNSAFE_FILTER" ]; then
        echo -e "  ${CYAN}→${NC} Found unsafe .filter() in: ${MAGENTA}$file${NC}"

        while IFS= read -r line; do
          LINE_NUM=$(echo "$line" | cut -d: -f1)
          LINE_CONTENT=$(echo "$line" | cut -d: -f2-)

          VAR_NAME=$(echo "$LINE_CONTENT" | sed -E 's/^[[:space:]]*([a-zA-Z_][a-zA-Z0-9_]*)\.filter\(.*/\1/')

          echo -e "    ${YELLOW}Line $LINE_NUM:${NC} $VAR_NAME.filter(...)"
          echo -e "    ${GREEN}Fix:${NC} ($VAR_NAME || []).filter(...)"

          if [ "$DRY_RUN" = false ]; then
            sed -i.bak "s/\b${VAR_NAME}\.filter(/(${VAR_NAME} || []).filter(/g" "$file"
            FIXES_APPLIED=$((FIXES_APPLIED + 1))

            if [[ ! " ${FILES_MODIFIED[@]} " =~ " ${file} " ]]; then
              FILES_MODIFIED+=("$file")
            fi
          fi
        done <<< "$UNSAFE_FILTER"

        echo ""
      fi
    fi
  done
done

if [ $FIXES_APPLIED -eq 0 ]; then
  echo -e "  ${GREEN}✓${NC} No unsafe array operations found"
fi

echo ""
echo -e "${YELLOW}[2/4] Fixing deprecated window usage...${NC}"
echo ""

WINDOW_FIXES=0

for pattern in "${SEARCH_PATHS[@]}"; do
  for file in $pattern 2>/dev/null; do
    if [ -f "$file" ]; then
      # Check for window.location
      WINDOW_USAGE=$(grep -n "window\.location" "$file" 2>/dev/null || true)

      if [ -n "$WINDOW_USAGE" ]; then
        echo -e "  ${CYAN}→${NC} Found window.location in: ${MAGENTA}$file${NC}"

        while IFS= read -r line; do
          LINE_NUM=$(echo "$line" | cut -d: -f1)
          echo -e "    ${YELLOW}Line $LINE_NUM:${NC} window.location → globalThis.location"

          if [ "$DRY_RUN" = false ]; then
            sed -i.bak 's/window\.location/globalThis.location/g' "$file"
            WINDOW_FIXES=$((WINDOW_FIXES + 1))

            if [[ ! " ${FILES_MODIFIED[@]} " =~ " ${file} " ]]; then
              FILES_MODIFIED+=("$file")
            fi
          fi
        done <<< "$WINDOW_USAGE"

        echo ""
      fi
    fi
  done
done

FIXES_APPLIED=$((FIXES_APPLIED + WINDOW_FIXES))

if [ $WINDOW_FIXES -eq 0 ]; then
  echo -e "  ${GREEN}✓${NC} No deprecated window usage found"
fi

echo ""
echo -e "${YELLOW}[3/4] Fixing e.target to e.currentTarget...${NC}"
echo ""

EVENT_FIXES=0

for pattern in "${SEARCH_PATHS[@]}"; do
  for file in $pattern 2>/dev/null; do
    if [ -f "$file" ]; then
      # Check for e.target.value (should be e.currentTarget.value in controlled components)
      TARGET_USAGE=$(grep -n "e\.target\.value\|event\.target\.value" "$file" 2>/dev/null || true)

      if [ -n "$TARGET_USAGE" ]; then
        echo -e "  ${CYAN}→${NC} Found e.target.value in: ${MAGENTA}$file${NC}"
        echo -e "    ${YELLOW}Note:${NC} Review manually - only fix if in controlled component"

        while IFS= read -r line; do
          LINE_NUM=$(echo "$line" | cut -d: -f1)
          LINE_CONTENT=$(echo "$line" | cut -d: -f2-)

          echo -e "    ${YELLOW}Line $LINE_NUM:${NC} $(echo "$LINE_CONTENT" | xargs)"
          echo -e "    ${BLUE}Recommendation:${NC} Use e.currentTarget.value for controlled inputs"
        done <<< "$TARGET_USAGE"

        echo ""
      fi
    fi
  done
done

if [ $EVENT_FIXES -eq 0 ]; then
  echo -e "  ${GREEN}✓${NC} No e.target issues found (or all are correct)"
fi

echo ""
echo -e "${YELLOW}[4/4] Cleaning up backup files...${NC}"
echo ""

if [ "$DRY_RUN" = false ] && [ ${#FILES_MODIFIED[@]} -gt 0 ]; then
  for file in "${FILES_MODIFIED[@]}"; do
    if [ -f "${file}.bak" ]; then
      rm "${file}.bak"
    fi
  done
  echo -e "  ${GREEN}✓${NC} Removed ${#FILES_MODIFIED[@]} backup files"
else
  echo -e "  ${GREEN}✓${NC} No backup files to clean"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}⚠️  DRY RUN COMPLETE${NC}"
  echo ""
  echo -e "Would have applied ${CYAN}$FIXES_APPLIED${NC} fixes to ${CYAN}${#FILES_MODIFIED[@]}${NC} files."
  echo ""
  echo "To apply these fixes, run:"
  echo -e "  ${CYAN}./scripts/auto-fix-safety.sh $FEATURE_NAME${NC}"
else
  if [ $FIXES_APPLIED -gt 0 ]; then
    echo -e "${GREEN}✅ Auto-Fix Complete!${NC}"
    echo ""
    echo -e "Applied ${GREEN}$FIXES_APPLIED${NC} fixes to ${GREEN}${#FILES_MODIFIED[@]}${NC} files:"
    for file in "${FILES_MODIFIED[@]}"; do
      echo -e "  ${CYAN}•${NC} $file"
    done
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Review the changes: git diff"
    echo "  2. Run tests: deno test --no-check -A"
    echo "  3. Run linter: deno lint"
    echo "  4. Commit changes if tests pass"
  else
    echo -e "${GREEN}✅ No issues found - code is already safe!${NC}"
  fi
fi

echo ""

exit 0
