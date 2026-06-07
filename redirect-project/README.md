# OnestoWatch.live → TicketCube.org/otw Redirect Project

This is a minimal Next.js project that redirects all traffic from onestowatch.live to https://ticketcube.org/otw using 301 permanent redirects.

## Features

- 301 Permanent Redirect (SEO-friendly)
- Server-side redirect via Next.js config
- Client-side fallback redirect
- Minimal build size
- All paths redirect to the same destination

## Deployment Instructions

### Option 1: Deploy to Vercel (Recommended)

1. **Create a new Vercel project:**
   - Visit [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Click "Import Git Repository" or "Import from folder"
   - Navigate to and select this `redirect-project` folder (NOT the parent OTWL folder)
   - Vercel will auto-detect Next.js
   - Click "Deploy"

2. **Add onestowatch.live domain:**
   - After deployment, go to Project Settings → Domains
   - Click "Add Domain"
   - Enter: `onestowatch.live`
   - Follow Vercel's DNS instructions to point your domain

3. **Verify redirect:**
   - Visit https://onestowatch.live
   - Should immediately redirect to https://ticketcube.org/otw
   - Check browser network tab - should show "301 Moved Permanently"

### Option 2: Deploy via Vercel CLI

```bash
cd redirect-project
npm install
npm install -g vercel
vercel login
vercel --prod
```

Then add the domain in Vercel dashboard as described above.

## Local Testing

```bash
npm install
npm run dev
```

Visit http://localhost:3000 - you should be redirected to https://ticketcube.org/otw

## How It Works

1. **Server-side redirect** (Primary):
   - `next.config.mjs` contains redirect rules
   - All requests get 301 redirected before page loads
   - Fastest, most efficient method

2. **Client-side redirect** (Fallback):
   - `pages/index.tsx` has useEffect redirect
   - Handles edge cases where server redirect doesn't work
   - Shows "Redirecting..." message briefly

## Troubleshooting

**Redirect not working:**
- Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
- Check DNS propagation (can take up to 48 hours)
- Verify domain is added in Vercel

**301 vs 302:**
- This uses 301 (permanent) for SEO benefits
- Search engines will update their indexes
- Browser caching may affect testing

**Testing redirect:**
Use curl to verify:
```bash
curl -I https://onestowatch.live
```

Should show:
```
HTTP/1.1 301 Moved Permanently
Location: https://ticketcube.org/otw
```

## Maintenance

This project requires minimal maintenance:
- No database
- No environment variables
- No API keys
- No dependencies to update (unless you want Next.js updates)

## Costs

- **Vercel Hobby Plan**: Free
- **Bandwidth**: Negligible (instant redirects)
- **Build time**: ~30 seconds