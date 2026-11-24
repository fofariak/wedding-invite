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
    if (id.startsWith('_') || !fs.statSync(path.join(dir, id)).isDirectory()) continue; // _shared holds common pieces
    const base = 'src/templates/' + id + '/';
    const meta = JSON.parse(read(base + 'meta.json'));
    const themes = JSON.parse(read(base + 'themes.json'));
    if (!Object.keys(themes).length) throw new Error(base + 'themes.json needs at least one theme');
    templates[id] = { order: meta.order || 99, name: meta.name, description: meta.description || '', features: meta.features || {}, demo: meta.demo || null, partials: meta.partials || null, html: read(base + 'template.html'), themes };
  }
  if (!templates.classic) throw new Error('src/templates/classic is required (the default template)');
  // Templates appear in the editor and on the homepage in their meta.json "order".
  const ordered = {};
  Object.keys(templates).sort((x, y) => templates[x].order - templates[y].order || (x < y ? -1 : 1)).forEach((k) => { ordered[k] = templates[k]; });
  const shared = { css: read('src/templates/_shared/base.css'), runtime: read('src/templates/_shared/runtime.js'), icons: read('src/templates/_shared/icons.svg') };
  if (/<\/script/i.test(shared.runtime)) throw new Error('_shared/runtime.js must not contain "</script"');
  return { templates: ordered, shared, emblems: JSON.parse(read('src/emblems.json')), phrases: loadPhrases(), openings: loadOpenings() };
}

// Opening library: src/openings/meta.json (traditions, designs) + one file of texts per tradition.
// Checks every entry so a typo in the library can't reach an invitation.
const OPENING_TYPES = ['phrase', 'mantra', 'shloka', 'prayer', 'scripture'];
function loadOpenings() {
  const meta = JSON.parse(read('src/openings/meta.json'));
  delete meta._about;
  const items = [];
  const ids = new Set();
  for (const t of meta.traditions) {
    const file = 'src/openings/' + t.id + '.json';
    const subs = new Set(t.subs.map((s) => s.id));
    for (const it of JSON.parse(read(file)).items) {
      const where = file + ' ' + (it.id || '(no id)');
      if (!/^[a-z0-9-]{3,60}$/.test(it.id || '') || ids.has(it.id)) throw new Error(where + ': missing or duplicate id');
      if (!subs.has(it.sub)) throw new Error(where + ': unknown sub "' + it.sub + '"');
      if (!meta.scripts[it.script]) throw new Error(where + ': unknown script "' + it.script + '"');
      if (!OPENING_TYPES.includes(it.type)) throw new Error(where + ': unknown type "' + it.type + '"');
      if (it.versions) {
        for (const v of meta.bibleVersions) if (!it.versions[v.id]) throw new Error(where + ': missing Bible version ' + v.id);
      } else if (!it.text) throw new Error(where + ': missing text');
      ids.add(it.id);
      items.push(Object.assign({ tradition: t.id }, it));
    }
  }
  return { meta, items };
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
