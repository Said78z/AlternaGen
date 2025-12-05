#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Finishing Task ===${NC}"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" == "main" ]; then
    echo -e "${YELLOW}Warning: You are on the 'main' branch.${NC}"
    read -p "Are you sure you want to commit directly to main? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 1. Show status
echo -e "\n${BLUE}1. Checking status...${NC}"
git status

# 2. Add all changes
echo -e "\n${BLUE}2. Staging all changes...${NC}"
git add .

# 3. Commit
echo -e "\n${BLUE}3. Commit changes${NC}"
read -p "Enter commit message: " COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
    echo "Commit message cannot be empty. Aborting."
    exit 1
fi

git commit -m "$COMMIT_MSG"

# 4. Push
echo -e "\n${BLUE}4. Pushing to GitHub...${NC}"
git push --set-upstream origin "$CURRENT_BRANCH"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Success! Changes pushed.${NC}"
    echo -e "${BLUE}Create your Merge Request (Pull Request) here:${NC}"
    # Generate standard GitHub PR URL
    echo "https://github.com/Said78z/AlternaGen/pull/new/$CURRENT_BRANCH"
else
    echo -e "${RED}Error pushing changes.${NC}"
fi
