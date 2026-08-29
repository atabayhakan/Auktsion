/**
 * Lightweight, zero-dependency ESM Test Framework for Auktsion v2.0
 * Supports suites, tests, hooks, async assertions, timeouts, and structured reporting.
 */

class TestFramework {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.currentTier = 'Tier 1';
    this.currentFeature = 'General';
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      durationMs: 0,
      tierBreakdown: {},
      failures: []
    };
  }

  setContext(tier, feature) {
    this.currentTier = tier || 'Tier 1';
    this.currentFeature = feature || 'General';
  }

  describe(name, fn) {
    const parentSuite = this.currentSuite;
    const suite = {
      name,
      tier: this.currentTier,
      feature: this.currentFeature,
      parent: parentSuite,
      tests: [],
      beforeAll: [],
      afterAll: [],
      beforeEach: [],
      afterEach: []
    };

    if (parentSuite) {
      parentSuite.tests.push(suite);
    } else {
      this.suites.push(suite);
    }

    this.currentSuite = suite;
    try {
      fn();
    } finally {
      this.currentSuite = parentSuite;
    }
  }

  test(name, fn, options = {}) {
    const testCase = {
      name,
      fn,
      tier: this.currentTier,
      feature: this.currentFeature,
      timeout: options.timeout || 10000,
      skip: options.skip || false,
      suite: this.currentSuite
    };

    if (this.currentSuite) {
      this.currentSuite.tests.push(testCase);
    } else {
      this.describe('Default Suite', () => {
        this.currentSuite.tests.push(testCase);
      });
    }
  }

  it(name, fn, options = {}) {
    this.test(name, fn, options);
  }

  beforeAll(fn) {
    if (this.currentSuite) this.currentSuite.beforeAll.push(fn);
  }

  afterAll(fn) {
    if (this.currentSuite) this.currentSuite.afterAll.push(fn);
  }

  beforeEach(fn) {
    if (this.currentSuite) this.currentSuite.beforeEach.push(fn);
  }

  afterEach(fn) {
    if (this.currentSuite) this.currentSuite.afterEach.push(fn);
  }

  async runSuite(suite, inheritedBeforeEach = [], inheritedAfterEach = []) {
    const beforeEaches = [...inheritedBeforeEach, ...suite.beforeEach];
    const afterEaches = [...suite.afterEach, ...inheritedAfterEach];

    // Run beforeAll hooks
    for (const hook of suite.beforeAll) {
      await hook();
    }

    for (const item of suite.tests) {
      if (item.tests) {
        // Nested suite
        await this.runSuite(item, beforeEaches, afterEaches);
      } else {
        // Test case
        await this.runSingleTest(item, beforeEaches, afterEaches);
      }
    }

    // Run afterAll hooks
    for (const hook of suite.afterAll) {
      await hook();
    }
  }

  async runSingleTest(testCase, beforeEaches, afterEaches) {
    this.results.total++;
    const tier = testCase.tier || 'Unknown Tier';
    if (!this.results.tierBreakdown[tier]) {
      this.results.tierBreakdown[tier] = { passed: 0, failed: 0, total: 0 };
    }
    this.results.tierBreakdown[tier].total++;

    if (testCase.skip) {
      this.results.skipped++;
      return;
    }

    const startTime = Date.now();
    try {
      // Run beforeEach hooks
      for (const hook of beforeEaches) {
        await hook();
      }

      // Execute test with timeout protection
      await Promise.race([
        testCase.fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Test timed out after ${testCase.timeout}ms`)), testCase.timeout)
        )
      ]);

      // Run afterEach hooks
      for (const hook of afterEaches) {
        await hook();
      }

      const duration = Date.now() - startTime;
      this.results.passed++;
      this.results.tierBreakdown[tier].passed++;
    } catch (err) {
      const duration = Date.now() - startTime;
      this.results.failed++;
      this.results.tierBreakdown[tier].failed++;
      this.results.failures.push({
        suite: testCase.suite ? testCase.suite.name : 'Unknown',
        tier: testCase.tier,
        feature: testCase.feature,
        test: testCase.name,
        error: err.message || String(err),
        stack: err.stack,
        duration
      });
    }
  }

  async execute() {
    const startTime = Date.now();
    for (const suite of this.suites) {
      await this.runSuite(suite);
    }
    this.results.durationMs = Date.now() - startTime;
    return this.results;
  }

  reset() {
    this.suites = [];
    this.currentSuite = null;
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      durationMs: 0,
      tierBreakdown: {},
      failures: []
    };
  }
}

export const globalRunner = new TestFramework();

export const describe = (name, fn) => globalRunner.describe(name, fn);
export const test = (name, fn, options) => globalRunner.test(name, fn, options);
export const it = (name, fn, options) => globalRunner.it(name, fn, options);
export const beforeAll = (fn) => globalRunner.beforeAll(fn);
export const afterAll = (fn) => globalRunner.afterAll(fn);
export const beforeEach = (fn) => globalRunner.beforeEach(fn);
export const afterEach = (fn) => globalRunner.afterEach(fn);
export const setTestContext = (tier, feature) => globalRunner.setContext(tier, feature);
