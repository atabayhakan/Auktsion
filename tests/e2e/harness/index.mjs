/**
 * E2E Test Harness Index for Auktsion v2.0
 */

export * from './testFramework.mjs';
export * from './assertions.mjs';
export * from './mockServer.mjs';
export * from './apiClient.mjs';
export * from './contractValidators.mjs';

import { MockAuctionServer } from './mockServer.mjs';
import { ApiTestClient } from './apiClient.mjs';

let sharedServer = null;
let sharedClient = null;

export async function getTestEnvironment() {
  const liveUrl = process.env.AUKTSION_TEST_URL || process.env.AUKTSION_SERVER_URL;
  if (liveUrl) {
    const client = new ApiTestClient(liveUrl);
    return {
      client,
      server: null,
      isLive: true,
      reset: async () => {}
    };
  }

  if (!sharedServer) {
    sharedServer = new MockAuctionServer();
    const baseUrl = await sharedServer.start();
    sharedClient = new ApiTestClient(baseUrl);
  }

  return {
    client: sharedClient,
    server: sharedServer,
    isLive: false,
    reset: () => sharedServer.reset()
  };
}

export async function stopTestEnvironment() {
  if (sharedServer) {
    await sharedServer.stop();
    sharedServer = null;
    sharedClient = null;
  }
}
