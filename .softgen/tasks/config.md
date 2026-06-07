---
title: Domain Migration Configuration
status: todo
priority: urgent
type: chore
tags: [domain, migration, deployment]
created_by: agent
created_at: 2026-06-07T07:38:25Z
position: 1
---

## Notes
Migrating OTWL project from onestowatch.live to a new domain while redirecting the old domain to an external website. The Supabase database will remain connected to this project.

## Checklist
- [ ] Decide on new domain for OTWL project
- [ ] Update Supabase Auth configuration
- [ ] Update Vercel domain settings
- [ ] Update environment variables
- [ ] Test authentication flows
- [ ] Set up redirect for onestowatch.live

## Acceptance
- OTWL project runs on new domain
- Supabase auth works on new domain
- onestowatch.live redirects to external website