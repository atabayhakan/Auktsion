import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let currentDir = __dirname;
let ROOT = currentDir;
while (currentDir !== path.dirname(currentDir)) {
  if (fs.existsSync(path.join(currentDir, 'frontend/src'))) {
    ROOT = currentDir;
    break;
  }
  currentDir = path.dirname(currentDir);
}

function walkDir(dir, filter) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(fullPath, filter));
    } else if (filter(fullPath)) {
      results.push(fullPath);
    }
  });
  return results;
}

export function run() {
  console.log('🔍 [Modal Contract Audit] Verifying modal components and close/v-model event bindings...');
  const frontendComponents = path.join(ROOT, 'frontend/src/components');
  const modalFiles = walkDir(frontendComponents, p => p.toLowerCase().includes('modal') && p.endsWith('.vue'));

  let issues = [];

  modalFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const relPath = path.relative(ROOT, file);

    const hasCloseEmit = content.includes("emit('close')") || content.includes('emit("close")');
    const hasModelUpdateEmit = content.includes("emit('update:modelValue'") || content.includes('emit("update:modelValue"');
    const hasModelValueProp = content.includes('modelValue') || content.includes('isOpen') || content.includes('show');

    // If modal uses v-model (modelValue prop), ensure it emits update:modelValue on close
    if (hasModelValueProp && !hasModelUpdateEmit && hasCloseEmit) {
      issues.push({
        file: relPath,
        issue: 'Modal accepts modelValue/isOpen but only emits "close" without "update:modelValue", which can cause X button to fail when parent uses v-model'
      });
    }

    // Check if close button has click handler
    if (content.includes('aria-label="Close"') || content.includes('aria-label="Закрыть"')) {
      if (!content.includes('@click')) {
        issues.push({
          file: relPath,
          issue: 'Modal close button missing @click handler'
        });
      }
    }
  });

  if (issues.length === 0) {
    console.log(`✅ All ${modalFiles.length} modal components have valid close & v-model event contracts!`);
    return { passed: true, issues: [] };
  } else {
    console.error(`❌ Found ${issues.length} modal contract issues:`);
    issues.forEach(i => console.error(`   - [${i.file}]: ${i.issue}`));
    return { passed: false, issues };
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = run();
  process.exit(res.passed ? 0 : 1);
}
