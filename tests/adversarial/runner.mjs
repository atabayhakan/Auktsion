#!/usr/bin/env node
/**
 * Auktsion v2.0 - Tier 5 Adversarial & Stress Test Suite Runner
 * Executes adversarial stress tests across:
 * - Bidding Concurrency & Race Conditions
 * - Anti-Sniping Soft-Close Timers
 * - JWT Tampering & Cryptographic Security
 * - Auth Security, SQL Injection & RBAC Privilege Escalation
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { globalRunner } from '../e2e/harness/testFramework.mjs';
import { getTestEnvironment, stopTestEnvironment } from '../e2e/harness/index.mjs';

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

async function main() {
  console.log(`\n${BOLD}${MAGENTA}======================================================${RESET}`);
  console.log(`${BOLD}${MAGENTA}   AUKTSION v2.0 - TIER 5 ADVERSARIAL STRESS RUNNER   ${RESET}`);
  console.log(`${BOLD}${MAGENTA}======================================================${RESET}\n`);

  // Initialize test environment
  console.log(`${GRAY}[1/3] Initializing test execution environment...${RESET}`);
  const env = await getTestEnvironment();
  console.log(`${GREEN}✔ Test environment ready: ${env.isLive ? 'LIVE SERVER (' + env.client.baseUrl + ')' : 'IN-PROCESS CONTRACT SERVER (' + env.client.baseUrl + ')'}${RESET}\n`);

  // Discover & load adversarial test files
  console.log(`${GRAY}[2/3] Discovering and loading adversarial test suites...${RESET}`);
  const testFiles = fs.readdirSync(__dirname)
    .filter(f => f.endsWith('.test.mjs') || f.endsWith('.test.js'))
    .map(f => path.join(__dirname, f));

  console.log(`  ${MAGENTA}• Found ${testFiles.length} adversarial test suites:${RESET}`);
  for (const file of testFiles) {
    console.log(`    - ${path.basename(file)}`);
    const fileUrl = pathToFileURL(file).href;
    await import(fileUrl);
  }
  console.log(`${GREEN}✔ Loaded ${testFiles.length} adversarial test files.${RESET}\n`);

  // Execute
  console.log(`${GRAY}[3/3] Executing adversarial test scenarios...${RESET}\n`);
  const results = await globalRunner.execute();

  // Summary
  console.log(`${BOLD}${MAGENTA}------------------------------------------------------${RESET}`);
  console.log(`${BOLD}             ADVERSARIAL TEST RUN SUMMARY             ${RESET}`);
  console.log(`${BOLD}${MAGENTA}------------------------------------------------------${RESET}`);

  for (const [tierName, breakdown] of Object.entries(results.tierBreakdown)) {
    const statusColor = breakdown.failed === 0 ? GREEN : RED;
    console.log(`  ${BOLD}${tierName}:${RESET} ${statusColor}${breakdown.passed}/${breakdown.total} passed${RESET} (${breakdown.failed} failed)`);
  }

  console.log(`\n  ${BOLD}Total Tests Run:${RESET}  ${results.total}`);
  console.log(`  ${BOLD}Total Passed:${RESET}    ${GREEN}${results.passed}${RESET}`);
  console.log(`  ${BOLD}Total Failed:${RESET}    ${results.failed > 0 ? RED : GREEN}${results.failed}${RESET}`);
  console.log(`  ${BOLD}Execution Time:${RESET}  ${results.durationMs}ms`);
  console.log(`${BOLD}${MAGENTA}------------------------------------------------------${RESET}\n`);

  if (results.failures.length > 0) {
    console.log(`${BOLD}${RED}ADVERSARIAL FAILURES (${results.failures.length}):${RESET}\n`);
    results.failures.forEach((f, idx) => {
      console.log(`${RED}${idx + 1}) [${f.tier}] ${f.feature} -> ${f.test}${RESET}`);
      console.log(`   ${YELLOW}Error: ${f.error}${RESET}`);
      if (f.stack) {
        console.log(`   ${GRAY}${f.stack.split('\n').slice(1, 4).join('\n   ')}${RESET}`);
      }
      console.log('');
    });
  }

  // Cleanup
  await stopTestEnvironment();

  if (results.failed > 0) {
    console.log(`${BOLD}${RED}❌ ADVERSARIAL STRESS SUITE FAILED${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`${BOLD}${GREEN}✔ ALL ADVERSARIAL STRESS TESTS PASSED (100% SUCCESS)${RESET}\n`);
    process.exit(0);
  }
}

main().catch(async (err) => {
  console.error(`${RED}Fatal runner error:${RESET}`, err);
  await stopTestEnvironment();
  process.exit(1);
});
