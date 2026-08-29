import fs from 'fs';
import path from 'path';
import ts from '../frontend/node_modules/typescript/lib/typescript.js';

// 1. AST-based Duplicate Key Detector
function findDuplicateKeysInFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    code,
    ts.ScriptTarget.Latest,
    true
  );

  const duplicates = [];

  function visit(node, keyPath = []) {
    if (ts.isObjectLiteralExpression(node)) {
      const seen = new Map();
      for (const prop of node.properties) {
        if (ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) {
          let name = '';
          if (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) {
            name = prop.name.text;
          }
          if (name) {
            const fullKeyPath = [...keyPath, name].join('.');
            const lineAndChar = sourceFile.getLineAndCharacterOfPosition(prop.getStart(sourceFile));
            const line = lineAndChar.line + 1;
            
            if (seen.has(name)) {
              duplicates.push({
                file: filePath,
                key: fullKeyPath,
                line: line,
                firstLine: seen.get(name)
              });
            } else {
              seen.set(name, line);
            }

            if (ts.isPropertyAssignment(prop) && prop.initializer) {
              visit(prop.initializer, [...keyPath, name]);
            }
          }
        }
      }
    } else {
      ts.forEachChild(node, child => visit(child, keyPath));
    }
  }

  visit(sourceFile);
  return duplicates;
}

// 2. Deep Object Traversal for Leaf Keys & Values
function traverseLeaves(obj, prefix = '') {
  const leaves = new Map();

  function walk(curr, pathStr) {
    if (curr === null || curr === undefined) {
      leaves.set(pathStr, { value: curr, type: typeof curr });
      return;
    }
    if (typeof curr === 'object' && !Array.isArray(curr)) {
      for (const key of Object.keys(curr)) {
        const nextPath = pathStr ? `${pathStr}.${key}` : key;
        walk(curr[key], nextPath);
      }
    } else {
      leaves.set(pathStr, { value: curr, type: typeof curr });
    }
  }

  walk(obj, prefix);
  return leaves;
}

// Extract interpolation params like {count}, {name}, {n}
function extractParams(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{([a-zA-Z0-9_]+)\}/g);
  if (!matches) return [];
  return matches.map(m => m.replace(/[\{\}]/g, '')).sort();
}

async function runAdversarialTest() {
  console.log('=== PART 1: ADVERSARIAL DICTIONARY AUDIT ===\n');

  const kyPath = path.resolve('frontend/src/locales/ky.ts');
  const ruPath = path.resolve('frontend/src/locales/ru.ts');
  const trPath = path.resolve('frontend/src/locales/tr.ts');

  // Check AST Duplicate Keys
  console.log('Checking for duplicate keys in AST...');
  const kyDuplicates = findDuplicateKeysInFile(kyPath);
  const ruDuplicates = findDuplicateKeysInFile(ruPath);
  const trDuplicates = findDuplicateKeysInFile(trPath);

  console.log(`- ky.ts AST duplicate keys: ${kyDuplicates.length}`);
  if (kyDuplicates.length) console.log(kyDuplicates);
  console.log(`- ru.ts AST duplicate keys: ${ruDuplicates.length}`);
  if (ruDuplicates.length) console.log(ruDuplicates);
  console.log(`- tr.ts AST duplicate keys: ${trDuplicates.length}`);
  if (trDuplicates.length) console.log(trDuplicates);

  // Import Live Modules
  const kyModule = (await import('../frontend/src/locales/ky.ts')).default;
  const ruModule = (await import('../frontend/src/locales/ru.ts')).default;
  const trModule = (await import('../frontend/src/locales/tr.ts')).default;

  const kyLeaves = traverseLeaves(kyModule);
  const ruLeaves = traverseLeaves(ruModule);
  const trLeaves = traverseLeaves(trModule);

  console.log(`\nLeaf Keys Count:`);
  console.log(`- ky.ts: ${kyLeaves.size} leaf keys`);
  console.log(`- ru.ts: ${ruLeaves.size} leaf keys`);
  console.log(`- tr.ts: ${trLeaves.size} leaf keys`);

  // Check Empty, Whitespace, Undefined, Null, Type Errors
  const checkValues = (leaves, lang) => {
    const issues = [];
    for (const [key, info] of leaves.entries()) {
      if (info.value === undefined) {
        issues.push({ lang, key, issue: 'UNDEFINED_VALUE' });
      } else if (info.value === null) {
        issues.push({ lang, key, issue: 'NULL_VALUE' });
      } else if (typeof info.value === 'string') {
        if (info.value.length === 0) {
          issues.push({ lang, key, issue: 'EMPTY_STRING' });
        } else if (info.value.trim().length === 0) {
          issues.push({ lang, key, issue: 'WHITESPACE_ONLY' });
        }
      } else if (typeof info.value !== 'number' && typeof info.value !== 'boolean' && !Array.isArray(info.value)) {
        issues.push({ lang, key, issue: `UNEXPECTED_TYPE (${info.type})` });
      }
    }
    return issues;
  };

  const kyIssues = checkValues(kyLeaves, 'KY');
  const ruIssues = checkValues(ruLeaves, 'RU');
  const trIssues = checkValues(trLeaves, 'TR');

  console.log(`\nValue Integrity Issues:`);
  console.log(`- KY issues: ${kyIssues.length}`, kyIssues);
  console.log(`- RU issues: ${ruIssues.length}`, ruIssues);
  console.log(`- TR issues: ${trIssues.length}`, trIssues);

  // Parity Set Differences
  const allKeys = new Set([...kyLeaves.keys(), ...ruLeaves.keys(), ...trLeaves.keys()]);
  const missingInKy = [];
  const missingInRu = [];
  const missingInTr = [];

  for (const k of allKeys) {
    if (!kyLeaves.has(k)) missingInKy.push(k);
    if (!ruLeaves.has(k)) missingInRu.push(k);
    if (!trLeaves.has(k)) missingInTr.push(k);
  }

  console.log(`\nKey Parity Mismatches:`);
  console.log(`- Total Unique Keys across all: ${allKeys.size}`);
  console.log(`- Missing in KY: ${missingInKy.length}`, missingInKy);
  console.log(`- Missing in RU: ${missingInRu.length}`, missingInRu);
  console.log(`- Missing in TR: ${missingInTr.length}`, missingInTr);

  // Interpolation Param Consistency
  console.log(`\nChecking Interpolation Parameter Consistency...`);
  const paramMismatches = [];
  for (const k of allKeys) {
    const kyVal = kyLeaves.get(k)?.value;
    const ruVal = ruLeaves.get(k)?.value;
    const trVal = trLeaves.get(k)?.value;

    const kyParams = extractParams(kyVal);
    const ruParams = extractParams(ruVal);
    const trParams = extractParams(trVal);

    const kyStr = kyParams.join(',');
    const ruStr = ruParams.join(',');
    const trStr = trParams.join(',');

    if (kyStr !== ruStr || kyStr !== trStr || ruStr !== trStr) {
      paramMismatches.push({
        key: k,
        kyParams,
        ruParams,
        trParams,
        kyVal,
        ruVal,
        trVal
      });
    }
  }

  console.log(`- Interpolation Parameter Mismatches: ${paramMismatches.length}`);
  if (paramMismatches.length) {
    console.log(JSON.stringify(paramMismatches, null, 2));
  }

  const passed = (
    kyDuplicates.length === 0 &&
    ruDuplicates.length === 0 &&
    trDuplicates.length === 0 &&
    kyIssues.length === 0 &&
    ruIssues.length === 0 &&
    trIssues.length === 0 &&
    missingInKy.length === 0 &&
    missingInRu.length === 0 &&
    missingInTr.length === 0 &&
    paramMismatches.length === 0
  );

  console.log(`\nPart 1 Result: ${passed ? 'PASSED ✅' : 'FAILED ❌'}`);
  return {
    passed,
    kyLeavesCount: kyLeaves.size,
    ruLeavesCount: ruLeaves.size,
    trLeavesCount: trLeaves.size,
    allKeysCount: allKeys.size,
    kyDuplicates,
    ruDuplicates,
    trDuplicates,
    kyIssues,
    ruIssues,
    trIssues,
    missingInKy,
    missingInRu,
    missingInTr,
    paramMismatches
  };
}

runAdversarialTest().catch(console.error);
