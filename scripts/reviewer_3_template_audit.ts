// scripts/reviewer_3_template_audit.ts
import fs from 'fs';
import path from 'path';

function walk(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.vue')) {
      results.push(fullPath);
    }
  }
  return results;
}

const vueFiles = walk('frontend/src');
console.log(`Scanning ${vueFiles.length} Vue files for potential unlocalized hardcoded Cyrillic text in templates...`);

const cyrillicRegex = /[а-яА-ЯёЁөүңӨҮҢ]/;
let suspectFindings: { file: string; line: number; text: string }[] = [];

for (const file of vueFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  let inTemplate = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('<template>')) inTemplate = true;
    if (line.includes('</template>')) inTemplate = false;

    if (inTemplate && cyrillicRegex.test(line)) {
      // Ignore comments and lines where t(...) or bindings are used
      if (!line.includes('t(') && !line.startsWith('<!--') && !line.startsWith('//') && !line.startsWith('*')) {
        suspectFindings.push({
          file: path.relative('frontend', file),
          line: i + 1,
          text: line,
        });
      }
    }
  }
}

console.log(`Suspect template Cyrillic lines: ${suspectFindings.length}`);
for (const s of suspectFindings) {
  console.log(` - ${s.file}:${s.line} -> ${s.text}`);
}
