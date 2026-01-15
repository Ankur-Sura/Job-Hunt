# GitHub Upload Checklist

This guide will help you prepare and upload your Job Hunt project to GitHub.

## ✅ Pre-Upload Checklist

### 1. Verify Sensitive Files Are Excluded

Run these commands to ensure no sensitive files will be committed:

```bash
# Check for .env files (should return nothing)
find . -name ".env" -type f

# Check for node_modules (should be ignored)
ls -d node_modules/ 2>/dev/null || echo "✅ node_modules not in root"

# Check for venv (should be ignored)
ls -d AI/venv/ 2>/dev/null || echo "✅ venv not tracked"
```

### 2. Verify .gitignore is Working

```bash
# Initialize git (if not already done)
git init

# Check what will be ignored
git status --ignored
```

### 3. Create Environment Files

Make sure you have `.env` files created from the examples:

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your actual values

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env if needed

# AI Service
cd ../AI
cp .env.example .env
# Edit .env with your API keys
```

## 🚀 Upload to GitHub

### Step 1: Initialize Git Repository

```bash
cd "/Users/ankursura/Desktop/Project Learning/Project 4/Job Hunt"
git init
```

### Step 2: Add Files

```bash
# Add all files (respects .gitignore)
git add .

# Review what will be committed
git status
```

**Important:** Verify that:
- ❌ No `.env` files are listed
- ❌ No `node_modules/` directories are listed
- ❌ No `venv/` or `__pycache__/` directories are listed
- ✅ `.env.example` files ARE included
- ✅ Source code files ARE included

### Step 3: Create Initial Commit

```bash
git commit -m "Initial commit: Job Hunt - AI-Powered Job Matching Platform"
```

### Step 4: Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click the "+" icon in the top right
3. Select "New repository"
4. Name it (e.g., `job-hunt` or `ai-job-portal`)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### Step 5: Connect and Push

```bash
# Add remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## 🔒 Security Reminders

### Before Pushing, Double-Check:

1. **No API Keys in Code**
   ```bash
   # Search for potential API keys in code
   grep -r "sk-[a-zA-Z0-9]" --exclude-dir=node_modules --exclude-dir=venv .
   grep -r "api[_-]key" --exclude-dir=node_modules --exclude-dir=venv -i .
   ```

2. **No Database Credentials**
   ```bash
   # Check for MongoDB URIs with passwords
   grep -r "mongodb://.*:.*@" --exclude-dir=node_modules --exclude-dir=venv .
   ```

3. **No JWT Secrets**
   ```bash
   # Check for hardcoded secrets
   grep -r "JWT_SECRET.*=" --exclude-dir=node_modules --exclude-dir=venv .
   ```

### If You Accidentally Committed Sensitive Data

If you've already pushed sensitive data:

1. **Remove from Git History** (use with caution):
   ```bash
   # Use git filter-branch or BFG Repo-Cleaner
   # Or simply change the credentials and commit the fix
   ```

2. **Rotate All Credentials**:
   - Change all API keys
   - Change JWT secrets
   - Change database passwords
   - Update all `.env` files

## 📝 Post-Upload Tasks

1. **Add Repository Description** on GitHub
2. **Add Topics/Tags** (e.g., `react`, `nodejs`, `fastapi`, `ai`, `job-portal`)
3. **Enable GitHub Actions** (if you plan to add CI/CD)
4. **Add Collaborators** (if working in a team)
5. **Set up Branch Protection** (for main branch)

## 🎯 Repository Settings

Recommended GitHub repository settings:

- ✅ **Issues**: Enable
- ✅ **Projects**: Enable (optional)
- ✅ **Wiki**: Disable (unless needed)
- ✅ **Discussions**: Enable (optional)
- ✅ **Allow merge commits**: Yes
- ✅ **Allow squash merging**: Yes
- ✅ **Allow rebase merging**: Yes

## 📚 Additional Resources

- [GitHub Documentation](https://docs.github.com)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [.gitignore Patterns](https://git-scm.com/docs/gitignore)

## ❓ Troubleshooting

### "Permission denied" when pushing
- Check your GitHub credentials
- Use SSH keys or Personal Access Token

### "Repository not found"
- Verify the repository name and your username
- Check if the repository exists on GitHub

### Large files warning
- The `.gitignore` should exclude `node_modules/` and `venv/`
- If you see warnings, verify `.gitignore` is working

### Merge conflicts
- Usually not an issue for initial commit
- If cloning later, use `git pull` before making changes
