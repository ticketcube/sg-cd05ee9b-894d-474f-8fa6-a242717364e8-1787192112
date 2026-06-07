# Domain Migration Guide: OTWL Project

## Overview
This guide will help you migrate your OTWL project from `onestowatch.live` to a new domain while redirecting the old domain to an external website.

## Current Setup
- **Project**: OTWL (Ones To Watch Live)
- **Current Domain**: onestowatch.live
- **Redirect Target**: https://ticketcube.org/otw
- **Supabase Project ID**: buhfuaxrtaozpqlxgerj
- **Deployment**: Vercel

---

## Migration Steps

### Step 1: Choose Your New Domain

**Option A: Use Vercel Auto-Generated Domain (Free)**
- After removing onestowatch.live, Vercel will auto-assign a domain like:
  - `otwl-abc123.vercel.app`
- No cost, works immediately
- You can always add a custom domain later

**Option B: Register a New Custom Domain**
- Suggested names: `otwlapp.com`, `otwlive.com`, `discovermusic.live`, etc.
- Register through: Vercel Domains, Namecheap, GoDaddy, Cloudflare, etc.
- Cost: ~$10-15/year

**Option C: Use a Subdomain**
- If you own another domain: `app.yourdomain.com`, `music.yourdomain.com`
- Free if you already own the parent domain

---

### Step 2: Update Supabase Configuration (CRITICAL!)

⚠️ **Do this BEFORE changing domains in Vercel to avoid authentication breaking**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `buhfuaxrtaozpqlxgerj`
3. Navigate to: **Authentication** → **URL Configuration**
4. Update the following:

   **Site URL:**
   ```
   OLD: https://onestowatch.live
   NEW: https://your-new-domain.com
   ```

   **Redirect URLs:**
   Add these patterns (keep existing OAuth URLs):
   ```
   https://your-new-domain.com/**
   https://your-new-domain.com/auth/callback
   http://localhost:3000/** (for local development)
   ```

5. Click **Save**

---

### Step 3: Update Environment Variables

1. Open your `.env.local` file
2. Update this line:
   ```env
   NEXT_PUBLIC_SITE_URL=https://your-actual-new-domain.com
   ```

3. Also update in **Vercel Dashboard**:
   - Go to your project → **Settings** → **Environment Variables**
   - Find `NEXT_PUBLIC_SITE_URL`
   - Update value to your new domain
   - Click **Save**

---

### Step 4: Update Vercel Domain Settings

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your OTWL project
3. Navigate to **Settings** → **Domains**

4. **Remove old domain:**
   - Find `onestowatch.live`
   - Click the three dots → **Remove**
   - Confirm removal

5. **Add new domain (if custom):**
   - Click **Add Domain**
   - Enter your new domain (e.g., `otwlapp.com`)
   - Follow DNS configuration instructions
   - Vercel will provide nameservers or CNAME records to add to your domain registrar

6. **Or just use Vercel domain:**
   - After removing onestowatch.live, note the auto-generated domain
   - Use this in all configurations above

---

### Step 5: Redeploy Your Project

1. In Vercel Dashboard:
   - Go to **Deployments** tab
   - Click **Redeploy** on the latest deployment
   - OR push a new commit to trigger auto-deployment

2. Wait for deployment to complete

3. Test your new domain works

---

### Step 6: Redirect onestowatch.live to ticketcube.org/otw

You have two options:

#### Option A: DNS-Level Redirect (Recommended)

1. Log into your domain registrar (where you purchased onestowatch.live)
2. Look for:
   - "URL Forwarding"
   - "Domain Forwarding"
   - "Redirect"
   - "HTTP Redirect"

3. Configure:
   ```
   From: onestowatch.live
   To: https://ticketcube.org/otw
   Type: 301 Permanent Redirect
   Forward Path: No (preserve the exact URL)
   ```

4. Save changes

**Pros:**
- Simple, no additional projects needed
- Works at DNS level
- Free with most registrars

**Cons:**
- Configuration varies by registrar
- May take 24-48 hours to fully propagate

**Common Registrars:**
- **Namecheap**: Domain List → Manage → Redirect Domain
- **GoDaddy**: Domain Settings → Forwarding → Add Forwarding
- **Cloudflare**: DNS → Page Rules → Forwarding URL
- **Google Domains**: DNS → Synthetic records → Subdomain forward

#### Option B: Vercel Redirect Project

If your registrar doesn't support URL forwarding, I can create a minimal Vercel project:

**I'll create:**
1. A new Next.js project with automatic redirect
2. You point onestowatch.live to this project in Vercel
3. All traffic gets 301 redirected to https://ticketcube.org/otw

**Let me know if you need Option B and I'll create the redirect project now.**

---

### Step 7: Test Everything

After migration, test these critical flows:

**Authentication:**
- [ ] Sign up with new email
- [ ] Login with existing account
- [ ] Password reset
- [ ] Google OAuth (if enabled)
- [ ] Apple OAuth (if enabled)

**Core Features:**
- [ ] Artist lookup works
- [ ] User profile loads
- [ ] Points system functions
- [ ] Weekly lists display
- [ ] Admin dashboard (if applicable)

**Old Domain:**
- [ ] Visit onestowatch.live → should redirect to external site
- [ ] Check that no OTWL content appears

---

## Troubleshooting

### Authentication Errors After Migration

**Error**: "Invalid login credentials" or "Email not confirmed"
- **Cause**: Supabase Site URL not updated
- **Fix**: Verify Step 2 was completed correctly

**Error**: "Redirect URL not allowed"
- **Cause**: New domain not in Supabase redirect URLs
- **Fix**: Add `https://your-new-domain.com/**` to Supabase Auth config

### Old Domain Still Shows OTWL

**Issue**: onestowatch.live still shows your app
- **Cause**: Vercel domain not removed or DNS not propagated
- **Fix**: 
  1. Verify domain removed in Vercel
  2. Wait 24-48 hours for DNS propagation
  3. Clear browser cache

### New Domain Shows 404

**Issue**: New custom domain returns 404
- **Cause**: DNS not configured correctly
- **Fix**: 
  1. Check DNS records in your domain registrar
  2. Verify CNAME or A records point to Vercel
  3. Wait for DNS propagation (up to 48 hours)

---

## Rollback Plan

If you need to revert:

1. **In Vercel:**
   - Add `onestowatch.live` back to domains
   - Remove new domain

2. **In Supabase:**
   - Change Site URL back to `https://onestowatch.live`
   - Update redirect URLs

3. **In `.env.local` and Vercel:**
   - Change `NEXT_PUBLIC_SITE_URL` back to `https://onestowatch.live`

4. Redeploy

---

## Post-Migration Checklist

- [ ] All authentication flows tested
- [ ] Core features working on new domain
- [ ] Analytics/tracking codes updated (if applicable)
- [ ] Email templates updated (if they contain domain links)
- [ ] Social media links updated
- [ ] Documentation updated
- [ ] Team members notified of new domain
- [ ] Old domain successfully redirecting

---

## Timeline

- **Preparation**: 15 minutes (Steps 1-3)
- **Vercel Migration**: 10 minutes (Step 4)
- **Deployment**: 5-10 minutes (Step 5)
- **DNS Propagation**: 24-48 hours (Step 6)
- **Testing**: 30 minutes (Step 7)

**Total estimated time**: 1-2 hours active work + 1-2 days for DNS propagation

---

## Need Help?

If you encounter issues:
1. Check the Troubleshooting section above
2. Verify all environment variables are correct
3. Clear browser cache and try incognito mode
4. Contact Supabase support for auth-related issues
5. Contact Vercel support for deployment issues

---

## Next Steps

**Tell me:**
1. What new domain will you use for OTWL?
   - Custom domain you'll register?
   - Use Vercel auto-domain?
   - Use a subdomain?

2. What external website should onestowatch.live redirect to?

Once you decide, I can help with any additional configuration needed!