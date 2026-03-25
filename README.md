# Internet Archaeology

Search the Wayback Machine for your old internet accounts across 20+ platforms. Enter a username and the tool searches MySpace, LiveJournal, Xanga, GeoCities, DeviantArt, Tumblr, early Twitter, and more.

## How it works

The app sends your username to a serverless function that queries the [Wayback Machine CDX API](https://github.com/internetarchive/wayback/tree/master/wayback-cdx-server) for each platform. The CDX API returns actual capture data — timestamps, URLs, and snapshot counts — so you see real results, not guesses.

Without the serverless function (e.g., on GitHub Pages), the app falls back to the browser-accessible Availability API, which is slower and less reliable.

## Deploy to Vercel

This is the recommended setup. Vercel runs the CDX API proxy as a serverless function.

1. Push this repo to GitHub (already done if you're reading this there)
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **Add New Project**, import `internet-archaeology`
4. Click **Deploy** — no configuration needed

Vercel auto-deploys on every push to `main`.

## Local development

```bash
npm run dev
# Open http://localhost:3000
```

The local server proxies `/api/search` to the CDX API, same as Vercel does in production.

## Platforms searched

MySpace, LiveJournal, Xanga, Friendster, GeoCities, Angelfire, Tripod, DeviantArt, Photobucket, hi5, Bebo, Neopets, Last.fm, Flickr, Tumblr, Twitter, Digg, Delicious, StumbleUpon, Google+, Vine, AOL Hometown, Orkut, Blogger
