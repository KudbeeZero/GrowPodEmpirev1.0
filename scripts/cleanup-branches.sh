#!/bin/bash

# Branch Cleanup Script for GrowPod Empire
# This script helps identify and clean up stale branches

set -e

echo "================================================"
echo "  GrowPod Empire - Branch Cleanup Tool"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STALE_DAYS=14
DRY_RUN=true

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --delete)
      DRY_RUN=false
      shift
      ;;
    --days)
      STALE_DAYS="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --delete       Actually delete branches (default is dry-run)"
      echo "  --days N       Consider branches older than N days as stale (default: 14)"
      echo "  --help         Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                    # Dry run, show what would be deleted"
      echo "  $0 --delete           # Actually delete stale branches"
      echo "  $0 --days 30 --delete # Delete branches older than 30 days"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Ensure we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${RED}Error: Not in a git repository${NC}"
  exit 1
fi

echo -e "${BLUE}Fetching latest changes...${NC}"
git fetch --prune origin

echo ""
echo "Configuration:"
echo "  - Stale threshold: $STALE_DAYS days"
echo "  - Mode: $([ "$DRY_RUN" = true ] && echo "DRY RUN (no changes)" || echo "DELETE MODE")"
echo ""

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "Current branch: ${GREEN}$CURRENT_BRANCH${NC}"
echo ""

# Function to check if branch is merged
is_merged() {
  local branch=$1
  git branch -r --merged origin/main | grep -q "$branch"
}

# Function to get days since last commit
days_since_last_commit() {
  local branch=$1
  local last_commit=$(git log -1 --format=%ct "$branch" 2>/dev/null)
  local now=$(date +%s)
  echo $(( ($now - $last_commit) / 86400 ))
}

# Function to get last commit message
last_commit_message() {
  local branch=$1
  git log -1 --format="%s" "$branch" 2>/dev/null | head -c 50
}

echo "================================================"
echo "  Analyzing Branches"
echo "================================================"
echo ""

# Arrays to store branch categories
declare -a merged_branches=()
declare -a stale_branches=()
declare -a active_branches=()

# Analyze all remote branches (except main and production)
for branch in $(git branch -r | grep -v HEAD | grep -v "origin/main" | grep -v "origin/production"); do
  branch_name=${branch#origin/}
  days=$(days_since_last_commit "$branch")
  commit_msg=$(last_commit_message "$branch")
  
  # Skip if branch doesn't exist (race condition)
  if [ -z "$days" ]; then
    continue
  fi
  
  # Categorize branch
  if is_merged "$branch"; then
    merged_branches+=("$branch_name|$days|$commit_msg")
  elif [ $days -gt $STALE_DAYS ]; then
    stale_branches+=("$branch_name|$days|$commit_msg")
  else
    active_branches+=("$branch_name|$days|$commit_msg")
  fi
done

# Display merged branches
if [ ${#merged_branches[@]} -gt 0 ]; then
  echo -e "${GREEN}Merged Branches (safe to delete):${NC}"
  echo "------------------------------------------------"
  for entry in "${merged_branches[@]}"; do
    IFS='|' read -r name days msg <<< "$entry"
    echo -e "  ${GREEN}✓${NC} $name"
    echo -e "    Last commit: $days days ago"
    echo -e "    Message: $msg"
    echo ""
  done
fi

# Display stale branches
if [ ${#stale_branches[@]} -gt 0 ]; then
  echo -e "${YELLOW}Stale Branches (>$STALE_DAYS days, not merged):${NC}"
  echo "------------------------------------------------"
  for entry in "${stale_branches[@]}"; do
    IFS='|' read -r name days msg <<< "$entry"
    echo -e "  ${YELLOW}⚠${NC} $name"
    echo -e "    Last commit: $days days ago"
    echo -e "    Message: $msg"
    echo ""
  done
fi

# Display active branches
if [ ${#active_branches[@]} -gt 0 ]; then
  echo -e "${BLUE}Active Branches (<$STALE_DAYS days):${NC}"
  echo "------------------------------------------------"
  for entry in "${active_branches[@]}"; do
    IFS='|' read -r name days msg <<< "$entry"
    echo -e "  ${BLUE}●${NC} $name"
    echo -e "    Last commit: $days days ago"
    echo -e "    Message: $msg"
    echo ""
  done
fi

# Summary
echo "================================================"
echo "  Summary"
echo "================================================"
echo -e "  Merged branches: ${GREEN}${#merged_branches[@]}${NC}"
echo -e "  Stale branches:  ${YELLOW}${#stale_branches[@]}${NC}"
echo -e "  Active branches: ${BLUE}${#active_branches[@]}${NC}"
echo ""

# Deletion logic
total_to_delete=$((${#merged_branches[@]} + ${#stale_branches[@]}))

if [ $total_to_delete -eq 0 ]; then
  echo -e "${GREEN}✓ No branches to clean up!${NC}"
  exit 0
fi

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}DRY RUN MODE${NC}"
  echo "The following branches would be deleted:"
  echo ""
  
  for entry in "${merged_branches[@]}" "${stale_branches[@]}"; do
    IFS='|' read -r name days msg <<< "$entry"
    echo -e "  ${RED}✗${NC} $name"
  done
  
  echo ""
  echo "To actually delete these branches, run:"
  echo -e "  ${GREEN}$0 --delete${NC}"
else
  echo -e "${RED}DELETE MODE${NC}"
  echo "Deleting $total_to_delete branches..."
  echo ""
  
  deleted_count=0
  failed_count=0
  
  for entry in "${merged_branches[@]}" "${stale_branches[@]}"; do
    IFS='|' read -r name days msg <<< "$entry"
    
    echo -n "Deleting $name... "
    if git push origin --delete "$name" 2>/dev/null; then
      echo -e "${GREEN}✓${NC}"
      deleted_count=$((deleted_count + 1))
    else
      echo -e "${RED}✗ Failed${NC}"
      failed_count=$((failed_count + 1))
    fi
  done
  
  echo ""
  echo "================================================"
  echo "  Cleanup Complete"
  echo "================================================"
  echo -e "  Deleted: ${GREEN}$deleted_count${NC}"
  echo -e "  Failed:  ${RED}$failed_count${NC}"
  
  # Clean up local references
  echo ""
  echo "Pruning local references..."
  git fetch --prune origin
  echo -e "${GREEN}✓ Done${NC}"
fi

echo ""
