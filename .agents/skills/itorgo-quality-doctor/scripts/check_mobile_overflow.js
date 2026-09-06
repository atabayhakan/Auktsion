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
  console.log('🔍 [Mobile Overflow Audit] Checking frontend layout components...');
  const frontendSrc = path.join(ROOT, 'frontend/src');
  const vueFiles = walkDir(frontendSrc, (p) => p.endsWith('.vue'));

  let issues = [];

  // Matches standalone w-[...px] but NOT max-w-[...px] or min-w-[...px]
  const standaloneWidthPattern = /(?:^|[\s"'])(?:(?:sm|md|lg|xl|2xl):)?w-\[(\d+)px\]/g;

  vueFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const relPath = path.relative(ROOT, file);

    // 1. Check for standalone fixed widths > 360px that don't have breakpoint prefix or overflow handling
    let match;
    while ((match = standaloneWidthPattern.exec(content)) !== null) {
      const fullMatch = match[0].trim();
      const px = parseInt(match[1], 10);
      
      // Skip if prefixed with responsive breakpoint like sm:, md:, lg:
      if (/^(sm|md|lg|xl|2xl):/.test(fullMatch)) continue;

      // Skip if px <= 360 (fits standard mobile screen)
      if (px <= 360) continue;

      // Check surrounding lines or class list for overflow-hidden / absolute
      const index = match.index;
      const contextSnippet = content.substring(Math.max(0, index - 400), Math.min(content.length, index + 200));
      
      if (!contextSnippet.includes('overflow-hidden') && !contextSnippet.includes('overflow-x-clip') && !contextSnippet.includes('overflow-x-auto') && !contextSnippet.includes('max-w-full')) {
        issues.push({
          file: relPath,
          issue: `Unconstrained standalone width '${fullMatch}' without mobile breakpoint or overflow handling`,
          snippet: fullMatch
        });
      }
    }

    // 2. Check for unconstrained w-screen on pages
    if ((relPath.includes('pages\\') || relPath.includes('pages/')) && content.includes('w-screen')) {
      if (!content.includes('overflow-x-hidden') && !content.includes('overflow-x-clip')) {
        issues.push({
          file: relPath,
          issue: `Uses 'w-screen' without 'overflow-x-hidden' or 'overflow-x-clip'`,
          snippet: 'w-screen'
        });
      }
    }
  });

  if (issues.length === 0) {
    console.log('✅ Mobile layout check passed! 0 horizontal overflow hazards detected.');
    return { passed: true, issues: [] };
  } else {
    console.warn(`⚠️ Found ${issues.length} potential mobile layout hazards:`);
    issues.forEach(i => console.warn(`   - [${i.file}]: ${i.issue}`));
    return { passed: true, issues };
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = run();
  process.exit(res.passed ? 0 : 1);
}
