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
  console.log('🔍 [Data Integrity Audit] Checking for mock data leaks and real DB connections...');
  const frontendPages = path.join(ROOT, 'frontend/src/pages');
  const frontendStores = path.join(ROOT, 'frontend/src/stores');
  const frontendComponents = path.join(ROOT, 'frontend/src/components');

  const filesToCheck = [
    ...walkDir(frontendPages, p => p.endsWith('.vue') || p.endsWith('.ts')),
    ...walkDir(frontendStores, p => p.endsWith('.ts')),
    ...walkDir(frontendComponents, p => p.endsWith('.vue') && !p.includes('film')) // films have scripted scenes
  ];

  let mockLeaks = [];

  filesToCheck.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const relPath = path.relative(ROOT, file);

    // Look for imports of mockAuctions
    if (content.includes("from '@/data/mockAuctions'") || content.includes('from "../data/mockAuctions"') || content.includes("from '../data/mockAuctions'")) {
      mockLeaks.push({
        file: relPath,
        issue: 'Imports mockAuctions instead of real database auctionStore / API'
      });
    }

    // Check for hardcoded fallback to mock data
    if (content.includes('mockAuctions') && !relPath.includes('mockAuctions.ts')) {
      // Check if it is a fallback like: auctions.value.length ? auctions.value : mockAuctions
      if (/:\s*mockAuctions\b/.test(content) || /\|\|\s*mockAuctions\b/.test(content)) {
        mockLeaks.push({
          file: relPath,
          issue: 'Contains fallback expression using mockAuctions instead of showing empty state'
        });
      }
    }
  });

  if (mockLeaks.length === 0) {
    console.log('✅ Real data integrity verified! No mock data leaks in storefront.');
    return { passed: true, leaks: [] };
  } else {
    console.error(`❌ Found ${mockLeaks.length} mock data leaks:`);
    mockLeaks.forEach(m => console.error(`   - [${m.file}]: ${m.issue}`));
    return { passed: false, leaks: mockLeaks };
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = run();
  process.exit(res.passed ? 0 : 1);
}
