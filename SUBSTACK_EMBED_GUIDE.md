# Substack Newsletter Embed Code

## How to Embed the Weekly Voting Widget into Your Substack Newsletter

### Option 1: Basic iFrame Embed (Recommended)

Add this HTML code to your Substack post (use the HTML editor):

```html
<iframe 
  src="https://your-domain.vercel.app/embed/weekly" 
  width="100%" 
  height="600" 
  frameborder="0" 
  scrolling="no"
  style="border: none; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);">
</iframe>
```

**Important:** Replace `your-domain.vercel.app` with your actual deployed domain.

---

### Option 2: Responsive Embed with Better Mobile Support

```html
<div style="position: relative; width: 100%; max-width: 1200px; margin: 0 auto;">
  <iframe 
    src="https://your-domain.vercel.app/embed/weekly" 
    width="100%" 
    height="600" 
    frameborder="0" 
    scrolling="no"
    style="border: none; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); display: block;">
  </iframe>
</div>
```

---

### Option 3: Full-Width Responsive Embed

```html
<div style="position: relative; width: 100%; padding-bottom: 56.25%; /* 16:9 aspect ratio */">
  <iframe 
    src="https://your-domain.vercel.app/embed/weekly" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);"
    frameborder="0" 
    scrolling="no">
  </iframe>
</div>
```

---

## Substack Setup Instructions

### Step 1: Create Your Post
1. Go to your Substack dashboard
2. Click "New post"
3. Write your newsletter content

### Step 2: Add the Embed Code
1. Click the **"<>"** (HTML) button in the editor toolbar
2. Paste one of the embed codes above
3. Replace `your-domain.vercel.app` with your actual domain
4. Click "Update" or "Apply"

### Step 3: Preview and Publish
1. Click "Preview" to see how it looks
2. Test the voting functionality
3. When satisfied, click "Publish"

---

## Recommended Embed Settings

**For Best Results:**
- **Width:** 100% (responsive)
- **Height:** 600px (fits video + rating sliders)
- **Border Radius:** 16px (matches your design)
- **Shadow:** Adds depth and polish

**Adjust Height If Needed:**
- If content is cut off: Increase height to `650px` or `700px`
- If too much white space: Decrease height to `550px`

---

## Example Newsletter Introduction

Here's suggested copy to introduce the embed in your newsletter:

```
🎵 **Vote on This Week's Artists!**

We've handpicked 4 incredible artists for you to discover this week. 
Watch their videos, rate them on our unique quadrant system, and help 
shape the OTW Chart rankings!

Your votes directly influence which artists rise to the top. Plus, 
you'll earn points toward exclusive rewards when you create an account.

👇 Start voting below:

[INSERT EMBED CODE HERE]
```

---

## Troubleshooting

### iFrame Not Showing?
- Make sure you're using the HTML editor in Substack
- Some email clients block iframes - consider adding a fallback link

### Content Cut Off?
- Increase the `height` value in the iframe code
- Try `height="650"` or `height="700"`

### Not Mobile Responsive?
- Use Option 2 or 3 above for better mobile support
- Test on your phone before publishing

---

## Fallback Link (Recommended)

Add this below your embed as a backup:

```html
<p style="text-align: center; margin-top: 20px;">
  <a href="https://your-domain.vercel.app/embed/weekly" 
     style="color: #7c3aed; font-weight: bold; text-decoration: none;">
    Can't see the voting widget? Click here to vote! →
  </a>
</p>
```

---

## Analytics Note

The embed will track:
- ✅ Vote submissions
- ✅ Video watch time
- ✅ Artist ratings
- ✅ Session IDs (for reward eligibility)

Users who complete all ratings will be prompted to create an account 
to claim rewards and points!
