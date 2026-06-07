# Domain Migration Guide: OTWL Project

## Overview
This guide will help you migrate your OTWL project from `onestowatch.live` to a new domain while redirecting the old domain to an external website.

## Current Setup
- **Project**: OTWL (Ones To Watch Live)
- **Current Domain**: onestowatch.live (being migrated)
- **New Domain**: https://otwl-prd.vercel.app
- **Redirect Target**: https://ticketcube.org/otw
- **Supabase Project ID**: buhfuaxrtaozpqlxgerj
- **Deployment**: Vercel

---

## Migration Steps

### Step 1: Choose Your New Domain

✅ **Decision Made: https://otwl-prd.vercel.app**

Your OTWL project is already deployed on this Vercel domain. No additional domain configuration needed unless you want to add a custom domain later.

~~**Option A: Use Vercel Auto-Generated Domain (Free)**~~
~~**Option B: Register a New Custom Domain**~~
~~**Option C: Use a Subdomain**~~

---

### Step 2: Update Supabase Configuration (CRITICAL!)

⚠️ **Do this FIRST to avoid authentication breaking**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `buhfuaxrtaozpqlxgerj`
3. Navigate to: **Authentication** → **URL Configuration**
4. Update the following:

   **Site URL:**
   ```
   OLD: https://onestowatch.live
   NEW: https://otwl-prd.vercel.app
   ```

   **Redirect URLs:**
   Add these patterns (keep existing OAuth URLs):
   ```
   https://otwl-prd.vercel.app/**
   https://otwl-prd.vercel.app/auth/callback
   http://localhost:3000/** (for local development)
   ```

5. Click **Save**

---

### Step 3: Update Environment Variables

✅ **Local environment updated**

1. ~~Open your `.env.local` file~~ (Already updated)
2. ~~Update this line:~~ (Already set to https://otwl-prd.vercel.app)
   ```env
   NEXT_PUBLIC_SITE_URL=https://otwl-prd.vercel.app
   ```

3. **Still need to update in Vercel Dashboard:**
   - Go to your OTWL project → **Settings** → **Environment Variables**
   - Find `NEXT_PUBLIC_SITE_URL`
   - Update value to: `https://otwl-prd.vercel.app`
   - Click **Save**

---

### Step 4: Update Vercel Domain Settings

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your OTWL project
3. Navigate to **Settings** → **Domains**

4. **Check current domains:**
   - Your project should already be using `otwl-prd.vercel.app`
   - If `onestowatch.live` is still listed:
     - Click the three dots → **Remove**
     - Confirm removal

5. **No additional domain changes needed** - you're using the Vercel domain

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

**I've created a complete redirect project for you in the `redirect-project/` folder.**

**Deployment Steps:**

1. **Navigate to the redirect project:**
   ```bash
   cd redirect-project
   npm install
   ```

2. **Test locally (optional):**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000 - you should be redirected to ticketcube.org/otw

3. **Deploy to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import the `redirect-project` folder (NOT the parent OTWL folder)
   - Vercel will auto-detect Next.js and deploy automatically

4. **Add onestowatch.live to the redirect project:**
   - After deployment completes, go to the redirect project's Settings → Domains
   - Click "Add Domain"
   - Enter: `onestowatch.live`
   - Vercel will provide DNS instructions

5. **Configure DNS:**
   - Go to your domain registrar (where you purchased onestowatch.live)
   - Update DNS records according to Vercel's instructions
   - Usually: Add CNAME record pointing to `cname.vercel-dns.com`

6. **Verify:**
   - Wait 10-60 minutes for DNS propagation
   - Visit https://onestowatch.live
   - Should immediately redirect to https://ticketcube.org/otw
   - Check browser network tab: should show "301 Moved Permanently"

**Testing the redirect:**
```bash
curl -I https://onestowatch.live
# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://ticketcube.org/otw
```

**What's included:**
- ✅ Server-side 301 redirect (fastest)
- ✅ Client-side fallback redirect
- ✅ "Redirecting..." message with manual link
- ✅ Minimal build (~30 seconds)
- ✅ Zero maintenance required
- ✅ Free on Vercel Hobby plan

See `redirect-project/README.md` for full documentation.

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
- **Fix**: Add `https://otwl-prd.vercel.app/**` to Supabase Auth config

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

**Configuration Status:**
- ✅ New domain decided: https://otwl-prd.vercel.app
- ✅ Local .env.local updated
- ⏳ Need to update Supabase Auth config
- ⏳ Need to update Vercel environment variables
- ⏳ Need to deploy redirect project for onestowatch.live

**Your Action Items:**
1. Update Supabase Auth configuration (Step 2) - **DO THIS FIRST**
2. Update Vercel environment variables (Step 3)
3. Remove onestowatch.live from Vercel if present (Step 4)
4. Deploy the redirect project (in `redirect-project/` folder)
5. Add onestowatch.live domain to redirect project
6. Test everything works

See the detailed steps above for complete instructions!