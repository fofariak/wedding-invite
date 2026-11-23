// Regenerates the homepage sample invites (public/demo-*.html) from the samples in src/engine/samples.js.
// Run:  node scripts/make-demos.js
// The output is exactly what "Download invite" in the editor produces for that sample, without a song.
const fs = require('fs');
const path = require('path');
const { root, loadResources } = require('./lib/resources');
const engine = require('../src/engine/engine');
const samples = require('../src/engine/samples');

// Which colour theme each homepage sample uses.
const DEMOS = [
  { tradition: 'hindu', theme: 'rani' },
  { tradition: 'muslim', theme: 'emerald' },
  { tradition: 'western', theme: 'wine' },
];

const R = loadResources();
R.fontsBase = ''; // samples are served from this site, so fonts load from a relative path
for (const d of DEMOS) {
  const S = samples.sample(d.tradition);
  S.tradition = d.tradition;
  S.theme = d.theme;
  const file = path.join(root, 'public', 'demo-' + d.tradition + '.html');
  fs.writeFileSync(file, engine.build(S, {}, R));
  console.log('Wrote public/demo-' + d.tradition + '.html');
}
