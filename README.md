# Internet Archaeology

Search the Wayback Machine for your old internet accounts across 24 platforms. Enter a username and the tool searches MySpace, LiveJournal, Xanga, GeoCities, DeviantArt, Tumblr, early Twitter, and more — returning real capture data with dates and direct links to archived snapshots.

## How it works

The app queries the [Wayback Machine CDX API](https://github.com/internetarchive/wayback/tree/master/wayback-cdx-server) through a serverless proxy for each platform. The CDX API has no CORS headers, so a small backend function is needed. The frontend shows results as they come in — capture counts, date ranges, and links to actual snapshots.

## Deploy

Pick whichever platform you prefer. All three are free and auto-deploy from this repo.

### Netlify (recommended)

1. Go to [app.netlify.com](https://app.netlify.com) and sign in with GitHub
2. Click **Add new site** > **Import an existing project**
3. Select this repo, click **Deploy site**

Config is in `netlify.toml` — no build settings to change.

### Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project**, import this repo
3. Click **Deploy**

Config is in `vercel.json` — no build settings to change.

### GitHub Pages (limited)

Works as a static site on GitHub Pages but falls back to the less reliable Availability API (no server = no CDX API access). Results will be incomplete.

## Local development

```bash
npm run dev
# Open http://localhost:3000
```

The local server handles both static files and the `/api/search` proxy.

## Platforms searched

MySpace, LiveJournal, Xanga, Friendster, GeoCities, Angelfire, Tripod, DeviantArt, Photobucket, hi5, Bebo, Neopets, Last.fm, Flickr, Tumblr, Twitter, Digg, Delicious, StumbleUpon, Google+, Vine, AOL Hometown, Orkut, Blogger
