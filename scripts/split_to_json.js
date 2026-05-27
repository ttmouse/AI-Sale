const fs = require('fs');
const path = require('path');
const srcDir = 'scenes/scene-12-workbench';
const outDir = path.join(srcDir, 'scenarios');

fs.mkdirSync(outDir, {recursive: true});

// Load all stage files
const files = fs.readdirSync(srcDir).filter(f => f.startsWith('scenarios-p') && f.endsWith('.js'));
files.forEach(f => {
  // Eval the file - data is assigned to globalThis.SCENARIOS_PX
  const code = fs.readFileSync(path.join(srcDir, f), 'utf-8');
  eval(code);
});

// Collect all scenarios
const allScenarios = [];
['P1','P2','P3','P4','P5','P6','P7'].forEach(stage => {
  const key = 'SCENARIOS_' + stage;
  const arr = globalThis[key] || [];
  arr.forEach(s => allScenarios.push(s));
});

// Write each scenario as individual JSON file
allScenarios.forEach(s => {
  if (!s.id) {
    console.log('Skipping scenario without id');
    return;
  }
  const filename = s.id + '.json';
  const filepath = path.join(outDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(s, null, 2), 'utf-8');
  console.log('  ' + filename);
});

console.log('\nDone. Total:', allScenarios.length, 'scenarios');
