#!/bin/bash
echo "🔒 Fixing security issue..."

# Remove from tracking
git rm --cached docker.env 2>/dev/null || true

# Add to .gitignore
echo "docker.env" >> .gitignore
echo "docker-compose.yml" >> .gitignore

# Remove from history
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch docker.env docker-compose.yml' --prune-empty --tag-name-filter cat -- --all

# Clean up
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all

echo "✅ Security fix complete!"
echo "🔐 docker.env and docker-compose.yml are now untracked"
