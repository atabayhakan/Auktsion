/**
 * Assertion Library for Auktsion v2.0 E2E & Integration Tests
 */

export class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

export function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new AssertionError(message, condition, true);
  }
}

export function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    const msg = message || `Expected ${JSON.stringify(actual)} to strictly equal ${JSON.stringify(expected)}`;
    throw new AssertionError(msg, actual, expected);
  }
}

export function assertNotEqual(actual, expected, message = '') {
  if (actual === expected) {
    const msg = message || `Expected ${JSON.stringify(actual)} not to equal ${JSON.stringify(expected)}`;
    throw new AssertionError(msg, actual, expected);
  }
}

export function assertDeepEqual(actual, expected, message = '') {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    const msg = message || `Expected deep equality:\nActual:   ${actualStr}\nExpected: ${expectedStr}`;
    throw new AssertionError(msg, actual, expected);
  }
}

export function assertIncludes(container, target, message = '') {
  if (typeof container === 'string') {
    if (!container.includes(target)) {
      const msg = message || `Expected string "${container}" to include "${target}"`;
      throw new AssertionError(msg, container, target);
    }
  } else if (Array.isArray(container)) {
    const found = container.some(item => 
      typeof target === 'object' && target !== null 
        ? JSON.stringify(item) === JSON.stringify(target)
        : item === target
    );
    if (!found) {
      const msg = message || `Expected array ${JSON.stringify(container)} to include ${JSON.stringify(target)}`;
      throw new AssertionError(msg, container, target);
    }
  } else if (typeof container === 'object' && container !== null) {
    if (!(target in container)) {
      const msg = message || `Expected object to contain key "${target}"`;
      throw new AssertionError(msg, Object.keys(container), target);
    }
  } else {
    throw new AssertionError(`Invalid container for assertIncludes: ${typeof container}`, container, target);
  }
}

export function assertNotIncludes(container, target, message = '') {
  if (typeof container === 'string') {
    if (container.includes(target)) {
      const msg = message || `Expected string "${container}" NOT to include "${target}"`;
      throw new AssertionError(msg, container, target);
    }
  } else if (Array.isArray(container)) {
    if (container.includes(target)) {
      const msg = message || `Expected array NOT to include ${JSON.stringify(target)}`;
      throw new AssertionError(msg, container, target);
    }
  } else if (typeof container === 'object' && container !== null) {
    if (target in container) {
      const msg = message || `Expected object NOT to contain key "${target}"`;
      throw new AssertionError(msg, Object.keys(container), target);
    }
  }
}

export function assertMatches(actual, regex, message = '') {
  const reg = typeof regex === 'string' ? new RegExp(regex) : regex;
  if (!reg.test(String(actual))) {
    const msg = message || `Expected "${actual}" to match regex ${regex}`;
    throw new AssertionError(msg, actual, regex);
  }
}

export function assertInRange(actual, min, max, message = '') {
  if (actual < min || actual > max) {
    const msg = message || `Expected ${actual} to be in range [${min}, ${max}]`;
    throw new AssertionError(msg, actual, { min, max });
  }
}

export function assertStatusCode(response, expectedCode, message = '') {
  const code = response.status || response.statusCode;
  if (code !== expectedCode) {
    const bodySnippet = response.data ? JSON.stringify(response.data).slice(0, 200) : '';
    const msg = message || `Expected HTTP status ${expectedCode} but got ${code}. Response: ${bodySnippet}`;
    throw new AssertionError(msg, code, expectedCode);
  }
}

export function assertThrows(fn, expectedMessageOrRegex = null) {
  let threw = false;
  let thrownError = null;
  try {
    fn();
  } catch (err) {
    threw = true;
    thrownError = err;
  }
  if (!threw) {
    throw new AssertionError('Expected function to throw an error, but it did not', null, 'Error');
  }
  if (expectedMessageOrRegex) {
    const errText = thrownError.message || String(thrownError);
    if (expectedMessageOrRegex instanceof RegExp) {
      if (!expectedMessageOrRegex.test(errText)) {
        throw new AssertionError(`Expected thrown error "${errText}" to match ${expectedMessageOrRegex}`, errText, expectedMessageOrRegex);
      }
    } else if (typeof expectedMessageOrRegex === 'string') {
      if (!errText.includes(expectedMessageOrRegex)) {
        throw new AssertionError(`Expected thrown error "${errText}" to include "${expectedMessageOrRegex}"`, errText, expectedMessageOrRegex);
      }
    }
  }
}

export async function assertRejects(asyncFn, expectedMessageOrRegex = null) {
  let threw = false;
  let thrownError = null;
  try {
    await asyncFn();
  } catch (err) {
    threw = true;
    thrownError = err;
  }
  if (!threw) {
    throw new AssertionError('Expected async function to reject, but it resolved', null, 'Error');
  }
  if (expectedMessageOrRegex) {
    const errText = thrownError.message || String(thrownError);
    if (expectedMessageOrRegex instanceof RegExp) {
      if (!expectedMessageOrRegex.test(errText)) {
        throw new AssertionError(`Expected rejected error "${errText}" to match ${expectedMessageOrRegex}`, errText, expectedMessageOrRegex);
      }
    } else if (typeof expectedMessageOrRegex === 'string') {
      if (!errText.includes(expectedMessageOrRegex)) {
        throw new AssertionError(`Expected rejected error "${errText}" to include "${expectedMessageOrRegex}"`, errText, expectedMessageOrRegex);
      }
    }
  }
}

export function assertContractValid(data, schemaDef, message = '') {
  for (const [key, type] of Object.entries(schemaDef)) {
    if (type.endsWith('?')) {
      const realType = type.slice(0, -1);
      if (data[key] !== undefined && data[key] !== null) {
        validateType(data[key], realType, `${message} field [${key}]`);
      }
    } else {
      if (data[key] === undefined || data[key] === null) {
        throw new AssertionError(`${message} Missing required field "${key}" in object ${JSON.stringify(data)}`, data[key], type);
      }
      validateType(data[key], type, `${message} field [${key}]`);
    }
  }
}

function validateType(val, type, context) {
  if (type === 'string' && typeof val !== 'string') {
    throw new AssertionError(`${context}: expected string, got ${typeof val}`, typeof val, 'string');
  }
  if (type === 'number' && typeof val !== 'number') {
    throw new AssertionError(`${context}: expected number, got ${typeof val}`, typeof val, 'number');
  }
  if (type === 'boolean' && typeof val !== 'boolean') {
    throw new AssertionError(`${context}: expected boolean, got ${typeof val}`, typeof val, 'boolean');
  }
  if (type === 'array' && !Array.isArray(val)) {
    throw new AssertionError(`${context}: expected array, got ${typeof val}`, typeof val, 'array');
  }
  if (type === 'object' && (typeof val !== 'object' || val === null || Array.isArray(val))) {
    throw new AssertionError(`${context}: expected object, got ${typeof val}`, typeof val, 'object');
  }
}
