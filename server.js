// Local dev server: serves static files + proxies /api/search to CDX API
var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var url = require('url');

var PORT = 3000;

var server = http.createServer(function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  var parsed = url.parse(req.url, true);

  if (parsed.pathname === '/api/search') {
    var searchUrl = (parsed.query.url || '').replace(/^https?:\/\//, '');
    if (!searchUrl) { res.writeHead(400); res.end('{"error":"Missing url"}'); return; }

    var cdxUrl = 'https://web.archive.org/cdx/search/cdx'
      + '?url=' + encodeURIComponent(searchUrl)
      + '&output=json&fl=timestamp,original,statuscode,mimetype'
      + '&filter=statuscode:200&collapse=timestamp:6&limit=500';

    https.get(cdxUrl, {
      headers: { 'User-Agent': 'InternetArchaeologyDig/1.0' }
    }, function(cdxRes) {
      var body = '';
      cdxRes.on('data', function(c) { body += c; });
      cdxRes.on('end', function() {
        res.setHeader('Content-Type', 'application/json');
        try {
          var data = JSON.parse(body);
          if (!Array.isArray(data) || data.length <= 1) {
            res.end('{"captures":0,"snapshots":[]}');
            return;
          }
          var rows = data.slice(1);
          var html = rows.filter(function(r) {
            var m = (r[3] || '').toLowerCase();
            return m === '' || m.indexOf('html') >= 0 || m.indexOf('text/') >= 0;
          });
          if (html.length === 0) { res.end('{"captures":0,"snapshots":[]}'); return; }

          var snaps = html.map(function(r) {
            return { ts: r[0], url: r[1], wayback: 'https://web.archive.org/web/' + r[0] + '/' + r[1] };
          });
          var samples = [snaps[0]];
          if (snaps.length > 4) {
            samples.push(snaps[Math.floor(snaps.length * 0.25)]);
            samples.push(snaps[Math.floor(snaps.length * 0.5)]);
            samples.push(snaps[Math.floor(snaps.length * 0.75)]);
          } else if (snaps.length > 2) {
            samples.push(snaps[Math.floor(snaps.length / 2)]);
          }
          if (snaps.length > 1) samples.push(snaps[snaps.length - 1]);

          res.end(JSON.stringify({
            captures: snaps.length,
            first: snaps[0].ts,
            last: snaps[snaps.length - 1].ts,
            samples: samples
          }));
        } catch(e) {
          res.end('{"captures":0,"snapshots":[]}');
        }
      });
    }).on('error', function() {
      res.end('{"captures":0,"snapshots":[]}');
    });
    return;
  }

  // Static files
  var filePath = parsed.pathname === '/' ? '/index.html' : parsed.pathname;
  var fullPath = path.join(__dirname, filePath);
  var ext = path.extname(fullPath);
  var types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

  fs.readFile(fullPath, function(err, data) {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.setHeader('Content-Type', types[ext] || 'text/plain');
    res.end(data);
  });
});

server.listen(PORT, function() {
  console.log('Dev server running at http://localhost:' + PORT);
});
