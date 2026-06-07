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
Migrating OTWL project from onestowatch.live to a new domain while redirecting onestowatch.live to https://ticketcube.org/otw. The Supabase database will remain connected to this project.

## Checklist
- [ ] Decide on new domain for OTWL project (Vercel auto-domain or custom)
- [ ] Update Supabase Auth configuration (Site URL + Redirect URLs)
- [ ] Update .env.local with NEXT_PUBLIC_SITE_URL
- [ ] Update Vercel environment variables
- [ ] Remove onestowatch.live from Vercel domains
- [ ] Add new domain to Vercel (if custom)
- [ ] Redeploy project
- [ ] Set up redirect: onestowatch.live → https://ticketcube.org/otw
- [ ] Test authentication flows on new domain
- [ ] Verify old domain redirects correctly

## Acceptance
- OTWL project runs successfully on new domain
- User authentication works on new domain
- onestowatch.live redirects to https://ticketcube.org/otw