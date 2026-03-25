// Netlify serverless function — proxies Wayback Machine CDX API
const https = require('https');

function fetchCDX(url) {
  return new Promise(function(resolve, reject) {
    var cdxUrl = 'https://web.archive.org/cdx/search/cdx'
      + '?url=' + encodeURIComponent(url)
      + '&output=json&fl=timestamp,original,statuscode,mimetype'
      + '&filter=statuscode:200&collapse=timestamp:6&limit=500';

    var req = https.get(cdxUrl, {
      headers: { 'User-Agent': 'InternetArchaeologyDig/1.0 (+https://github.com/ashleywolf/internet-archaeology)' }
    }, function(res) {
      var body = '';
      res.on('data', function(c) { body += c; });
      res.on('end', function() { resolve(body); });
    });
    req.on('error', reject);
    req.setTimeout(8000, function() { req.destroy(); reject(new Error('timeout')); });
  });
}

exports.handler = async function(event) {
  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: headers, body: '' };
  }

  var url = (event.queryStringParameters || {}).url || '';
  url = url.trim().replace(/^https?:\/\//, '');
  if (!url) {
    return { statusCode: 400, headers: headers, body: '{"error":"Missing url parameter"}' };
  }

  try {
    var text = await fetchCDX(url);
    if (!text || !text.trim() || text.trim() === '[]') {
      return { statusCode: 200, headers: headers, body: '{"captures":0,"snapshots":[]}' };
    }

    var data = JSON.parse(text);
    if (!Array.isArray(data) || data.length <= 1) {
      return { statusCode: 200, headers: headers, body: '{"captures":0,"snapshots":[]}' };
    }

    var rows = data.slice(1);
    var htmlRows = rows.filter(function(r) {
      var m = (r[3] || '').toLowerCase();
      return m === '' || m.indexOf('html') >= 0 || m.indexOf('text/') >= 0;
    });

    if (htmlRows.length === 0) {
      return { statusCode: 200, headers: headers, body: '{"captures":0,"snapshots":[]}' };
    }

    var snapshots = htmlRows.map(function(r) {
      return { ts: r[0], url: r[1], wayback: 'https://web.archive.org/web/' + r[0] + '/' + r[1] };
    });

    var samples = [snapshots[0]];
    if (snapshots.length > 4) {
      samples.push(snapshots[Math.floor(snapshots.length * 0.25)]);
      samples.push(snapshots[Math.floor(snapshots.length * 0.5)]);
      samples.push(snapshots[Math.floor(snapshots.length * 0.75)]);
    } else if (snapshots.length > 2) {
      samples.push(snapshots[Math.floor(snapshots.length / 2)]);
    }
    if (snapshots.length > 1) samples.push(snapshots[snapshots.length - 1]);

    var result = {
      captures: snapshots.length,
      first: snapshots[0].ts,
      last: snapshots[snapshots.length - 1].ts,
      samples: samples
    };

    return { statusCode: 200, headers: headers, body: JSON.stringify(result) };
  } catch(e) {
    return { statusCode: 200, headers: headers, body: '{"captures":0,"snapshots":[]}' };
  }
};
