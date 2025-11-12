#!/usr/bin/env bash
# Security Vulnerability Scanner
# Automatically detects common security issues in API routes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FEATURE_NAME="${1}"
ISSUES_FOUND=0

echo -e "${BLUE}🔍 Security Scan Starting...${NC}"
echo ""

if [ -n "$FEATURE_NAME" ]; then
  echo -e "${BLUE}Scanning feature: ${FEATURE_NAME}${NC}"
  SCAN_PATH="frontend/routes/api/"
else
  echo -e "${BLUE}Scanning all API routes${NC}"
  SCAN_PATH="frontend/routes/api/"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check 1: userId in Zod validation schemas (CRITICAL)
echo -e "${YELLOW}[1/4] Checking for userId in validation schemas...${NC}"
RESULTS=$(grep -rn "userId.*z\." "$SCAN_PATH" 2>/dev/null || true)

if [ -n "$RESULTS" ]; then
  echo -e "${RED}❌ CRITICAL: Found userId in Zod schemas!${NC}"
  echo ""
  echo "$RESULTS" | while read -r line; do
    FILE=$(echo "$line" | cut -d: -f1)
    LINE_NUM=$(echo "$line" | cut -d: -f2)
    echo -e "  ${RED}→${NC} $FILE:$LINE_NUM"
  done
  echo ""
  echo -e "${RED}  This is a SECURITY VULNERABILITY!${NC}"
  echo -e "${YELLOW}  User IDs should come from JWT tokens, not request body.${NC}"
  echo ""
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo -e "${GREEN}✅ No userId in validation schemas${NC}"
fi

echo ""

# Check 2: user.id usage (should be user.sub)
echo -e "${YELLOW}[2/4] Checking for incorrect user.id usage...${NC}"
RESULTS=$(grep -rn "user\.id" "$SCAN_PATH" 2>/dev/null || true)

if [ -n "$RESULTS" ]; then
  echo -e "${RED}❌ WARNING: Found user.id usage!${NC}"
  echo ""
  echo "$RESULTS" | while read -r line; do
    FILE=$(echo "$line" | cut -d: -f1)
    LINE_NUM=$(echo "$line" | cut -d: -f2)
    echo -e "  ${RED}→${NC} $FILE:$LINE_NUM"
  done
  echo ""
  echo -e "${YELLOW}  JWT tokens use 'sub' claim for user ID, not 'id'.${NC}"
  echo -e "${YELLOW}  Use user.sub instead of user.id to avoid undefined errors.${NC}"
  echo ""
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo -e "${GREEN}✅ No incorrect user.id usage${NC}"
fi

echo ""

# Check 3: Proper authentication middleware
echo -e "${YELLOW}[3/4] Checking for authentication middleware...${NC}"
ROUTES_WITHOUT_AUTH=$(grep -L "requireUser\|requireAdmin" "$SCAN_PATH"**/*.ts 2>/dev/null || true)

if [ -n "$ROUTES_WITHOUT_AUTH" ]; then
  echo -e "${YELLOW}⚠️  Routes without explicit auth middleware:${NC}"
  echo ""
  echo "$ROUTES_WITHOUT_AUTH" | while read -r file; do
    # Skip index files and files with less than 20 lines (likely exports)
    if [ "$(basename "$file")" != "index.ts" ] && [ "$(wc -l < "$file")" -gt 20 ]; then
      echo -e "  ${YELLOW}→${NC} $file"
    fi
  done
  echo ""
  echo -e "${YELLOW}  Verify these routes don't need authentication.${NC}"
  echo ""
else
  echo -e "${GREEN}✅ All routes use authentication middleware${NC}"
fi

echo ""

# Check 4: Owner IDs from request body
echo -e "${YELLOW}[4/4] Checking for owner/creator IDs in request body...${NC}"
RESULTS=$(grep -rn "ownerId.*z\.\|createdBy.*z\.\|gmUserId.*z\." "$SCAN_PATH" 2>/dev/null || true)

if [ -n "$RESULTS" ]; then
  echo -e "${RED}❌ CRITICAL: Found owner/creator IDs in validation schemas!${NC}"
  echo ""
  echo "$RESULTS" | while read -r line; do
    FILE=$(echo "$line" | cut -d: -f1)
    LINE_NUM=$(echo "$line" | cut -d: -f2)
    echo -e "  ${RED}→${NC} $FILE:$LINE_NUM"
  done
  echo ""
  echo -e "${RED}  This is a SECURITY VULNERABILITY!${NC}"
  echo -e "${YELLOW}  Owner IDs should come from JWT tokens, not request body.${NC}"
  echo ""
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo -e "${GREEN}✅ No owner/creator IDs in validation schemas${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Summary
if [ $ISSUES_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ Security scan passed! No vulnerabilities detected.${NC}"
  echo ""
  echo -e "${GREEN}All routes follow security best practices:${NC}"
  echo -e "  ${GREEN}✓${NC} User IDs from JWT tokens (not request body)"
  echo -e "  ${GREEN}✓${NC} Uses user.sub (correct JWT field)"
  echo -e "  ${GREEN}✓${NC} Proper authentication middleware"
  echo ""
  exit 0
else
  echo -e "${RED}❌ Security scan found ${ISSUES_FOUND} issue(s)!${NC}"
  echo ""
  echo -e "${YELLOW}Please review and fix the issues above before deploying.${NC}"
  echo ""
  echo -e "${BLUE}Security Best Practices:${NC}"
  echo -e "  1. Never accept userId, ownerId, or createdBy from request body"
  echo -e "  2. Always use user.sub from JWT token for user identity"
  echo -e "  3. Use requireUser(ctx) or requireAdmin(ctx) middleware"
  echo -e "  4. Validate all inputs with Zod schemas (except user identity)"
  echo ""
  exit 1
fi
