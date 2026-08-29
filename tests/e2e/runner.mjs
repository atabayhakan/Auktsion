#!/usr/bin/env node
/**
 * Auktsion v2.0 - Automated E2E & Integration Test Runner
 * Executes Tier 1 (Feature Coverage), Tier 2 (Boundary & Corner),
 * Tier 3 (Cross-Feature Pairwise), and Tier 4 (Real-World Workloads).
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { globalRunner } from './harness/testFramework.mjs';
import { getTestEnvironment, stopTestEnvironment } from './harness/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI Colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';
const MAGENTA = '\x1b[35m';

async function findTestFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findTestFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.test.mjs') || entry.name.endsWith('.test.js'))) {
      files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  const args = process.argv.slice(2);
  const tierArg = args.find(a => a.startsWith('--tier='))?.split('=')[1];
  const isJson = args.includes('--json');

  console.log(`\n${BOLD}${CYAN}======================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   AUKTSION v2.0 - AUTOMATED E2E TEST SUITE RUNNER   ${RESET}`);
  console.log(`${BOLD}${CYAN}======================================================${RESET}\n`);

  const tiersToRun = [];
  if (!tierArg || tierArg === 'all' || tierArg === '1') {
    tiersToRun.push({ name: 'Tier 1: Feature Coverage', dir: path.join(__dirname, 'tier1_feature') });
  }
  if (!tierArg || tierArg === 'all' || tierArg === '2') {
    tiersToRun.push({ name: 'Tier 2: Boundary & Corner Cases', dir: path.join(__dirname, 'tier2_boundary') });
  }
  if (!tierArg || tierArg === 'all' || tierArg === '3') {
    tiersToRun.push({ name: 'Tier 3: Cross-Feature Pairwise', dir: path.join(__dirname, 'tier3_pairwise') });
  }
  if (!tierArg || tierArg === 'all' || tierArg === '4') {
    tiersToRun.push({ name: 'Tier 4: Real-World Workload Scenarios', dir: path.join(__dirname, 'tier4_workloads') });
  }
  if (!tierArg || tierArg === 'all' || tierArg === '5' || tierArg === 'adversarial') {
    tiersToRun.push({ name: 'Tier 5: Adversarial & Stress Testing', dir: path.join(__dirname, '..', 'adversarial') });
  }

  // Initialize test server
  console.log(`${GRAY}[1/3] Initializing test execution environment...${RESET}`);
  const env = await getTestEnvironment();
  console.log(`${GREEN}✔ Test environment ready: ${env.isLive ? 'LIVE SERVER (' + env.client.baseUrl + ')' : 'IN-PROCESS CONTRACT SERVER (' + env.client.baseUrl + ')'}${RESET}\n`);

  // Discover & load test files
  console.log(`${GRAY}[2/3] Discovering and loading test suites across tiers...${RESET}`);
  let totalFiles = 0;
  for (const tier of tiersToRun) {
    if (fs.existsSync(tier.dir)) {
      const files = await findTestFiles(tier.dir);
      totalFiles += files.length;
      console.log(`  ${MAGENTA}• ${tier.name}:${RESET} ${files.length} test files`);
      for (const file of files) {
        const fileUrl = pathToFileURL(file).href;
        await import(fileUrl);
      }
    }
  }
  console.log(`${GREEN}✔ Loaded ${totalFiles} test files into execution queue.${RESET}\n`);

  // Execute test suites
  console.log(`${GRAY}[3/3] Executing automated tests...${RESET}\n`);
  const results = await globalRunner.execute();

  // Print results
  console.log(`${BOLD}${CYAN}------------------------------------------------------${RESET}`);
  console.log(`${BOLD}                  TEST RUN SUMMARY                    ${RESET}`);
  console.log(`${BOLD}${CYAN}------------------------------------------------------${RESET}`);

  for (const [tierName, breakdown] of Object.entries(results.tierBreakdown)) {
    const statusColor = breakdown.failed === 0 ? GREEN : RED;
    console.log(`  ${BOLD}${tierName}:${RESET} ${statusColor}${breakdown.passed}/${breakdown.total} passed${RESET} (${breakdown.failed} failed)`);
  }

  console.log(`\n  ${BOLD}Total Tests Run:${RESET}  ${results.total}`);
  console.log(`  ${BOLD}Total Passed:${RESET}    ${GREEN}${results.passed}${RESET}`);
  console.log(`  ${BOLD}Total Failed:${RESET}    ${results.failed > 0 ? RED : GREEN}${results.failed}${RESET}`);
  console.log(`  ${BOLD}Total Skipped:${RESET}   ${YELLOW}${results.skipped}${RESET}`);
  console.log(`  ${BOLD}Execution Time:${RESET}  ${results.durationMs}ms`);
  console.log(`${BOLD}${CYAN}------------------------------------------------------${RESET}\n`);

  if (results.failures.length > 0) {
    console.log(`${BOLD}${RED}FAILURES DETAIL (${results.failures.length}):${RESET}\n`);
    results.failures.forEach((f, idx) => {
      console.log(`${RED}${idx + 1}) [${f.tier}] ${f.feature} -> ${f.test}${RESET}`);
      console.log(`   ${YELLOW}Error: ${f.error}${RESET}`);
      if (f.stack) {
        console.log(`   ${GRAY}${f.stack.split('\n').slice(1, 4).join('\n   ')}${RESET}`);
      }
      console.log('');
    });
  }

  if (isJson) {
    const jsonPath = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`${GRAY}JSON test results written to ${jsonPath}${RESET}`);
  }

  // Cleanup
  await stopTestEnvironment();

  if (results.failed > 0) {
    console.log(`${BOLD}${RED}❌ TEST SUITE FAILED${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`${BOLD}${GREEN}✔ ALL TEST TIERS PASSED PERFECTLY (100% SUCCESS)${RESET}\n`);
    process.exit(0);
  }
}

main().catch(async (err) => {
  console.error(`${RED}Fatal runner error:${RESET}`, err);
  await stopTestEnvironment();
  process.exit(1);
});
