#!/bin/bash

# AI Branch Report Script for GrowPod Empire
# This script generates a report of all AI-generated branches

set -e

echo "================================================"
echo "  GrowPod Empire - AI Branch Report"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Ensure we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${RED}Error: Not in a git repository${NC}"
  exit 1
fi

# Fetch latest changes
echo -e "${BLUE}Fetching latest changes...${NC}"
git fetch --prune origin
echo ""

# Function to get branch info
get_branch_info() {
  local branch=$1
  local days=$(git log -1 --format=%cr "$branch" 2>/dev/null)
  local author=$(git log -1 --format=%an "$branch" 2>/dev/null)
  local commit=$(git log -1 --format=%h "$branch" 2>/dev/null)
  local message=$(git log -1 --format=%s "$branch" 2>/dev/null | head -c 60)
  
  echo "$days|$author|$commit|$message"
}

# Function to check if branch is merged
is_merged() {
  local branch=$1
  if git branch -r --merged origin/main | grep -q "$branch"; then
    echo "✓ Merged"
  else
    echo "○ Not merged"
  fi
}

# Count commits ahead of main
commits_ahead() {
  local branch=$1
  git rev-list --count origin/main.."$branch" 2>/dev/null || echo "0"
}

# Arrays to store different types of AI branches
declare -a copilot_branches=()
declare -a ai_branches=()
declare -a experiment_branches=()

# Collect all AI-related branches
for branch in $(git branch -r | grep -v HEAD); do
  branch_name=${branch#origin/}
  
  # Skip main and production
  if [[ "$branch_name" == "main" || "$branch_name" == "production" ]]; then
    continue
  fi
  
  # Categorize by prefix
  if [[ "$branch_name" == copilot/* ]]; then
    copilot_branches+=("$branch")
  elif [[ "$branch_name" == ai/* ]]; then
    ai_branches+=("$branch")
  elif [[ "$branch_name" == experiment/* ]]; then
    experiment_branches+=("$branch")
  fi
done

# Total AI branches
total_ai=$((${#copilot_branches[@]} + ${#ai_branches[@]} + ${#experiment_branches[@]}))

echo "================================================"
echo "  Summary"
echo "================================================"
echo -e "  Copilot branches:    ${CYAN}${#copilot_branches[@]}${NC}"
echo -e "  AI branches:         ${CYAN}${#ai_branches[@]}${NC}"
echo -e "  Experiment branches: ${CYAN}${#experiment_branches[@]}${NC}"
echo -e "  ${BLUE}Total AI branches:   ${total_ai}${NC}"
echo ""

# Display Copilot branches
if [ ${#copilot_branches[@]} -gt 0 ]; then
  echo "================================================"
  echo "  GitHub Copilot Branches"
  echo "================================================"
  echo ""
  
  for branch in "${copilot_branches[@]}"; do
    branch_name=${branch#origin/}
    info=$(get_branch_info "$branch")
    IFS='|' read -r age author commit message <<< "$info"
    merged=$(is_merged "$branch")
    ahead=$(commits_ahead "$branch")
    
    echo -e "${CYAN}Branch:${NC} $branch_name"
    echo -e "  Status:  $merged"
    echo -e "  Commits: $ahead ahead of main"
    echo -e "  Age:     $age"
    echo -e "  Author:  $author"
    echo -e "  Latest:  [$commit] $message"
    echo ""
  done
fi

# Display AI branches
if [ ${#ai_branches[@]} -gt 0 ]; then
  echo "================================================"
  echo "  AI-Generated Branches"
  echo "================================================"
  echo ""
  
  for branch in "${ai_branches[@]}"; do
    branch_name=${branch#origin/}
    info=$(get_branch_info "$branch")
    IFS='|' read -r age author commit message <<< "$info"
    merged=$(is_merged "$branch")
    ahead=$(commits_ahead "$branch")
    
    echo -e "${CYAN}Branch:${NC} $branch_name"
    echo -e "  Status:  $merged"
    echo -e "  Commits: $ahead ahead of main"
    echo -e "  Age:     $age"
    echo -e "  Author:  $author"
    echo -e "  Latest:  [$commit] $message"
    echo ""
  done
fi

# Display Experiment branches
if [ ${#experiment_branches[@]} -gt 0 ]; then
  echo "================================================"
  echo "  Experimental Branches"
  echo "================================================"
  echo ""
  
  for branch in "${experiment_branches[@]}"; do
    branch_name=${branch#origin/}
    info=$(get_branch_info "$branch")
    IFS='|' read -r age author commit message <<< "$info"
    merged=$(is_merged "$branch")
    ahead=$(commits_ahead "$branch")
    
    echo -e "${CYAN}Branch:${NC} $branch_name"
    echo -e "  Status:  $merged"
    echo -e "  Commits: $ahead ahead of main"
    echo -e "  Age:     $age"
    echo -e "  Author:  $author"
    echo -e "  Latest:  [$commit] $message"
    echo ""
  done
fi

# Recommendations
echo "================================================"
echo "  Recommendations"
echo "================================================"
echo ""

if [ $total_ai -eq 0 ]; then
  echo -e "${GREEN}✓ No AI branches found. Repository is clean!${NC}"
elif [ $total_ai -le 5 ]; then
  echo -e "${GREEN}✓ AI branch count is reasonable ($total_ai branches)${NC}"
  echo "  Continue monitoring and clean up merged branches."
elif [ $total_ai -le 10 ]; then
  echo -e "${YELLOW}⚠ AI branch count is getting high ($total_ai branches)${NC}"
  echo "  Consider consolidating or cleaning up merged branches."
  echo "  Run: ./scripts/cleanup-branches.sh"
else
  echo -e "${RED}✗ Too many AI branches ($total_ai branches)${NC}"
  echo "  Immediate cleanup recommended!"
  echo "  Run: ./scripts/cleanup-branches.sh --delete"
fi

echo ""

# Check for very old branches
echo "Checking for old AI branches (>30 days)..."
old_count=0

for branch in "${copilot_branches[@]}" "${ai_branches[@]}" "${experiment_branches[@]}"; do
  last_commit=$(git log -1 --format=%ct "$branch" 2>/dev/null)
  now=$(date +%s)
  days=$(( ($now - $last_commit) / 86400 ))
  
  if [ $days -gt 30 ]; then
    old_count=$((old_count + 1))
    branch_name=${branch#origin/}
    echo -e "  ${YELLOW}⚠${NC} $branch_name (${days} days old)"
  fi
done

if [ $old_count -eq 0 ]; then
  echo -e "  ${GREEN}✓ No branches older than 30 days${NC}"
else
  echo ""
  echo -e "${YELLOW}Found $old_count branch(es) older than 30 days.${NC}"
  echo "Consider reviewing and cleaning these up."
fi

echo ""
echo "================================================"
echo "  Quick Actions"
echo "================================================"
echo ""
echo "To view all branches sorted by date:"
echo "  git branch -r --sort=-committerdate | grep -E 'copilot|ai|experiment'"
echo ""
echo "To clean up old/merged branches:"
echo "  ./scripts/cleanup-branches.sh          # Dry run"
echo "  ./scripts/cleanup-branches.sh --delete # Actually delete"
echo ""
echo "To check a specific branch locally:"
echo "  git fetch origin <branch-name>"
echo "  git checkout <branch-name>"
echo ""
