import fs from 'fs';
import path from 'path';

function getAllFiles(dir, exts = ['.ts']) {
  let files = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

const tsFiles = getAllFiles('frontend/src');

console.log('=== SCANNING ALL TS FILES FOR HARDCODED USER-FACING STRINGS ===');

for (const file of tsFiles) {
  const rel = path.relative('.', file).replace(/\\/g, '/');
  if (rel.startsWith('frontend/src/locales/')) continue;

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check for toast methods or alerts
    if (line.includes('toastSuccess') || line.includes('toastError') || line.includes('toastWarning') || line.includes('toastInfo')) {
      console.log(`[TOAST] ${rel}:${idx + 1} -> ${line.trim()}`);
    }
    // Check for Cyrillic
    if (/[\u0400-\u04FF]/.test(line)) {
      console.log(`[CYRILLIC] ${rel}:${idx + 1} -> ${line.trim()}`);
    }
  });
}
