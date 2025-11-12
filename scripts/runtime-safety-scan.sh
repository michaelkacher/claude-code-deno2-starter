#!/usr/bin/env bash
# Runtime Safety Scanner
# Detects common runtime errors in frontend code

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FEATURE_NAME="${1}"
ISSUES_FOUND=0
TOTAL_CHECKS=0

echo -e "${BLUE}🔍 Runtime Safety Scan Starting...${NC}"
echo ""

if [ -n "$FEATURE_NAME" ]; then
  echo -e "${BLUE}Scanning feature files for: ${FEATURE_NAME}${NC}"
  # Try to find feature-related files
  SCAN_PATHS=$(find frontend/routes frontend/islands -name "*${FEATURE_NAME}*" -type f 2>/dev/null || echo "frontend/")
else
  echo -e "${BLUE}Scanning all frontend files${NC}"
  SCAN_PATHS="frontend/routes/ frontend/islands/"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check 1: Unsafe array operations
echo -e "${YELLOW}[1/6] Checking for unsafe array operations...${NC}"
UNSAFE_MAPS=0
UNSAFE_FILTERS=0
UNSAFE_LENGTHS=0

for file in $(find $SCAN_PATHS -name "*.tsx" -o -name "*.ts" 2>/dev/null); do
  # Skip node_modules and build directories
  if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"_fresh"* ]]; then
    continue
  fi

  # Check for .map without null check
  while IFS= read -r line; do
    if ! echo "$line" | grep -q "(.*|| \[\])\.map\|(.* \|\| \[\])\.map"; then
      UNSAFE_MAPS=$((UNSAFE_MAPS + 1))
      TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    fi
  done < <(grep -n "\.map(" "$file" 2>/dev/null | grep -v "//" || true)

  # Check for .filter without null check
  while IFS= read -r line; do
    if ! echo "$line" | grep -q "(.*|| \[\])\.filter\|(.* \|\| \[\])\.filter"; then
      UNSAFE_FILTERS=$((UNSAFE_FILTERS + 1))
      TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    fi
  done < <(grep -n "\.filter(" "$file" 2>/dev/null | grep -v "//" || true)

  # Check for .length without null check or optional chaining
  while IFS= read -r line; do
    if ! echo "$line" | grep -q "?\\.length\|(.*|| \[\])\.length"; then
      UNSAFE_LENGTHS=$((UNSAFE_LENGTHS + 1))
      TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    fi
  done < <(grep -n "\.length" "$file" 2>/dev/null | grep -v "//" | grep -v "string" | grep -v "max" | grep -v "min" || true)
done

if [ $UNSAFE_MAPS -gt 0 ] || [ $UNSAFE_FILTERS -gt 0 ] || [ $UNSAFE_LENGTHS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found potential unsafe array operations:${NC}"
  [ $UNSAFE_MAPS -gt 0 ] && echo -e "  ${YELLOW}→${NC} $UNSAFE_MAPS .map() calls without null checks"
  [ $UNSAFE_FILTERS -gt 0 ] && echo -e "  ${YELLOW}→${NC} $UNSAFE_FILTERS .filter() calls without null checks"
  [ $UNSAFE_LENGTHS -gt 0 ] && echo -e "  ${YELLOW}→${NC} $UNSAFE_LENGTHS .length accesses without null checks"
  echo -e "${YELLOW}  Recommended: Use (array || []).map() pattern${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo -e "${GREEN}✅ All array operations safe${NC}"
fi

echo ""

# Check 2: Unsafe nested property access
echo -e "${YELLOW}[2/6] Checking for unsafe nested property access...${NC}"
UNSAFE_NESTED=0

for file in $(find $SCAN_PATHS -name "*.tsx" -o -name "*.ts" 2>/dev/null); do
  if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"_fresh"* ]]; then
    continue
  fi

  # Look for patterns like user.profile.name without ?.
  RESULTS=$(grep -n "[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_]" "$file" 2>/dev/null | grep -v "?\."\|| grep -v "//" || true)

  if [ -n "$RESULTS" ]; then
    UNSAFE_NESTED=$((UNSAFE_NESTED + $(echo "$RESULTS" | wc -l)))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  fi
done

if [ $UNSAFE_NESTED -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $UNSAFE_NESTED potential unsafe nested property accesses${NC}"
  echo -e "${YELLOW}  Recommended: Use optional chaining (?.${NC})"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo -e "${GREEN}✅ Nested property access uses optional chaining${NC}"
fi

echo ""

# Check 3: Event handler patterns
echo -e "${YELLOW}[3/6] Checking event handler patterns...${NC}"
UNSAFE_TARGETS=0

for file in $(find $SCAN_PATHS -name "*.tsx" 2>/dev/null); do
  if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"_fresh"* ]]; then
    continue
  fi

  # Check for e.target instead of e.currentTarget
  RESULTS=$(grep -n "e\.target\.value\|e\.target\.checked" "$file" 2>/dev/null || true)

  if [ -n "$RESULTS" ]; then
    UNSAFE_TARGETS=$((UNSAFE_TARGETS + $(echo "$RESULTS" | wc -l)))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  fi
done

if [ $UNSAFE_TARGETS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $UNSAFE_TARGETS e.target usages${NC}"
  echo -e "${YELLOW}  Recommended: Use e.currentTarget for controlled components${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo -e "${GREEN}✅ Event handlers use e.currentTarget${NC}"
fi

echo ""

# Check 4: window vs globalThis
echo -e "${YELLOW}[4/6] Checking for window usage (should be globalThis)...${NC}"
WINDOW_USAGE=0

for file in $(find $SCAN_PATHS -name "*.tsx" -o -name "*.ts" 2>/dev/null); do
  if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"_fresh"* ]]; then
    continue
  fi

  RESULTS=$(grep -n "window\\.location\|window\\.fetch" "$file" 2>/dev/null || true)

  if [ -n "$RESULTS" ]; then
    WINDOW_USAGE=$((WINDOW_USAGE + $(echo "$RESULTS" | wc -l)))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  fi
done

if [ $WINDOW_USAGE -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $WINDOW_USAGE window.* usages${NC}"
  echo -e "${YELLOW}  Recommended: Use globalThis instead of window (Deno best practice)${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo -e "${GREEN}✅ Uses globalThis instead of window${NC}"
fi

echo ""

# Check 5: localStorage vs TokenStorage
echo -e "${YELLOW}[5/6] Checking for direct localStorage usage...${NC}"
LOCALSTORAGE_USAGE=0

for file in $(find $SCAN_PATHS -name "*.tsx" -o -name "*.ts" 2>/dev/null); do
  if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"_fresh"* ]]; then
    continue
  fi

  # Skip TokenStorage implementation file itself
  if [[ "$file" == *"lib/token"* ]] || [[ "$file" == *"TokenStorage"* ]]; then
    continue
  fi

  RESULTS=$(grep -n "localStorage\.getItem\|localStorage\.setItem\|localStorage\.removeItem" "$file" 2>/dev/null || true)

  if [ -n "$RESULTS" ]; then
    LOCALSTORAGE_USAGE=$((LOCALSTORAGE_USAGE + $(echo "$RESULTS" | wc -l)))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  fi
done

if [ $LOCALSTORAGE_USAGE -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $LOCALSTORAGE_USAGE direct localStorage usages${NC}"
  echo -e "${YELLOW}  Recommended: Use TokenStorage wrapper${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo -e "${GREEN}✅ Uses TokenStorage instead of localStorage${NC}"
fi

echo ""

# Check 6: Manual fetch vs apiClient
echo -e "${YELLOW}[6/6] Checking for manual fetch usage...${NC}"
MANUAL_FETCH=0

for file in $(find $SCAN_PATHS -name "*.tsx" -o -name "*.ts" 2>/dev/null); do
  if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"_fresh"* ]]; then
    continue
  fi

  # Skip apiClient implementation file itself
  if [[ "$file" == *"lib/api"* ]] || [[ "$file" == *"apiClient"* ]]; then
    continue
  fi

  RESULTS=$(grep -n "fetch(\"/api\|fetch('/api" "$file" 2>/dev/null || true)

  if [ -n "$RESULTS" ]; then
    MANUAL_FETCH=$((MANUAL_FETCH + $(echo "$RESULTS" | wc -l)))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  fi
done

if [ $MANUAL_FETCH -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $MANUAL_FETCH manual fetch usages${NC}"
  echo -e "${YELLOW}  Recommended: Use apiClient for API calls${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo -e "${GREEN}✅ Uses apiClient instead of manual fetch${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Summary
if [ $ISSUES_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ Runtime safety scan passed!${NC}"
  echo ""
  echo -e "${GREEN}All code follows safety best practices:${NC}"
  echo -e "  ${GREEN}✓${NC} Array operations safe (null checks applied)"
  echo -e "  ${GREEN}✓${NC} Property access uses optional chaining"
  echo -e "  ${GREEN}✓${NC} Event handlers use e.currentTarget"
  echo -e "  ${GREEN}✓${NC} Uses globalThis instead of window"
  echo -e "  ${GREEN}✓${NC} Uses TokenStorage wrapper"
  echo -e "  ${GREEN}✓${NC} Uses apiClient for API calls"
  echo ""
  exit 0
else
  echo -e "${YELLOW}⚠️  Runtime safety scan found ${ISSUES_FOUND} potential issue(s)${NC}"
  echo ""
  echo -e "${BLUE}These are recommendations, not critical errors.${NC}"
  echo -e "Review the warnings above to improve code robustness."
  echo ""
  echo -e "${BLUE}Runtime Safety Best Practices:${NC}"
  echo -e "  1. Use (array || []).map() for safe array operations"
  echo -e "  2. Use optional chaining (?.) for nested properties"
  echo -e "  3. Use e.currentTarget instead of e.target"
  echo -e "  4. Use globalThis instead of window (Deno)"
  echo -e "  5. Use TokenStorage instead of localStorage"
  echo -e "  6. Use apiClient instead of manual fetch"
  echo ""
  exit 0  # Don't fail the build, just warn
fi
