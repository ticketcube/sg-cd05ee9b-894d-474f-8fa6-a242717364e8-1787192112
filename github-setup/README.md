# OTW Chart - Product Requirements Document

> **🎵 Discover emerging artists. Earn rewards. Shape the future of music.**

[![Status](https://img.shields.io/badge/Status-Active%20Development-green)]()
[![Version](https://img.shields.io/badge/Version-1.0-blue)]()
[![Last Updated](https://img.shields.io/badge/Last%20Updated-October%202025-orange)]()

---

## 📋 Table of Contents

- [About This Repository](#about-this-repository)
- [Quick Links](#quick-links)
- [Product Overview](#product-overview)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [How to Use This Repository](#how-to-use-this-repository)
- [Contributing](#contributing)
- [Contact](#contact)

---

## About This Repository

This repository contains the comprehensive **Product Requirements Document (PRD)** for **OTW Chart**, a music discovery platform that rewards users for engaging with emerging artists before they become mainstream.

**Purpose of this PRD:**
- 📖 Centralized documentation for all product requirements
- 🎯 Clear roadmap for development phases
- 🤝 Collaboration hub for team members and stakeholders
- 📊 Tracking progress on feature implementation

---

## Quick Links

| Document | Description |
|----------|-------------|
| **[Full PRD](./PRODUCT_REQUIREMENTS_DOCUMENT.md)** | Complete product requirements document |
| **[Project Board](../../projects)** | Track feature development progress |
| **[Issues](../../issues)** | Browse and create requirement tickets |
| **[Roadmap](#roadmap)** | Visual timeline of planned features |
| **[Discussions](../../discussions)** | Community feedback and proposals |

---

## Product Overview

**OTW Chart** is a Progressive Web Application (PWA) that gamifies music discovery through a sophisticated points-based rewards system.

### Core Value Proposition

> Users earn points and rewards for discovering new music before it becomes mainstream, creating a win-win for music fans and emerging artists.

### Target Platform
- **Platform:** Progressive Web App (installable)
- **Tech Stack:** Next.js 15.2, TypeScript, React, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Deployment:** Vercel

---

## Key Features

### 🎵 Weekly Artist Discovery
- Admin-curated lists of 5 emerging artists per week
- Video-first content (YouTube/TikTok)
- Artist profiles with social links and tour dates

### ⭐ Multi-Dimensional Rating System
- **Quadrant Ratings:** Vibe (Chill → Hype) × Discovery (Familiar → Fresh)
- Star ratings (1-5)
- Engagement tracking and analytics

### 🏆 Points & Rewards System
- **5 points** per video view (15+ seconds)
- **10 points** per vote submission
- **15 points** completion bonus (all videos watched)
- Monthly rewards: merch, VIP access, exclusive experiences

### 👤 User Profiles
- Customizable usernames and avatars
- Location-based event recommendations
- Engagement history and statistics
- Favorite artists tracking

### 📱 Progressive Web App
- Installable on mobile and desktop
- Offline functionality
- Service worker caching
- Native app experience

### 🎟️ Event Integration
- Ticketmaster API for tour dates
- Location-based event filtering
- Artist show notifications

---

## Project Structure

```
otwchart-prd/
├── README.md (this file)
├── PRODUCT_REQUIREMENTS_DOCUMENT.md
├── docs/
│   ├── technical-architecture.md
│   ├── user-flows.md
│   ├── security-privacy.md
│   └── success-metrics.md
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── feature-requirement.md
│   │   ├── bug-report.md
│   │   └── enhancement.md
│   └── workflows/
│       └── roadmap-generator.yml
└── assets/
    ├── diagrams/
    ├── wireframes/
    └── mockups/
```

---

## Roadmap

### ✅ Phase 1: MVP (Complete)
- [x] User authentication & profiles
- [x] Weekly artist lists
- [x] Video viewing system
- [x] Points configuration
- [x] Basic rewards system
- [x] PWA implementation

### 🚧 Phase 2: Q1 2026 (In Progress)
- [ ] Weekly streak tracking (25 bonus points)
- [ ] Referral program (25 points per referral)
- [ ] Enhanced analytics dashboard
- [ ] Genre preference insights
- [ ] Engagement timeline visualization

### 📅 Phase 3: Q2 2026 (Planned)
- [ ] Social features (follow, share, comment)
- [ ] Artist Q&A sessions
- [ ] Custom playlists
- [ ] Physical merch store
- [ ] Points redemption system

### 🔮 Phase 4: Q3-Q4 2026 (Future)
- [ ] Native mobile apps (iOS/Android)
- [ ] Machine learning recommendations
- [ ] Festival partnerships
- [ ] API for third-party integrations

---

## How to Use This Repository

### For Product Managers
1. **Review the [Full PRD](./PRODUCT_REQUIREMENTS_DOCUMENT.md)** for complete feature specifications
2. **Track progress** on the [Project Board](../../projects)
3. **Create new requirements** using [Issue Templates](../../issues/new/choose)
4. **Facilitate discussions** in the [Discussions tab](../../discussions)

### For Developers
1. **Reference requirements** by Issue ID (e.g., `AUTH-001`, `POINTS-001`)
2. **Link commits** to requirement issues
3. **Update issue status** as features are implemented
4. **Document technical decisions** in issue comments

### For Stakeholders
1. **Review roadmap** to understand timeline
2. **Provide feedback** via Discussions
3. **Track metrics** in Success Metrics section
4. **Propose features** using Enhancement template

---

## Contributing

We welcome contributions from team members and stakeholders!

### How to Contribute

1. **Submit Feature Requests**
   - Use the [Feature Request Template](../../issues/new?template=feature-requirement.md)
   - Include user stories and acceptance criteria
   - Add relevant labels (priority, phase, feature area)

2. **Report Issues**
   - Use the [Bug Report Template](../../issues/new?template=bug-report.md)
   - Provide reproduction steps
   - Include expected vs actual behavior

3. **Propose Enhancements**
   - Use the [Enhancement Template](../../issues/new?template=enhancement.md)
   - Explain the problem and proposed solution
   - Consider technical feasibility

4. **Participate in Discussions**
   - Share insights and feedback
   - Upvote important features
   - Help refine requirements

### Contribution Guidelines

- **Be specific:** Use clear, actionable language
- **Reference existing work:** Link to related issues/PRs
- **Consider users:** Include user impact in proposals
- **Think technically:** Address implementation challenges
- **Stay organized:** Use appropriate labels and milestones

---

## Project Phases & Milestones

| Phase | Timeline | Focus Areas | Status |
|-------|----------|-------------|--------|
| **MVP** | Q4 2025 | Core features, points system, PWA | ✅ Complete |
| **Phase 2** | Q1 2026 | Streaks, referrals, analytics | 🚧 In Progress |
| **Phase 3** | Q2 2026 | Social features, artist interactions | 📅 Planned |
| **Phase 4** | Q3-Q4 2026 | Native apps, ML, partnerships | 🔮 Future |

---

## Success Metrics

### User Engagement
- **DAU/WAU:** Target 60% day-1 retention
- **Video Views:** Target 4+ videos per user per week
- **Vote Rate:** Target 80% vote submission rate
- **Completion Rate:** Target 60% earn completion bonus

### Technical Performance
- **Page Load:** < 2.5s LCP
- **API Response:** < 400ms average
- **Uptime:** 99.9% target
- **Error Rate:** < 0.5%

### Business Goals
- **User Growth:** 20% MoM growth target
- **Retention:** < 10% monthly churn
- **NPS Score:** 40+ target
- **Reward Redemption:** 70% of users reach Bronze tier

📊 [View Detailed Metrics →](./PRODUCT_REQUIREMENTS_DOCUMENT.md#10-success-metrics)

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15.2, React, TypeScript, Tailwind CSS |
| **UI Components** | Shadcn/UI, Lucide React, Framer Motion |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **APIs** | Ticketmaster, Chartmetric, YouTube, TikTok |
| **Deployment** | Vercel (serverless) |
| **Analytics** | PostHog |
| **Payments** | Stripe |

---

## Contact

**Product Team:**
- Product Owner: [Name] - [email]
- Tech Lead: [Name] - [email]
- Design Lead: [Name] - [email]

**Support Channels:**
- 📧 Email: support@otwchart.com
- 💬 Discord: [Link]
- 🐙 GitHub: [This Repository]

**Feedback:**
- Feature requests → [New Issue](../../issues/new/choose)
- General discussion → [Discussions](../../discussions)
- Bug reports → [Bug Template](../../issues/new?template=bug-report.md)

---

## License

This documentation is proprietary and confidential. All rights reserved by OTW Chart.

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Oct 20, 2025 | Initial PRD creation | Product Team |

**Next Review:** January 20, 2026

---

<div align="center">

**[View Full PRD](./PRODUCT_REQUIREMENTS_DOCUMENT.md)** • **[Project Board](../../projects)** • **[Issues](../../issues)** • **[Discussions](../../discussions)**

Made with ❤️ by the OTW Chart Team

</div>