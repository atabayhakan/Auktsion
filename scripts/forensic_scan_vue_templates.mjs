// scripts/forensic_scan_vue_templates.mjs
import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.vue')) {
      results.push(fullPath);
    }
  });
  return results;
}

const vueFiles = walk('frontend/src');
console.log(`Auditing ${vueFiles.length} Vue components for untranslated text in templates...`);

const cyrillicRegex = />([^<]*[\u0400-\u04FF]{2,}[^<]*)</g;
const hardcodedFindings = [];

for (const file of vueFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // Match template section
  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
  if (!templateMatch) continue;

  const templateContent = templateMatch[1];
  // Remove comments
  const cleanTemplate = templateContent.replace(/<!--[\s\S]*?-->/g, '');

  let m;
  while ((m = cyrillicRegex.exec(cleanTemplate)) !== null) {
    const rawText = m[1].trim();
    // Exclude if it's purely inside {{ ... }} with t(...) or mock data variables
    if (rawText.startsWith('{{') && rawText.endsWith('}}')) continue;
    // Exclude single words or specific currency symbols like 'сом' if inside dynamic bindings
    if (rawText.length > 1 && !rawText.includes('t(')) {
      hardcodedFindings.push({
        file: path.relative('frontend', file),
        text: rawText
      });
    }
  }
}

console.log(`Hardcoded Cyrillic string instances in template bodies: ${hardcodedFindings.length}`);
if (hardcodedFindings.length > 0) {
  hardcodedFindings.slice(0, 10).forEach(f => {
    console.log(`  - ${f.file}: "${f.text}"`);
  });
}
