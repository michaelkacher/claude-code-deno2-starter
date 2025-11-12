#!/usr/bin/env bash
# Related Features Detection Script
# Automatically detects features that might share data models or functionality

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
CACHE_DIR=".cache/related-features"
CACHE_TTL=3600  # 1 hour cache validity

if [ -z "$FEATURE_NAME" ]; then
  echo -e "${RED}Error: Feature name required${NC}"
  echo "Usage: ./scripts/detect-related-features.sh <feature-name>"
  echo "Example: ./scripts/detect-related-features.sh campaign-creator"
  exit 1
fi

# Cache management
CACHE_FILE="$CACHE_DIR/${FEATURE_NAME}.json"
CACHE_AGE=0

if [ -f "$CACHE_FILE" ]; then
  CACHE_AGE=$(($(date +%s) - $(date -r "$CACHE_FILE" +%s)))
  
  if [ $CACHE_AGE -lt $CACHE_TTL ]; then
    echo -e "${GREEN}✓ Using cached results (${CACHE_AGE}s old)${NC}"
    cat "$CACHE_FILE"
    exit 0
  else
    echo -e "${YELLOW}⚠ Cache expired (${CACHE_AGE}s old), re-scanning...${NC}"
  fi
fi

echo -e "${BLUE}🔍 Detecting Related Features for: ${MAGENTA}${FEATURE_NAME}${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

RELATED_MOCKUPS=()
RELATED_PROPOSED=()
RELATED_IMPLEMENTED=()
SHARED_MODELS=()
CONFLICTS_FOUND=0

# Extract feature prefix (e.g., "campaign" from "campaign-creator")
FEATURE_PREFIX=$(echo "$FEATURE_NAME" | sed 's/-[^-]*$//')

echo -e "${YELLOW}[1/4] Searching for related mockups...${NC}"
echo ""

# Search for mockups with similar names
if [ -d "frontend/routes/mockups" ]; then
  for mockup in frontend/routes/mockups/*.tsx; do
    if [ -f "$mockup" ] && [ "$(basename "$mockup")" != "index.tsx" ]; then
      MOCKUP_NAME=$(basename "$mockup" .tsx)

      # Check if mockup name shares prefix or contains similar keywords
      if echo "$MOCKUP_NAME" | grep -q "$FEATURE_PREFIX"; then
        if [ "$MOCKUP_NAME" != "$FEATURE_NAME" ]; then
          RELATED_MOCKUPS+=("$MOCKUP_NAME")
          echo -e "  ${CYAN}→${NC} Found mockup: ${MAGENTA}$MOCKUP_NAME${NC}"

          # Check for RELATED MOCKUPS comment in file
          RELATED_IN_FILE=$(grep -i "RELATED.*MOCKUPS\|RELATED.*FEATURES" "$mockup" || true)
          if [ -n "$RELATED_IN_FILE" ]; then
            echo -e "    ${BLUE}ℹ${NC}  Declares relationships: ${YELLOW}$(echo "$RELATED_IN_FILE" | sed 's/.*://' | tr -d '*/')${NC}"
          fi
        fi
      fi
    fi
  done
fi

if [ ${#RELATED_MOCKUPS[@]} -eq 0 ]; then
  echo -e "  ${GREEN}✓${NC} No related mockups found"
fi

echo ""
echo -e "${YELLOW}[2/4] Searching for related proposed features...${NC}"
echo ""

# Search proposed features
if [ -d "features/proposed" ]; then
  for feature_dir in features/proposed/*; do
    if [ -d "$feature_dir" ]; then
      PROPOSED_NAME=$(basename "$feature_dir")

      if echo "$PROPOSED_NAME" | grep -q "$FEATURE_PREFIX"; then
        if [ "$PROPOSED_NAME" != "$FEATURE_NAME" ]; then
          RELATED_PROPOSED+=("$PROPOSED_NAME")
          echo -e "  ${CYAN}→${NC} Found proposed: ${MAGENTA}$PROPOSED_NAME${NC}"

          # Check for requirements.md
          if [ -f "$feature_dir/requirements.md" ]; then
            echo -e "    ${BLUE}ℹ${NC}  Has requirements documentation"

            # Extract data models
            MODELS=$(grep -A 5 "interface.*{" "$feature_dir/requirements.md" 2>/dev/null | grep "interface" | sed 's/interface //' | sed 's/ {.*//' || true)
            if [ -n "$MODELS" ]; then
              echo -e "    ${BLUE}ℹ${NC}  Data models: ${YELLOW}$(echo "$MODELS" | tr '\n' ', ' | sed 's/, $//')${NC}"

              # Store for conflict detection
              while IFS= read -r model; do
                if [ -n "$model" ]; then
                  SHARED_MODELS+=("$PROPOSED_NAME:$model")
                fi
              done <<< "$MODELS"
            fi
          fi
        fi
      fi
    fi
  done
fi

if [ ${#RELATED_PROPOSED[@]} -eq 0 ]; then
  echo -e "  ${GREEN}✓${NC} No related proposed features found"
fi

echo ""
echo -e "${YELLOW}[3/4] Searching for related implemented features...${NC}"
echo ""

# Search implemented features
if [ -d "features/implemented" ]; then
  for feature_dir in features/implemented/*; do
    if [ -d "$feature_dir" ]; then
      IMPL_NAME=$(basename "$feature_dir")

      if echo "$IMPL_NAME" | grep -q "$FEATURE_PREFIX"; then
        RELATED_IMPLEMENTED+=("$IMPL_NAME")
        echo -e "  ${CYAN}→${NC} Found implemented: ${MAGENTA}$IMPL_NAME${NC}"

        # Check for requirements.md
        if [ -f "$feature_dir/requirements.md" ]; then
          echo -e "    ${BLUE}ℹ${NC}  Has requirements documentation"

          # Extract data models
          MODELS=$(grep -A 5 "interface.*{" "$feature_dir/requirements.md" 2>/dev/null | grep "interface" | sed 's/interface //' | sed 's/ {.*//' || true)
          if [ -n "$MODELS" ]; then
            echo -e "    ${BLUE}ℹ${NC}  Data models: ${YELLOW}$(echo "$MODELS" | tr '\n' ', ' | sed 's/, $//')${NC}"

            # Store for conflict detection
            while IFS= read -r model; do
              if [ -n "$model" ]; then
                SHARED_MODELS+=("$IMPL_NAME:$model")
              fi
            done <<< "$MODELS"
          fi
        fi
      fi
    fi
  done
fi

if [ ${#RELATED_IMPLEMENTED[@]} -eq 0 ]; then
  echo -e "  ${GREEN}✓${NC} No related implemented features found"
fi

echo ""
echo -e "${YELLOW}[4/4] Analyzing data model conflicts...${NC}"
echo ""

# Check for model name conflicts
if [ ${#SHARED_MODELS[@]} -gt 0 ]; then
  declare -A model_count

  for entry in "${SHARED_MODELS[@]}"; do
    MODEL_NAME=$(echo "$entry" | cut -d: -f2)
    model_count[$MODEL_NAME]=$((${model_count[$MODEL_NAME]:-0} + 1))
  done

  for model in "${!model_count[@]}"; do
    COUNT=${model_count[$model]}
    if [ $COUNT -gt 1 ]; then
      echo -e "  ${YELLOW}⚠${NC}  Model ${MAGENTA}$model${NC} appears in ${RED}$COUNT${NC} features:"

      for entry in "${SHARED_MODELS[@]}"; do
        if echo "$entry" | grep -q ":$model$"; then
          FEATURE=$(echo "$entry" | cut -d: -f1)
          echo -e "      ${CYAN}→${NC} $FEATURE"
        fi
      done

      echo -e "      ${YELLOW}Action: Ensure model definitions are consistent${NC}"
      echo ""
      CONFLICTS_FOUND=$((CONFLICTS_FOUND + 1))
    fi
  done

  if [ $CONFLICTS_FOUND -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} No model name conflicts detected"
  fi
else
  echo -e "  ${GREEN}✓${NC} No shared models to analyze"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Summary
TOTAL_RELATED=$((${#RELATED_MOCKUPS[@]} + ${#RELATED_PROPOSED[@]} + ${#RELATED_IMPLEMENTED[@]}))

if [ $TOTAL_RELATED -eq 0 ]; then
  echo -e "${GREEN}✅ No related features detected${NC}"
  echo ""
  echo -e "${GREEN}This feature appears to be independent.${NC}"
  echo ""
else
  echo -e "${CYAN}📊 Summary${NC}"
  echo ""

  if [ ${#RELATED_MOCKUPS[@]} -gt 0 ]; then
    echo -e "${CYAN}Related Mockups (${#RELATED_MOCKUPS[@]}):${NC}"
    for mockup in "${RELATED_MOCKUPS[@]}"; do
      echo -e "  ${MAGENTA}•${NC} $mockup"
    done
    echo ""
  fi

  if [ ${#RELATED_PROPOSED[@]} -gt 0 ]; then
    echo -e "${CYAN}Related Proposed Features (${#RELATED_PROPOSED[@]}):${NC}"
    for feature in "${RELATED_PROPOSED[@]}"; do
      echo -e "  ${MAGENTA}•${NC} $feature"
    done
    echo ""
  fi

  if [ ${#RELATED_IMPLEMENTED[@]} -gt 0 ]; then
    echo -e "${CYAN}Related Implemented Features (${#RELATED_IMPLEMENTED[@]}):${NC}"
    for feature in "${RELATED_IMPLEMENTED[@]}"; do
      echo -e "  ${MAGENTA}•${NC} $feature"
    done
    echo ""
  fi

  if [ $CONFLICTS_FOUND -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Data Model Warnings: ${RED}$CONFLICTS_FOUND${NC}"
    echo ""
    echo -e "${YELLOW}Recommendations:${NC}"
    echo -e "  1. Review shared data model definitions"
    echo -e "  2. Ensure field names and types are consistent"
    echo -e "  3. Document shared models in 'Shared Models' section"
    echo -e "  4. Consider creating a shared types file"
    echo ""
  else
    echo -e "${GREEN}✓ No data model conflicts detected${NC}"
    echo ""
  fi

  echo -e "${BLUE}Next Steps:${NC}"
  echo -e "  1. Review related feature requirements:"

  for feature in "${RELATED_PROPOSED[@]}"; do
    echo -e "     ${CYAN}→${NC} features/proposed/$feature/requirements.md"
  done

  for feature in "${RELATED_IMPLEMENTED[@]}"; do
    echo -e "     ${CYAN}→${NC} features/implemented/$feature/requirements.md"
  done

  echo -e "  2. Ensure data models are consistent"
  echo -e "  3. Pass this information to requirements-agent-feature"
  echo ""
fi

# Cache results
mkdir -p "$CACHE_DIR"
cat > "$CACHE_FILE" << EOF
{
  "featureName": "$FEATURE_NAME",
  "scannedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "relatedMockups": [$(printf '"%s",' "${RELATED_MOCKUPS[@]}" | sed 's/,$//') ],
  "relatedProposed": [$(printf '"%s",' "${RELATED_PROPOSED[@]}" | sed 's/,$//') ],
  "relatedImplemented": [$(printf '"%s",' "${RELATED_IMPLEMENTED[@]}" | sed 's/,$//') ],
  "conflictsFound": $CONFLICTS_FOUND
}
EOF

echo -e "${GREEN}✓ Results cached for 1 hour${NC}"

# Export results for programmatic use
cat > /tmp/related-features-$FEATURE_NAME.json << EOF
{
  "featureName": "$FEATURE_NAME",
  "relatedMockups": [$(printf '"%s",' "${RELATED_MOCKUPS[@]}" | sed 's/,$//')]
  "relatedProposed": [$(printf '"%s",' "${RELATED_PROPOSED[@]}" | sed 's/,$//')]
  "relatedImplemented": [$(printf '"%s",' "${RELATED_IMPLEMENTED[@]}" | sed 's/,$//')]
  "conflictsFound": $CONFLICTS_FOUND,
  "totalRelated": $TOTAL_RELATED
}
EOF

echo -e "${BLUE}ℹ${NC}  Results saved to: /tmp/related-features-$FEATURE_NAME.json"
echo ""

exit 0
