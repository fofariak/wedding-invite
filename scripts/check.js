// Quick self-check after any change in src/. Run:  node scripts/check.js
// Builds every template x theme x tradition x language (with and without optional parts) and checks:
//   - no %%PLACEHOLDER%% is left unfilled
//   - every <script> in the invite is valid JavaScript
//   - the page declares its language and direction
//   - the homepage samples (public/demo-*.html) are up to date
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { root, loadResources } = require('./lib/resources');
const engine = require('../src/engine/engine');
const samples = require('../src/engine/samples');

const R = loadResources(); // also checks that every phrase file has the same keys as en.json
R.fontsBase = '';
let count = 0;
const problems = [];

for (const tpl of Object.keys(R.templates)) {
  for (const theme of Object.keys(R.templates[tpl].themes)) {
    for (const trad of Object.keys(engine.TRAD)) {
      for (const lang of Object.keys(R.phrases)) {
        for (const variant of [{}, { rsvpPhone: '+91 98765 43210', recOn: false, kids: '' }]) {
          const S = Object.assign(samples.sample(trad), { template: tpl, theme, tradition: trad, lang }, variant);
          const label = [tpl, theme, trad, lang, variant.rsvpPhone ? 'reply' : 'plain'].join('/');
          for (const opts of [{}, { preview: true, skip: true, mark: true }]) {
            const html = engine.build(S, opts, R);
            count++;
            const left = html.match(/%%[A-Z0-9_]+%%/g);
            if (left) problems.push(label + ': unfilled ' + [...new Set(left)].join(', '));
            for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
              try { new vm.Script(m[1]); } catch (e) { problems.push(label + ': script error: ' + e.message); }
            }
            const dir = R.phrases[lang].dir;
            if (!html.includes('<html lang="' + lang + '" dir="' + dir + '">')) problems.push(label + ': missing lang/dir on <html>');
          }
        }
      }
    }
  }
}

// Every opening in the library, in every design, size and colour, with all display options.
{
  const M = R.openings.meta;
  const customs = ['॥ श्री गणेशाय नमः ॥', 'ੴ ਸਤਿ ਨਾਮੁ', 'بِسْمِ اللَّهِ', 'خوشی کے اس پُرمسرت موقع پر', '॥ શ્રી ગણેશાય નમઃ ॥', 'Two hearts,\none journey', '<b>bold</b> & "quotes"'];
  const cases = R.openings.items.map((it) => it.id).concat(customs.map(() => 'custom'));
  cases.forEach((id, i) => {
    const S = samples.defaults();
    S.opening = {
      id, custom: id === 'custom' ? customs[i - R.openings.items.length] : '',
      design: M.designs[i % M.designs.length].id, size: M.sizes[i % M.sizes.length].id, color: M.colors[i % M.colors.length].id,
      gujarati: i % 2 === 0, translit: true, meaning: true, ref: true, version: M.bibleVersions[i % M.bibleVersions.length].id,
    };
    for (const opts of [{}, { preview: true, skip: true, mark: true }]) {
      const html = engine.build(S, opts, R);
      count++;
      const label = 'opening ' + id + (id === 'custom' ? ' "' + S.opening.custom + '"' : '');
      const left = html.match(/%%[A-Z0-9_]+%%/g);
      if (left) problems.push(label + ': unfilled ' + [...new Set(left)].join(', '));
      if (!/class="opening-line|id="opening"/.test(html)) problems.push(label + ': opening missing from the invitation');
      if (/<script>alert|<b>bold/.test(html)) problems.push(label + ': text not escaped');
      for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
        try { new vm.Script(m[1]); } catch (e) { problems.push(label + ': script error: ' + e.message); }
      }
      const rtl = /class="op-text op-s-(arab|urdu)"[^>]*dir="rtl"/.test(html);
      if (/op-s-(arab|urdu)"/.test(html.match(/<p class="op-text[^>]*>/)[0]) && !rtl) problems.push(label + ': Arabic/Urdu not right-to-left');
    }
  });
}

// Homepage samples must match what scripts/make-demos.js would write.
for (const [trad, theme] of [['hindu', 'rani'], ['muslim', 'emerald'], ['western', 'wine']]) {
  const S = Object.assign(samples.sample(trad), { tradition: trad, theme });
  const file = path.join(root, 'public', 'demo-' + trad + '.html');
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== engine.build(S, {}, R)) {
    problems.push('public/demo-' + trad + '.html is out of date: run node scripts/make-demos.js');
  }
}

for (const [id, t] of Object.entries(R.templates)) {
  if (!t.demo || !t.demo.tradition) continue;
  const S = Object.assign(samples.sample(t.demo.tradition), { tradition: t.demo.tradition, template: id, theme: t.demo.theme });
  const file = path.join(root, 'public', t.demo.file);
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== engine.build(S, {}, R)) problems.push('public/' + t.demo.file + ' is out of date: run node scripts/make-demos.js');
}

// The server functions' copy of the designs and phrases must match src/.
{
  const site = JSON.parse(fs.readFileSync(path.join(root, 'src/site.json'), 'utf8'));
  const want = 'export default ' + JSON.stringify(Object.assign(loadResources(), { brand: site.brand })) + ';';
  const file = path.join(root, 'netlify/lib/generated/resources.mjs');
  if (!fs.existsSync(file) || !fs.readFileSync(file, 'utf8').includes(want)) problems.push('netlify/lib/generated/resources.mjs is out of date: run node scripts/build.js');
}

if (problems.length) {
  console.error(problems.length + ' problem(s):\n  ' + problems.slice(0, 40).join('\n  '));
  process.exit(1);
}
console.log('All good: ' + count + ' invites built and checked (including every opening), homepage samples up to date.');
