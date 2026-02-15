#!/bin/bash

# Vercel branch filter script
# This script is used in Vercel dashboard to control which branches trigger builds

# Log the branch name for debugging
echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

# Only build if branch is "main" or starts with "feature/"
if [[ "$VERCEL_GIT_COMMIT_REF" == "main" || "$VERCEL_GIT_COMMIT_REF" == feature/* ]]; then
  echo "â - Allowed branch: proceed with build"
  exit 1  # 1 = proceed
else
  echo "ð - Skipped branch: cancel build"
  exit 0  # 0 = skip
fi