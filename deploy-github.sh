#!/bin/bash
# Deploy to GitHub Pages

cd "$(dirname "$0")"

echo "📦 Deploying MSc Exam Drill to GitHub Pages..."

# Check if gh is authenticated
if ! gh auth status &>/dev/null; then
    echo "❌ Not logged in to GitHub. Run: gh auth login"
    exit 1
fi

# Check if repo exists
REPO_NAME="msc-exam-drill"

if ! gh repo view "$REPO_NAME" &>/dev/null; then
    echo "📁 Creating GitHub repository..."
    gh repo create "$REPO_NAME" --public --description "MSc Exam Drill - AGH ISI exam preparation app" --source=. --push
else
    echo "📤 Pushing to existing repository..."
    git push origin master
fi

# Enable GitHub Pages
echo "🌐 Enabling GitHub Pages..."
gh repo edit --enable-pages --pages-branch master --pages-path /

echo ""
echo "✅ Deployed! Your site will be available at:"
echo "   https://$(gh api user --jq '.login').github.io/$REPO_NAME/"
echo ""
echo "⏳ It may take a few minutes for GitHub Pages to build."
