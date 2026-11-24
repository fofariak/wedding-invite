// Captures the cover of each homepage sample as an image for the homepage design cards:
//   public/img/preview-<tradition>.webp
// Run after make-demos.js whenever the samples change:  node scripts/make-previews.js
// Needs Google Chrome installed locally (set CHROME=/path/to/chrome if it is elsewhere). Netlify does not run this.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { root } = require('./lib/resources');

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const { loadResources } = require('./lib/resources');
// [sample page, image] pairs: classic's three tradition samples plus each template's own sample.
const DEMOS = ['hindu', 'muslim', 'western'].map((t) => ['demo-' + t + '.html', 'img/preview-' + t + '.webp']);
for (const t of Object.values(loadResources().templates)) if (t.demo && t.demo.tradition) DEMOS.push([t.demo.file, t.demo.image]);
const pub = path.join(root, 'public');
const outDir = path.join(pub, 'img');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

if (!fs.existsSync(CHROME)) { console.error('Chrome not found at ' + CHROME + ' (set CHROME=...)'); process.exit(1); }
if (typeof WebSocket === 'undefined') { console.error('Needs Node.js 22 or newer'); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });

// Tiny local web server for public/ so fonts load exactly as on the live site.
const server = http.createServer((req, res) => {
  const file = path.join(pub, path.normalize(decodeURIComponent(req.url.split('?')[0])));
  if (!file.startsWith(pub)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const site = 'http://127.0.0.1:' + server.address().port;
  const port = 9300 + Math.floor(Math.random() * 600);
  const profile = fs.mkdtempSync(path.join(require('os').tmpdir(), 'previews-'));
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + profile, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  try {
    let tabs;
    for (let i = 0; i < 50 && !tabs; i++) { try { tabs = await (await fetch('http://127.0.0.1:' + port + '/json')).json(); } catch (e) { await sleep(200); } }
    const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));
    let id = 0; const pending = {};
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending[d.id]) { pending[d.id](d); delete pending[d.id]; } };
    const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
    for (const [page, image] of DEMOS) {
      await send('Page.navigate', { url: site + '/' + page });
      await sleep(3500); // let the cover, flowers and fonts settle
      const shot = await send('Page.captureScreenshot', { format: 'webp', quality: 80 });
      const file = path.join(pub, image);
      fs.writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
      console.log('Wrote public/' + image + ' (' + Math.round(fs.statSync(file).size / 1024) + ' KB)');
    }
    ws.close();
  } finally {
    const exited = new Promise((r) => chrome.once('exit', r));
    chrome.kill();
    await Promise.race([exited, sleep(5000)]);
    server.close();
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch (e) { /* temporary folder; the system clears it */ }
  }
})().catch((e) => { console.error(e); process.exit(1); });
