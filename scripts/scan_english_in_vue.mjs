// scripts/scan_english_in_vue.mjs
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

const files = walk('frontend/src');
console.log(`Auditing ${files.length} Vue components for English hardcoded text in templates...\n`);

const KNOWN_ALLOWED = [
  'Auktsion', 'KG', 'MBank', 'Optima Bank', 'DemirBank', 'Bakai Bank', 'KICB', 'ELQR', 'O!Nom', 'Stripe',
  'Visa', 'Mastercard', 'URL', 'ID', 'KYC', 'AML', '2FA', 'SMS', 'QR', 'IBAN', 'FAQ', 'API', 'UI', 'UX',
  'PDF', 'JPEG', 'PNG', 'VIP', 'BMW', 'Toyota', 'Apple', 'Sony', 'PlayStation', 'Rolex', 'KGS', 'USD', 'RUB',
  'SOM', 'SOM/KG', 'KGS/USD', '©', '—', '•', '|', ':', '...', '>', '<', '&', '/', '\\', '$', '₽', ' сом',
  'Preview', '1180 0000 0000 0000', 'Azamat Bakirov', 'DELETE', 'https://images.unsplash.com/...', 'No Title'
];

const suspiciousEnglish = [];

for (const file of files) {
  const relPath = path.relative('frontend', file);
  const content = fs.readFileSync(file, 'utf8');

  // Extract <template>...</template> content
  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
  if (!templateMatch) continue;
  const templateContent = templateMatch[1];

  // Look for text between > and <
  const textMatches = templateContent.matchAll(/>([^<>{}\n\r]+)</g);
  for (const m of textMatches) {
    const rawText = m[1].trim();
    if (!rawText || rawText.length < 2) continue;

    // Filter out code expressions, numbers, punctuation
    if (/^[\d\s.,\-+/*%():$₽€#@!?;'"`|&<>=_—•\\[\]{}]+$/.test(rawText)) continue;
    if (KNOWN_ALLOWED.includes(rawText)) continue;

    // Check if it looks like English words (2+ words or standard English phrases)
    if (/^[A-Za-z0-9\s.,!?:'’\-—/()]+$/.test(rawText) && /[A-Za-z]{3,}/.test(rawText)) {
      suspiciousEnglish.push({
        file: relPath,
        text: rawText,
      });
    }
  }
}

console.log(`Found ${suspiciousEnglish.length} English text candidates in Vue templates:`);
suspiciousEnglish.forEach(s => {
  console.log(`- ${s.file}: "${s.text}"`);
});
