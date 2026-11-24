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
        for (const variant of [{}, { reveal: 'auto', rsvpPhone: '+91 98765 43210', recOn: false, kids: '' }]) {
          const S = Object.assign(samples.sample(trad), { template: tpl, theme, tradition: trad, lang }, variant);
          const label = [tpl, theme, trad, lang, variant.reveal || 'pull'].join('/');
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

// Homepage samples must match what scripts/make-demos.js would write.
for (const [trad, theme] of [['hindu', 'rani'], ['muslim', 'emerald'], ['western', 'wine']]) {
  const S = Object.assign(samples.sample(trad), { tradition: trad, theme });
  const file = path.join(root, 'public', 'demo-' + trad + '.html');
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== engine.build(S, {}, R)) {
    problems.push('public/demo-' + trad + '.html is out of date: run node scripts/make-demos.js');
  }
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
console.log('All good: ' + count + ' invites built and checked, homepage samples up to date.');
