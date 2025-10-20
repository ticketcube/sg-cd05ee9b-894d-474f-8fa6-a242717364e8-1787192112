# 🚀 GitHub PRD Setup Instructions

Complete step-by-step guide to set up your OTW Chart PRD repository on GitHub with automated issue templates and roadmap generation.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create GitHub Repository](#step-1-create-github-repository)
3. [Step 2: Upload PRD Files](#step-2-upload-prd-files)
4. [Step 3: Set Up Issue Templates](#step-3-set-up-issue-templates)
5. [Step 4: Enable GitHub Actions](#step-4-enable-github-actions)
6. [Step 5: Create Project Board](#step-5-create-project-board)
7. [Step 6: Configure Labels](#step-6-configure-labels)
8. [Step 7: Create Initial Issues](#step-7-create-initial-issues)
9. [Step 8: Enable Discussions (Optional)](#step-8-enable-discussions-optional)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- [ ] GitHub account with repository creation permissions
- [ ] All PRD files from the `github-setup/` folder
- [ ] Basic familiarity with GitHub interface

---

## Step 1: Create GitHub Repository

### 1.1 Create New Repository

1. **Go to GitHub:** Navigate to https://github.com
2. **Click "New"** button (top right) or go to https://github.com/new
3. **Repository Settings:**
   - **Name:** `otwchart-prd` (or `otwchart-product-docs`)
   - **Description:** "Product Requirements Document for OTW Chart - Music Discovery & Rewards Platform"
   - **Visibility:** 
     - Choose **Private** if you want to keep it internal
     - Choose **Public** if you want to share publicly
   - **Initialize:**
     - ✅ Check "Add a README file"
     - ❌ Don't add .gitignore (we'll create our own)
     - ❌ Don't choose a license yet (unless required)

4. **Click "Create repository"**

### 1.2 Repository Settings

After creation, configure repository settings:

1. **Go to Settings** (top right of your repo page)
2. **General Settings:**
   - Enable "Issues" ✅
   - Enable "Projects" ✅
   - Disable "Wiki" (we'll use GitHub Pages instead)
   - Enable "Discussions" ✅ (optional, but recommended)

---

## Step 2: Upload PRD Files

### Option A: Upload via Web Interface (Easiest)

1. **Navigate to your repository** on GitHub
2. **Click "Add file" → "Upload files"**
3. **Drag and drop these files/folders:**
   ```
   github-setup/README.md  → rename to README.md (replace existing)
   PRODUCT_REQUIREMENTS_DOCUMENT.md
   github-setup/issue-templates/ folder
   github-setup/workflows/ folder
   ```

4. **Create folder structure:**
   - Create `.github/` folder in root
   - Move `issue-templates/` inside `.github/`
   - Move `workflows/` inside `.github/`

5. **Final structure should look like:**
   ```
   otwchart-prd/
   ├── README.md
   ├── PRODUCT_REQUIREMENTS_DOCUMENT.md
   └── .github/
       ├── ISSUE_TEMPLATE/
       │   ├── feature-requirement.md
       │   ├── bug-report.md
       │   └── enhancement.md
       └── workflows/
           └── roadmap-generator.yml
   ```

6. **Commit changes:**
   - Commit message: "docs: Add PRD and issue templates"
   - Click "Commit changes"

### Option B: Upload via Git CLI (For Advanced Users)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/otwchart-prd.git
cd otwchart-prd

# Create directory structure
mkdir -p .github/ISSUE_TEMPLATE
mkdir -p .github/workflows

# Copy files from your local github-setup folder
cp /path/to/github-setup/README.md ./
cp /path/to/PRODUCT_REQUIREMENTS_DOCUMENT.md ./
cp /path/to/github-setup/issue-templates/*.md ./.github/ISSUE_TEMPLATE/
cp /path/to/github-setup/workflows/roadmap-generator.yml ./.github/workflows/

# Commit and push
git add .
git commit -m "docs: Add PRD and issue templates"
git push origin main
```

---

## Step 3: Set Up Issue Templates

### 3.1 Verify Issue Templates

1. **Go to your repository** on GitHub
2. **Click "Issues" tab**
3. **Click "New issue"**
4. **You should see three templates:**
   - 📋 Feature Requirement
   - 🐛 Bug Report
   - ⚡ Enhancement

If you don't see them, verify:
- Files are in `.github/ISSUE_TEMPLATE/` folder
- Files end with `.md` extension
- YAML frontmatter is properly formatted

### 3.2 Customize Templates (Optional)

Edit the templates to match your team's workflow:

1. **Navigate to:** `.github/ISSUE_TEMPLATE/`
2. **Click on a template** (e.g., `feature-requirement.md`)
3. **Click the pencil icon** to edit
4. **Modify:**
   - Default assignees
   - Labels
   - Template content
5. **Commit changes**

---

## Step 4: Enable GitHub Actions

### 4.1 Enable Actions

1. **Go to repository Settings**
2. **Click "Actions" → "General"** (left sidebar)
3. **Workflow permissions:**
   - Select "Read and write permissions"
   - ✅ Check "Allow GitHub Actions to create and approve pull requests"
4. **Click "Save"**

### 4.2 Verify Workflow

1. **Go to "Actions" tab** in your repository
2. **You should see:** "Generate Project Roadmap" workflow
3. **Trigger manually to test:**
   - Click on the workflow
   - Click "Run workflow" dropdown
   - Click "Run workflow" button
4. **Check results:**
   - Wait for workflow to complete (~1 minute)
   - Go back to repository root
   - You should see a new `ROADMAP.md` file

### 4.3 Troubleshooting Workflow

If workflow fails:

**Check permissions:**
```yaml
# In .github/workflows/roadmap-generator.yml
permissions:
  contents: write  # Must be enabled
  issues: read     # Must be enabled
```

**Common issues:**
- **403 Error:** Enable write permissions in Settings → Actions
- **File not found:** Verify workflow file is in `.github/workflows/`
- **Syntax error:** Validate YAML at https://www.yamllint.com/

---

## Step 5: Create Project Board

### 5.1 Create New Project

1. **Go to "Projects" tab** in your repository
2. **Click "New project"**
3. **Choose template:**
   - Select **"Feature"** or **"Roadmap"** template
   - Or start with **"Board"** for Kanban-style
4. **Name it:** "OTW Chart Requirements"
5. **Click "Create"**

### 5.2 Configure Project Board

**Add columns (if using Board template):**
- 📋 Backlog
- 🎯 Planned (Sprint/Phase)
- 🚧 In Progress
- 👀 In Review
- ✅ Complete
- 🚀 Released

**Customize views:**
1. **Click "View" dropdown** (top right)
2. **Add new view:**
   - **"By Phase"** - Group by: Phase label
   - **"By Priority"** - Sort by: Priority label
   - **"By Component"** - Group by: Component label

### 5.3 Link Issues to Project

**Automatic linking:**
1. **Go to Project Settings** (⚙️ icon)
2. **Click "Workflows"**
3. **Enable "Auto-add to project":**
   - When: Issues are created
   - If: Label contains `requirement`
   - Then: Add to project in "Backlog" column

**Manual linking:**
1. **Open any issue**
2. **Right sidebar → "Projects"**
3. **Click "+" and select your project**

---

## Step 6: Configure Labels

### 6.1 Create Custom Labels

1. **Go to "Issues" → "Labels"**
2. **Click "New label"**
3. **Create these labels:**

**Priority Labels:**
```
priority-p0 | #d73a4a | Critical - Must have
priority-p1 | #ff9800 | High - Important
priority-p2 | #ffeb3b | Medium - Valuable
priority-p3 | #4caf50 | Low - Nice to have
```

**Phase Labels:**
```
phase-1    | #0052cc | MVP
phase-2    | #5319e7 | Phase 2 - Q1 2026
phase-3    | #8b66d6 | Phase 3 - Q2 2026
phase-4    | #b794f4 | Phase 4 - Q3-Q4 2026
```

**Component Labels:**
```
component-auth        | #006b75 | Authentication
component-points      | #d4c5f9 | Points System
component-weekly      | #c2e0c6 | Weekly Lists
component-profile     | #fef2c0 | User Profile
component-rewards     | #fbca04 | Rewards
component-pwa         | #0e8a16 | PWA Features
component-admin       | #d93f0b | Admin Tools
```

**Status Labels:**
```
status-in-progress | #1d76db | Currently being worked on
status-blocked     | #e11d48 | Blocked by dependencies
status-needs-review| #7e57c2 | Ready for review
```

**Type Labels:**
```
requirement | #0e8a16 | Product requirement
bug         | #d73a4a | Something isn't working
enhancement | #a2eeef | Improvement to existing feature
documentation | #0075ca | Documentation update
```

### 6.2 Bulk Label Creation (Advanced)

Use GitHub CLI to create labels faster:

```bash
# Install GitHub CLI: https://cli.github.com/

# Authenticate
gh auth login

# Create labels from a file
gh label create priority-p0 --color d73a4a --description "Critical - Must have"
gh label create priority-p1 --color ff9800 --description "High - Important"
# ... repeat for all labels
```

Or use a script:

```bash
#!/bin/bash
REPO="YOUR_USERNAME/otwchart-prd"

gh label create -R $REPO priority-p0 -c d73a4a -d "Critical - Must have"
gh label create -R $REPO priority-p1 -c ff9800 -d "High - Important"
gh label create -R $REPO priority-p2 -c ffeb3b -d "Medium - Valuable"
gh label create -R $REPO priority-p3 -c 4caf50 -d "Low - Nice to have"

gh label create -R $REPO phase-1 -c 0052cc -d "MVP"
gh label create -R $REPO phase-2 -c 5319e7 -d "Phase 2 - Q1 2026"
gh label create -R $REPO phase-3 -c 8b66d6 -d "Phase 3 - Q2 2026"
gh label create -R $REPO phase-4 -c b794f4 -d "Phase 4 - Q3-Q4 2026"
```

---

## Step 7: Create Initial Issues

### 7.1 Create Issues from PRD

Create an issue for each major requirement in the PRD:

**Example: Authentication System**

1. **Click "Issues" → "New issue"**
2. **Choose "Feature Requirement" template**
3. **Fill in details:**

```markdown
**Requirement ID:** AUTH-001
**Priority:** P0 - Critical
**Phase:** MVP
**Feature Area:** Authentication

## Feature Description

### Overview
User authentication system using Supabase Auth with email/password and OAuth support.

### User Story
As a new user, I want to create an account with my email, so that I can save my progress and earn points.

## Requirements

### Functional Requirements
- [ ] Email/password authentication
- [ ] OAuth integration (Google, Apple)
- [ ] Secure session management
- [ ] Password reset functionality
- [ ] Email verification

### Non-Functional Requirements
- [ ] Performance: < 500ms authentication time
- [ ] Security: JWT token-based with automatic refresh
- [ ] Usability: Simple, one-click OAuth flow

[... continue filling template ...]
```

4. **Add labels:**
   - `requirement`
   - `priority-p0`
   - `phase-1`
   - `component-auth`

5. **Assign to project:** Select "OTW Chart Requirements"

6. **Click "Submit new issue"**

### 7.2 Batch Create Issues

**Create issues for all major PRD sections:**

From the PRD, create issues for:
- AUTH-001: User Authentication
- PROFILE-001: User Profile System
- WEEKLY-001: Weekly Artist Lists
- ARTIST-001: Artist Data Management
- VIDEO-001: Video Viewing System
- RATING-001: Artist Rating System
- POINTS-001: Points Configuration
- REWARDS-001: Rewards System
- DASHBOARD-001: Points Dashboard
- EVENT-001: Ticketmaster Integration
- PWA-001: PWA Features
- ADMIN-001: Staff Portal

**Time-saving tip:** Open multiple tabs and fill out templates in parallel!

---

## Step 8: Enable Discussions (Optional)

### 8.1 Enable Discussions

1. **Go to repository Settings**
2. **Scroll to "Features"**
3. **✅ Check "Discussions"**
4. **Click "Set up discussions"**

### 8.2 Create Discussion Categories

1. **Go to "Discussions" tab**
2. **Click "Categories" (right sidebar)**
3. **Create categories:**

```
📋 Requirements Review - Discuss PRD requirements and specs
💡 Feature Proposals - Suggest new features or improvements
🗺️ Roadmap Planning - Discuss priorities and timeline
🎯 Success Metrics - Review and discuss KPIs
💬 General - General discussion about the product
🐛 Bugs & Issues - Bug reports and troubleshooting
📢 Announcements - Product updates and news
```

### 8.3 Pin Important Discussions

1. **Create a welcome discussion:**
   - Title: "Welcome to OTW Chart PRD! 🎵"
   - Category: Announcements
   - Content: Intro to the project, how to contribute, team contacts

2. **Pin it:** Click "Pin discussion" in the discussion menu

---

## Troubleshooting

### Issue Templates Not Showing

**Problem:** Templates don't appear when creating new issue

**Solutions:**
1. **Check file location:**
   - Must be in `.github/ISSUE_TEMPLATE/`
   - Files must end with `.md`
   - Use uppercase for folder name: `ISSUE_TEMPLATE`

2. **Check YAML frontmatter:**
   ```yaml
   ---
   name: Feature Requirement
   about: Create a detailed feature requirement
   title: '[REQ-XXX] Feature Name'
   labels: ['requirement', 'needs-triage']
   assignees: ''
   ---
   ```

3. **Clear cache:**
   - Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
   - Try in incognito/private window

### GitHub Actions Workflow Fails

**Problem:** Roadmap generation workflow fails with errors

**Solutions:**

1. **Check permissions:**
   - Settings → Actions → General
   - Workflow permissions: "Read and write"
   - Allow creating PRs: Enabled

2. **Check workflow syntax:**
   - Go to Actions tab
   - Click on failed workflow
   - View error logs
   - Fix YAML syntax errors

3. **Manual trigger:**
   - Actions tab → "Generate Project Roadmap"
   - Click "Run workflow"
   - Select branch: main
   - Run workflow

### Labels Not Auto-Applying

**Problem:** Labels from templates aren't being applied to new issues

**Solutions:**
1. **Check template YAML:**
   ```yaml
   labels: ['requirement', 'needs-triage']  # Correct
   labels: [requirement, needs-triage]      # Also correct
   labels: requirement, needs-triage        # Wrong!
   ```

2. **Create labels first:**
   - Go to Issues → Labels
   - Create any missing labels
   - Exact name match required

### Project Board Not Auto-Adding Issues

**Problem:** New issues aren't automatically added to project board

**Solutions:**
1. **Enable workflow automation:**
   - Project Settings → Workflows
   - Turn on "Auto-add to project"

2. **Set up filter:**
   - When: Item created
   - If: Label contains "requirement"
   - Then: Add to project

3. **Manual linking:**
   - Open issue → Right sidebar → Projects
   - Select your project board

---

## 🎉 Next Steps

Once setup is complete:

1. **✅ Review README.md** - Make sure links work and content is accurate
2. **✅ Create initial issues** - Populate with requirements from PRD
3. **✅ Set up project board** - Organize issues into phases
4. **✅ Test workflow** - Trigger roadmap generation manually
5. **✅ Invite team members** - Add collaborators to repository
6. **✅ Share with stakeholders** - Send them the repository link
7. **✅ Start using!** - Begin tracking requirements and progress

---

## 📚 Additional Resources

- **GitHub Docs:**
  - [Issue Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository)
  - [GitHub Actions](https://docs.github.com/en/actions)
  - [GitHub Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
  - [GitHub Discussions](https://docs.github.com/en/discussions)

- **PRD Best Practices:**
  - [Product Requirements Document Template](https://www.productplan.com/glossary/product-requirements-document/)
  - [How to Write a PRD](https://www.atlassian.com/agile/product-management/requirements)

---

## 💬 Need Help?

If you encounter issues not covered in this guide:

1. **Check GitHub Docs** (links above)
2. **Ask in Discussions** (if enabled)
3. **Contact support:** support@otwchart.com
4. **GitHub Community:** https://github.community/

---

**Setup Checklist:**

- [ ] Repository created
- [ ] PRD files uploaded
- [ ] Issue templates working
- [ ] GitHub Actions enabled
- [ ] Project board created
- [ ] Labels configured
- [ ] Initial issues created
- [ ] Discussions enabled (optional)
- [ ] Team members invited
- [ ] Stakeholders notified

**You're all set! 🚀**