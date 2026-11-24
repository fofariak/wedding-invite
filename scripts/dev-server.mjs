// Local test server: the whole site, server functions and storage on this computer, with a pretend
// Razorpay window (no real keys, no real money). Never used by Netlify.
// Run:  npm run dev      then open http://localhost:8888
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BlobsServer } from '@netlify/blobs/server';
import { getStore } from '@netlify/blobs';
import { installFakeRazorpay, setTestKeys } from '../tests/fake-razorpay.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const pub = join(root, 'public');
const PORT = Number(process.env.PORT || 8888);

// Local storage that behaves like Netlify Blobs (kept in .netlify/dev-blobs, which git ignores).
const blobDir = join(root, '.netlify', 'dev-blobs');
await mkdir(blobDir, { recursive: true });
const blobs = new BlobsServer({ directory: blobDir, token: 'dev', port: 0 });
const { port: blobPort } = await blobs.start();
globalThis.__inviteStore = getStore({ name: 'invites', edgeURL: 'http://localhost:' + blobPort, uncachedEdgeURL: 'http://localhost:' + blobPort, token: 'dev', siteID: 'dev', consistency: 'strong' });

setTestKeys();
process.env.PRICE_AMOUNT ||= '49900';
process.env.PRICE_CURRENCY ||= 'inr';
process.env.URL = 'http://localhost:' + PORT;
process.env.RAZORPAY_CHECKOUT_URL = '/dev/fake-checkout.js';
const rzp = installFakeRazorpay();

// Functions, routed by their own `config.path` (plus /.netlify/functions/<name>).
const names = ['config', 'invites', 'invite-page', 'pay', 'razorpay-webhook'];
const routes = [];
for (const name of names) {
  const mod = await import('../netlify/functions/' + name + '.mjs');
  const paths = [].concat((mod.config && mod.config.path) || []);
  paths.push('/.netlify/functions/' + name);
  for (const p of paths) routes.push({ pattern: new URLPattern({ pathname: p }), fn: mod.default });
}

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain' };

// The pretend checkout window: a small overlay with "Pay (test)" and "Cancel".
const FAKE_CHECKOUT = `window.Razorpay=function(o){var h={};this.on=function(n,f){h[n]=f;};this.open=function(){
var d=document.createElement('div');d.id='fake-rzp';d.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);display:grid;place-items:center;z-index:99999;font:15px system-ui';
d.innerHTML='<div style="background:#fff;padding:24px 28px;border-radius:12px;max-width:340px;text-align:center"><b>TEST checkout</b><p>'+o.name+'<br>'+(o.amount/100)+' '+o.currency+'</p><button id="fake-pay" style="padding:10px 18px">Pay (test)</button> <button id="fake-cancel" style="padding:10px 18px">Cancel</button></div>';
document.body.appendChild(d);
d.querySelector('#fake-cancel').onclick=function(){d.remove();o.modal&&o.modal.ondismiss&&o.modal.ondismiss();};
d.querySelector('#fake-pay').onclick=function(){fetch('/dev/pay?order='+encodeURIComponent(o.order_id)).then(function(r){return r.json();}).then(function(r){d.remove();o.handler(r);});};};};`;

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost:' + PORT);
    if (url.pathname === '/dev/fake-checkout.js') { res.writeHead(200, { 'Content-Type': 'text/javascript' }); return res.end(FAKE_CHECKOUT); }
    if (url.pathname === '/dev/pay') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(rzp.pay(url.searchParams.get('order')))); }
    for (const r of routes) {
      const m = r.pattern.exec({ pathname: url.pathname });
      if (!m) continue;
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = chunks.length && !['GET', 'HEAD'].includes(req.method) ? Buffer.concat(chunks) : undefined;
      const response = await r.fn(new Request(url, { method: req.method, headers: req.headers, body }), { params: m.pathname.groups });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      return res.end(Buffer.from(await response.arrayBuffer()));
    }
    let file = normalize(join(pub, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname)));
    if (!file.startsWith(pub)) { res.writeHead(403); return res.end(); }
    const data = await readFile(file).catch(() => null);
    if (!data) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch (e) {
    console.error(e);
    res.writeHead(500); res.end('Server error');
  }
});
server.listen(PORT, '127.0.0.1', () => console.log('Local test site: http://localhost:' + PORT + '  (pretend payments, local storage)'));
