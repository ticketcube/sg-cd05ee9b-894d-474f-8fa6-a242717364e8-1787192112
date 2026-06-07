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
Migrating OTWL project from onestowatch.live to https://otwl-prd.vercel.app while redirecting onestowatch.live to https://ticketcube.org/otw. The Supabase database will remain connected to this project.

## Checklist
- [x] Decide on new domain for OTWL project (https://otwl-prd.vercel.app)
- [ ] Update Supabase Auth configuration (Site URL + Redirect URLs)
- [x] Update .env.local with NEXT_PUBLIC_SITE_URL
- [ ] Update Vercel environment variables
- [ ] Remove onestowatch.live from Vercel domains (if present)
- [ ] Deploy redirect project to new Vercel project
- [ ] Add onestowatch.live domain to redirect project
- [ ] Configure DNS for onestowatch.live redirect
- [ ] Test authentication flows on https://otwl-prd.vercel.app
- [ ] Verify onestowatch.live redirects to https://ticketcube.org/otw

## Acceptance
- OTWL project runs successfully on https://otwl-prd.vercel.app
- User authentication works on new domain
- onestowatch.live redirects to https://ticketcube.org/otw