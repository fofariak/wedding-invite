// Loads everything the invite engine needs from src/: every template folder plus the shared emblems.
// A template folder (src/templates/<id>/) holds template.html, themes.json and meta.json.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

function loadResources() {
  const templates = {};
  const dir = path.join(root, 'src/templates');
  for (const id of fs.readdirSync(dir).sort()) {
    if (!fs.statSync(path.join(dir, id)).isDirectory()) continue;
    const base = 'src/templates/' + id + '/';
    const meta = JSON.parse(read(base + 'meta.json'));
    const themes = JSON.parse(read(base + 'themes.json'));
    if (!themes.wine) throw new Error(base + 'themes.json needs a "wine" theme (used as the fallback)');
    templates[id] = { name: meta.name, html: read(base + 'template.html'), themes };
  }
  if (!templates.classic) throw new Error('src/templates/classic is required (the default template)');
  return { templates, emblems: JSON.parse(read('src/emblems.json')), phrases: loadPhrases() };
}

// One phrase file per language (src/i18n/<code>.json). English is the reference: every other
// language must have exactly the same keys, so nothing is missing or misspelt on an invite.
function loadPhrases() {
  const dir = path.join(root, 'src/i18n');
  const phrases = {};
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const code = file.slice(0, -5);
    const p = JSON.parse(read('src/i18n/' + file));
    if (p.lang !== code) throw new Error('src/i18n/' + file + ': "lang" must be "' + code + '"');
    if (p.dir !== 'ltr' && p.dir !== 'rtl') throw new Error('src/i18n/' + file + ': "dir" must be "ltr" or "rtl"');
    phrases[code] = p;
  }
  if (!phrases.en) throw new Error('src/i18n/en.json is required');
  const shape = (o) => Object.keys(o).sort().map((k) => (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) ? k + '{' + shape(o[k]) + '}' : k)).join(',');
  for (const code of Object.keys(phrases)) {
    for (const part of ['text', 'format']) {
      if (shape(phrases[code][part]) !== shape(phrases.en[part])) {
        throw new Error('src/i18n/' + code + '.json: the "' + part + '" keys differ from en.json');
      }
    }
  }
  return phrases;
}

module.exports = { root, read, loadResources };
