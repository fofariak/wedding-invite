// Builds public/studio.html from the pieces in src/.
// Run:  node scripts/build.js      (Netlify runs this on every deploy too.)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

// Safe to place inside a <script type="application/json"> block.
const embed = (value) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

const template = read('src/invite-template.html');
const themes = JSON.parse(read('src/themes.json'));
const emblems = JSON.parse(read('src/emblems.json'));
let page = read('src/studio.src.html');

for (const [slot, value] of [['__EMBLEMS__', emblems], ['__TEMPLATE__', template], ['__THEMES__', themes]]) {
  if (page.split(slot).length !== 2) throw new Error('Expected exactly one ' + slot + ' in src/studio.src.html');
  page = page.replace(slot, () => embed(value));
}
fs.writeFileSync(path.join(root, 'public/studio.html'), page);
console.log('Built public/studio.html (' + page.length + ' characters)');
