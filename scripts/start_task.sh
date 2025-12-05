#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting New Task ===${NC}"

# 1. Checkout main and pull latest changes
echo -e "\n${BLUE}1. Updating main branch...${NC}"
git checkout main
git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to update main. Please check your internet connection or git status.${NC}"
    exit 1
fi

# 2. Ask for new branch name
echo -e "\n${BLUE}2. Create new branch${NC}"
read -p "Enter a short name for your task (e.g., login-page, fix-header): " TASK_NAME

# Replace spaces with hyphens
SAFE_NAME=$(echo "$TASK_NAME" | tr ' ' '-')
BRANCH_NAME="feature/$SAFE_NAME"

# 3. Create and switch to new branch
git checkout -b "$BRANCH_NAME"

echo -e "\n${GREEN}Success! You are now on branch: $BRANCH_NAME${NC}"
echo "You can start working now."
