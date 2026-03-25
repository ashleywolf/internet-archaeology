// Vercel serverless function — proxies Wayback Machine CDX API
// CDX API has no CORS headers, so browsers can't call it directly.
// This function adds CORS and returns structured results.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  var url = (req.query.url || '').trim();
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  url = url.replace(/^https?:\/\//, '');

  try {
    var cdxUrl = 'https://web.archive.org/cdx/search/cdx'
      + '?url=' + encodeURIComponent(url)
      + '&output=json'
      + '&fl=timestamp,original,statuscode,mimetype'
      + '&filter=statuscode:200'
      + '&collapse=timestamp:6'
      + '&limit=500';

    var controller = new AbortController();
    var timer = setTimeout(function() { controller.abort(); }, 8000);

    var resp = await fetch(cdxUrl, {
      headers: {
        'User-Agent': 'InternetArchaeologyDig/1.0 (+https://github.com/ashleywolf/internet-archaeology)'
      },
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!resp.ok) {
      return res.json({ captures: 0, snapshots: [] });
    }

    var text = await resp.text();
    if (!text || !text.trim() || text.trim() === '[]') {
      return res.json({ captures: 0, snapshots: [] });
    }

    var data;
    try { data = JSON.parse(text); } catch(e) { return res.json({ captures: 0, snapshots: [] }); }

    if (!Array.isArray(data) || data.length <= 1) {
      return res.json({ captures: 0, snapshots: [] });
    }

    // First row is column headers, rest is data
    var rows = data.slice(1);
    var htmlRows = rows.filter(function(r) {
      var m = (r[3] || '').toLowerCase();
      return m === '' || m.indexOf('html') >= 0 || m.indexOf('text/') >= 0;
    });

    if (htmlRows.length === 0) {
      return res.json({ captures: 0, snapshots: [] });
    }

    var snapshots = htmlRows.map(function(r) {
      return {
        ts: r[0],
        url: r[1],
        wayback: 'https://web.archive.org/web/' + r[0] + '/' + r[1]
      };
    });

    // Pick representative samples spread across the capture range
    var samples = [snapshots[0]];
    if (snapshots.length > 4) {
      samples.push(snapshots[Math.floor(snapshots.length * 0.25)]);
      samples.push(snapshots[Math.floor(snapshots.length * 0.5)]);
      samples.push(snapshots[Math.floor(snapshots.length * 0.75)]);
    } else if (snapshots.length > 2) {
      samples.push(snapshots[Math.floor(snapshots.length / 2)]);
    }
    if (snapshots.length > 1) {
      samples.push(snapshots[snapshots.length - 1]);
    }

    return res.json({
      captures: snapshots.length,
      first: snapshots[0].ts,
      last: snapshots[snapshots.length - 1].ts,
      samples: samples
    });

  } catch(e) {
    return res.json({ captures: 0, snapshots: [] });
  }
};
