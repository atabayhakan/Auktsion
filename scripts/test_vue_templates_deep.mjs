import fs from 'fs';
import path from 'path';
import { parse as parseSFC, compileTemplate } from '../frontend/node_modules/@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js';

// Load dictionary
const kyModule = (await import('../frontend/src/locales/ky.ts')).default;
const ruModule = (await import('../frontend/src/locales/ru.ts')).default;
const trModule = (await import('../frontend/src/locales/tr.ts')).default;

function traverseLeaves(obj, prefix = '') {
  const leaves = new Set();
  function walk(curr, pathStr) {
    if (typeof curr === 'object' && curr !== null && !Array.isArray(curr)) {
      for (const key of Object.keys(curr)) {
        walk(curr[key], pathStr ? `${pathStr}.${key}` : key);
      }
    } else {
      leaves.add(pathStr);
    }
  }
  walk(obj, prefix);
  return leaves;
}

const validKeys = traverseLeaves(kyModule);

function getAllFiles(dir, exts = ['.vue']) {
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

const vueFiles = getAllFiles('frontend/src');

// Whitelist of allowed non-localized literal strings (brand names, symbols, tech specs, currencies)
const allowedExactStrings = new Set([
  'Auktsion',
  'Auktsion v2.0',
  'Auktsion.kg',
  'MBank',
  'MBank QR',
  'Optima Bank',
  'DemirBank',
  'Optima',
  'Demir',
  'Visa',
  'Mastercard',
  'Elkart',
  'KGS',
  'USD',
  'EUR',
  'RUB',
  'SOM',
  'som',
  'VIP',
  'PRO',
  'AML',
  'KYC',
  'INN',
  '2FA',
  'SSL',
  'TLS',
  'SHA-256',
  '3D Secure 2.0',
  'REST API',
  'Kafka',
  'PostgreSQL',
  'Redis',
  'v2.0',
  'v2.0.4',
  'v2.0-fintech',
  '©',
  '•',
  '/',
  '\\',
  '-',
  '—',
  ':',
  '|',
  '+',
  '=',
  '>',
  '<',
  '#',
  '$',
  '%',
  '€',
  '₽',
  'сом',
  'сом/мин',
  'som/min'
]);

function isAllowedLiteral(text) {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (/^[\d\s\.,:\/\-\+\(\)\*\#\%\$\€\₽\—\•\|\>\<\=\@\_\[\]\{\}\?\!]+$/.test(trimmed)) return true; // pure numbers and punctuation
  if (/^(https?:\/\/|\/|data:)/.test(trimmed)) return true; // URLs or paths
  if (allowedExactStrings.has(trimmed)) return true;
  return false;
}

const templateIssues = [];

for (const filePath of vueFiles) {
  const relPath = path.relative('.', filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const { descriptor } = parseSFC(content, { filename: relPath });

  if (descriptor.template && descriptor.template.ast) {
    function walkAst(node) {
      // Type 2: Text node
      if (node.type === 2) {
        const text = node.content;
        if (!isAllowedLiteral(text)) {
          templateIssues.push({
            file: relPath,
            line: node.loc.start.line,
            type: 'HARDCODED_TEMPLATE_TEXT',
            content: text.trim(),
            raw: node.loc.source
          });
        }
      }
      // Type 1: Element node
      if (node.type === 1) {
        // Check props / attributes
        for (const prop of node.props) {
          // Plain attribute (type 6)
          if (prop.type === 6) {
            const name = prop.name;
            const val = prop.value ? prop.value.content : '';
            if (['label', 'title', 'heading', 'description', 'subtitle', 'placeholder'].includes(name)) {
              if (!isAllowedLiteral(val)) {
                templateIssues.push({
                  file: relPath,
                  line: prop.loc.start.line,
                  type: `HARDCODED_STATIC_PROP (${name})`,
                  content: val,
                  raw: prop.loc.source
                });
              }
            }
          }
        }
      }

      if (node.children) {
        for (const child of node.children) {
          walkAst(child);
        }
      }
    }

    walkAst(descriptor.template.ast);
  }
}

console.log(`=== VUE SFC TEMPLATE AST AUDIT ===`);
console.log(`Total potential hardcoded template issues: ${templateIssues.length}`);
if (templateIssues.length > 0) {
  console.log(JSON.stringify(templateIssues, null, 2));
} else {
  console.log('✅ 0 Hardcoded text nodes or unlocalized label/placeholder/heading props in all Vue templates!');
}
