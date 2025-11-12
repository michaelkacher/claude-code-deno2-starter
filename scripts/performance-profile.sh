#!/usr/bin/env bash
# Performance Profiling Script
# Analyzes code for performance bottlenecks in DB queries, API routes, and frontend

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

if [ -z "$FEATURE_NAME" ]; then
  echo -e "${RED}Error: Feature name required${NC}"
  echo "Usage: ./scripts/performance-profile.sh <feature-name>"
  echo "Example: ./scripts/performance-profile.sh campaign-creator"
  exit 1
fi

echo -e "${BLUE}⚡ Performance Profiling${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Feature: ${CYAN}$FEATURE_NAME${NC}"
echo ""

# Performance tracking
CRITICAL_ISSUES=0
WARNINGS=0
SUGGESTIONS=0
PERFORMANCE_SCORE=10

# Determine search paths
SERVICE_FILES=(
  "shared/services/${FEATURE_NAME}.service.ts"
  "shared/services/${FEATURE_NAME}-*.service.ts"
)

API_FILES=(
  "frontend/routes/api/${FEATURE_NAME}/**/*.ts"
  "frontend/routes/api/${FEATURE_NAME}.ts"
)

FRONTEND_FILES=(
  "frontend/islands/${FEATURE_NAME^}*.tsx"
  "frontend/routes/${FEATURE_NAME}/**/*.tsx"
)

echo -e "${YELLOW}[1/5] Analyzing database query patterns...${NC}"
echo ""

# Check for N+1 queries
for pattern in "${SERVICE_FILES[@]}"; do
  for file in $pattern 2>/dev/null; do
    if [ -f "$file" ]; then
      # Look for .get() calls inside loops (for/while) or .map()
      N1_QUERIES=$(grep -B5 "kv\.get\[" "$file" 2>/dev/null | grep -E "(for |while |\.map\(|\.forEach\()" || true)

      if [ -n "$N1_QUERIES" ]; then
        echo -e "  ${RED}✗${NC} Potential N+1 query in: ${MAGENTA}$file${NC}"
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
        PERFORMANCE_SCORE=$((PERFORMANCE_SCORE - 2))

        # Find the specific lines
        LOOP_LINES=$(grep -n -E "(for |while |\.map\(|\.forEach\()" "$file" 2>/dev/null || true)
        echo -e "    ${YELLOW}Issue:${NC} Database queries inside loops detected"
        echo -e "    ${CYAN}Recommendation:${NC} Batch queries or use .getMany() for multiple keys"
        echo ""
      fi

      # Count total .get() and .set() calls
      GET_COUNT=$(grep -c "kv\.get(" "$file" 2>/dev/null || echo "0")
      SET_COUNT=$(grep -c "kv\.set(" "$file" 2>/dev/null || echo "0")
      TOTAL_QUERIES=$((GET_COUNT + SET_COUNT))

      if [ $TOTAL_QUERIES -gt 10 ]; then
        echo -e "  ${YELLOW}⚠${NC}  High query count in: ${MAGENTA}$file${NC}"
        echo -e "    ${YELLOW}Queries:${NC} $TOTAL_QUERIES (${GET_COUNT} reads, ${SET_COUNT} writes)"
        WARNINGS=$((WARNINGS + 1))
        PERFORMANCE_SCORE=$((PERFORMANCE_SCORE - 1))
        echo -e "    ${CYAN}Recommendation:${NC} Consider batching operations or caching"
        echo ""
      elif [ $TOTAL_QUERIES -gt 5 ]; then
        echo -e "  ${CYAN}→${NC} Moderate query count in: ${MAGENTA}$file${NC}"
        echo -e "    ${YELLOW}Queries:${NC} $TOTAL_QUERIES (${GET_COUNT} reads, ${SET_COUNT} writes)"
        SUGGESTIONS=$((SUGGESTIONS + 1))
        echo ""
      else
        echo -e "  ${GREEN}✓${NC} Good query count in: ${MAGENTA}$file${NC} (${TOTAL_QUERIES} queries)"
      fi
    fi
  done
done

echo ""
echo -e "${YELLOW}[2/5] Analyzing API response sizes...${NC}"
echo ""

# Check for large response payloads
for pattern in "${API_FILES[@]}"; do
  for file in $pattern 2>/dev/null; do
    if [ -f "$file" ]; then
      # Look for .list() without limit parameter
      UNLIMITED_LISTS=$(grep -n "kv\.list(" "$file" 2>/dev/null | grep -v "limit:" || true)

      if [ -n "$UNLIMITED_LISTS" ]; then
        echo -e "  ${RED}✗${NC} Unlimited .list() call in: ${MAGENTA}$file${NC}"
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
        PERFORMANCE_SCORE=$((PERFORMANCE_SCORE - 2))

        while IFS= read -r line; do
          LINE_NUM=$(echo "$line" | cut -d: -f1)
          echo -e "    ${YELLOW}Line $LINE_NUM:${NC} kv.list() without limit"
        done <<< "$UNLIMITED_LISTS"

        echo -e "    ${CYAN}Recommendation:${NC} Add { limit: 100 } to prevent large responses"
        echo ""
      fi

      # Look for returning full objects in lists (not just IDs/summaries)
      FULL_OBJECT_RETURNS=$(grep -n "return.*\.map(" "$file" 2>/dev/null | grep -v "\.id\|\.name\|summary" || true)

      if [ -n "$FULL_OBJECT_RETURNS" ]; then
        echo -e "  ${YELLOW}⚠${NC}  Returning full objects in list endpoint: ${MAGENTA}$file${NC}"
        WARNINGS=$((WARNINGS + 1))
        PERFORMANCE_SCORE=$((PERFORMANCE_SCORE - 1))
        echo -e "    ${CYAN}Recommendation:${NC} Return only necessary fields for list views"
        echo ""
      fi

      # Check for proper pagination
      HAS_PAGINATION=$(grep -c "cursor\|offset\|page" "$file" 2>/dev/null || echo "0")

      if [ $HAS_PAGINATION -eq 0 ]; then
        echo -e "  ${CYAN}→${NC} No pagination detected in: ${MAGENTA}$file${NC}"
        SUGGESTIONS=$((SUGGESTIONS + 1))
        echo -e "    ${CYAN}Suggestion:${NC} Consider adding pagination for scalability"
        echo ""
      else
        echo -e "  ${GREEN}✓${NC} Pagination implemented in: ${MAGENTA}$file${NC}"
      fi
    fi
  done
done

echo ""
echo -e "${YELLOW}[3/5] Analyzing frontend performance...${NC}"
echo ""

# Check for expensive re-renders
for pattern in "${FRONTEND_FILES[@]}"; do
  for file in $pattern 2>/dev/null; do
    if [ -f "$file" ]; then
      # Look for inline object/array creation in JSX
      INLINE_OBJECTS=$(grep -n "{{.*}}\|{\[.*\]}" "$file" 2>/dev/null || true)

      if [ -n "$INLINE_OBJECTS" ]; then
        INLINE_COUNT=$(echo "$INLINE_OBJECTS" | wc -l | xargs)

        if [ $INLINE_COUNT -gt 5 ]; then
          echo -e "  ${YELLOW}⚠${NC}  Inline object creation in JSX: ${MAGENTA}$file${NC}"
          echo -e "    ${YELLOW}Count:${NC} $INLINE_COUNT instances"
          WARNINGS=$((WARNINGS + 1))
          PERFORMANCE_SCORE=$((PERFORMANCE_SCORE - 1))
          echo -e "    ${CYAN}Recommendation:${NC} Move object creation outside render or use useMemo"
          echo ""
        fi
      fi

      # Look for missing key props in .map()
      MISSING_KEYS=$(grep -n "\.map(" "$file" 2>/dev/null | grep -A2 "<" | grep -v "key=" || true)

      if [ -n "$MISSING_KEYS" ]; then
        echo -e "  ${YELLOW}⚠${NC}  Potential missing key props: ${MAGENTA}$file${NC}"
        WARNINGS=$((WARNINGS + 1))
        echo -e "    ${CYAN}Recommendation:${NC} Ensure all .map() renders have unique key props"
        echo ""
      fi

      # Check for large list rendering without virtualization
      LARGE_MAPS=$(grep -B2 "\.map(" "$file" 2>/dev/null | grep -E "campaigns|characters|sessions" | grep -v "slice\|virtualized" || true)

      if [ -n "$LARGE_MAPS" ]; then
        echo -e "  ${CYAN}→${NC} Large list rendering detected: ${MAGENTA}$file${NC}"
        SUGGESTIONS=$((SUGGESTIONS + 1))
        echo -e "    ${CYAN}Suggestion:${NC} Consider virtualization for lists >50 items"
        echo ""
      fi

      # Check for useEffect without dependencies
      UNSAFE_EFFECTS=$(grep -A1 "useEffect" "$file" 2>/dev/null | grep "\[\])" || true)

      if [ -n "$UNSAFE_EFFECTS" ]; then
        EFFECT_COUNT=$(echo "$UNSAFE_EFFECTS" | wc -l | xargs)
        echo -e "  ${GREEN}✓${NC} useEffect optimizations present: ${MAGENTA}$file${NC}"
      fi
    fi
  done
done

echo ""
echo -e "${YELLOW}[4/5] Checking for performance best practices...${NC}"
echo ""

# Check for missing indexes on common query patterns
for pattern in "${SERVICE_FILES[@]}"; do
  for file in $pattern 2>/dev/null; do
    if [ -f "$file" ]; then
      # Look for secondary indexes (by_user, by_status, etc.)
      HAS_INDEXES=$(grep -c "_by_\|ByUser\|ByStatus" "$file" 2>/dev/null || echo "0")

      if [ $HAS_INDEXES -gt 0 ]; then
        echo -e "  ${GREEN}✓${NC} Secondary indexes found in: ${MAGENTA}$file${NC} ($HAS_INDEXES indexes)"
      else
        # Check if service does queries that would benefit from indexes
        HAS_FILTERS=$(grep -c "\.filter(\|\.find(" "$file" 2>/dev/null || echo "0")

        if [ $HAS_FILTERS -gt 0 ]; then
          echo -e "  ${CYAN}→${NC} No secondary indexes in: ${MAGENTA}$file${NC}"
          SUGGESTIONS=$((SUGGESTIONS + 1))
          echo -e "    ${CYAN}Suggestion:${NC} Consider adding secondary indexes for filtered queries"
          echo ""
        fi
      fi
    fi
  done
done

# Check for caching strategies
CACHE_USAGE=0
for pattern in "${SERVICE_FILES[@]}" "${API_FILES[@]}"; do
  for file in $pattern 2>/dev/null; do
    if [ -f "$file" ]; then
      HAS_CACHE=$(grep -c "cache\|memoize\|Cache-Control" "$file" 2>/dev/null || echo "0")
      CACHE_USAGE=$((CACHE_USAGE + HAS_CACHE))
    fi
  done
done

if [ $CACHE_USAGE -gt 0 ]; then
  echo -e "  ${GREEN}✓${NC} Caching strategies implemented ($CACHE_USAGE instances)"
else
  echo -e "  ${CYAN}→${NC} No caching detected"
  SUGGESTIONS=$((SUGGESTIONS + 1))
  echo -e "    ${CYAN}Suggestion:${NC} Consider caching for frequently accessed data"
fi

echo ""
echo -e "${YELLOW}[5/5] Calculating performance score...${NC}"
echo ""

# Ensure score doesn't go below 1
if [ $PERFORMANCE_SCORE -lt 1 ]; then
  PERFORMANCE_SCORE=1
fi

# Determine grade and color
if [ $PERFORMANCE_SCORE -ge 9 ]; then
  GRADE="A (Excellent)"
  GRADE_COLOR="${GREEN}"
elif [ $PERFORMANCE_SCORE -ge 7 ]; then
  GRADE="B (Good)"
  GRADE_COLOR="${CYAN}"
elif [ $PERFORMANCE_SCORE -ge 5 ]; then
  GRADE="C (Acceptable)"
  GRADE_COLOR="${YELLOW}"
else
  GRADE="D (Needs Improvement)"
  GRADE_COLOR="${RED}"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Performance Report${NC}"
echo ""
echo -e "Feature: ${CYAN}$FEATURE_NAME${NC}"
echo ""
echo -e "Performance Score: ${GRADE_COLOR}$PERFORMANCE_SCORE/10 - $GRADE${NC}"
echo ""
echo -e "Issues Summary:"
echo -e "  ${RED}Critical:${NC} $CRITICAL_ISSUES"
echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "  ${CYAN}Suggestions:${NC} $SUGGESTIONS"
echo ""

# Recommendations based on score
if [ $PERFORMANCE_SCORE -lt 5 ]; then
  echo -e "${RED}⚠️  Action Required:${NC}"
  echo "  Performance issues detected that should be addressed before production."
  echo ""
  echo "Priority fixes:"
  echo "  1. Eliminate N+1 queries (use batching or .getMany())"
  echo "  2. Add limits to .list() calls"
  echo "  3. Optimize frontend re-renders"
  echo ""
  EXIT_CODE=1
elif [ $PERFORMANCE_SCORE -lt 7 ]; then
  echo -e "${YELLOW}⚠️  Recommendations:${NC}"
  echo "  Performance is acceptable but could be improved."
  echo ""
  echo "Suggested improvements:"
  echo "  1. Review query patterns for optimization opportunities"
  echo "  2. Consider adding pagination"
  echo "  3. Implement caching for frequently accessed data"
  echo ""
  EXIT_CODE=0
else
  echo -e "${GREEN}✅ Performance looks good!${NC}"
  echo ""

  if [ $SUGGESTIONS -gt 0 ]; then
    echo "Optional enhancements:"
    echo "  • Consider the suggestions above for further optimization"
    echo ""
  fi
  EXIT_CODE=0
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Performance benchmarks reference
echo -e "${CYAN}📌 Performance Benchmarks:${NC}"
echo ""
echo "  Database Queries:"
echo "    • Excellent: < 3 queries per route"
echo "    • Good: 3-5 queries per route"
echo "    • Warning: 5-10 queries per route"
echo "    • Critical: > 10 queries or N+1 patterns"
echo ""
echo "  API Response Times (target):"
echo "    • List endpoints: < 200ms"
echo "    • Detail endpoints: < 100ms"
echo "    • Create/Update: < 300ms"
echo ""
echo "  Response Sizes:"
echo "    • Good: < 100KB"
echo "    • Acceptable: 100KB - 500KB"
echo "    • Warning: 500KB - 2MB"
echo "    • Critical: > 2MB"
echo ""
echo "  Frontend Performance:"
echo "    • Minimize inline object creation in JSX"
echo "    • Use key props for all .map() renders"
echo "    • Virtualize lists > 50 items"
echo "    • Optimize with useMemo/useCallback when needed"
echo ""

exit $EXIT_CODE
