// Builds the site's pages into public/ from src/.
//   src/studio.src.html  -> public/studio.html   (the editor, with the invite engine, samples and resources inlined)
//   src/pages/*.html     -> public/*.html        (homepage and policy pages)
// Everywhere, {{BRAND}} is replaced by the brand name in src/site.json.
// Run:  node scripts/build.js      (Netlify runs this on every deploy too.)
const fs = require('fs');
const path = require('path');
const { root, read, loadResources } = require('./lib/resources');

const site = JSON.parse(read('src/site.json'));
if (!site.brand) throw new Error('src/site.json needs a "brand"');

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const withSite = (html) => html.replace(/\{\{BRAND\}\}/g, () => escHtml(site.brand));

// Safe to place inside a <script type="application/json"> block.
const embed = (value) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

// JavaScript placed inside a <script> block must not contain "</script".
const inlineJs = (file) => {
  const code = read(file);
  if (/<\/script/i.test(code)) throw new Error(file + ' contains "</script"; write it as "<\\/script" instead');
  return code;
};

const write = (name, html) => {
  const left = html.match(/\{\{[A-Z_]+\}\}/);
  if (left) throw new Error(name + ' still contains ' + left[0]);
  fs.writeFileSync(path.join(root, 'public', name), html);
  console.log('Built public/' + name + ' (' + html.length + ' characters)');
};

// Pages
for (const file of fs.readdirSync(path.join(root, 'src/pages')).filter((f) => f.endsWith('.html')).sort()) {
  write(file, withSite(read('src/pages/' + file)));
}

// Editor (the brand is filled in first, so nothing inlined afterwards is touched)
let page = withSite(read('src/studio.src.html'));
const slots = [
  ['__RESOURCES__', () => embed(loadResources())],
  ['__ENGINE__', () => inlineJs('src/engine/engine.js')],
  ['__SAMPLES__', () => inlineJs('src/engine/samples.js')],
];
for (const [slot, value] of slots) {
  if (page.split(slot).length !== 2) throw new Error('Expected exactly one ' + slot + ' in src/studio.src.html');
  const text = value();
  page = page.replace(slot, () => text);
}
write('studio.html', page);
