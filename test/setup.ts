import { beforeEach, vi } from "vitest";

/**
 * No test in this project may reach the network.
 *
 * The app talks to Mapbox for tiles, and Mapbox bills per request. A suite that
 * quietly made real calls would be slow, flaky, dependent on a token nobody
 * should have to supply to run `npm test`, and would cost whoever owns that
 * token money. Anything that tries fails loudly here instead.
 */
const forbid = (api: string) =>
  vi.fn(() => {
    throw new Error(
      `${api} was called from a test. Tests must not reach the network -- ` +
        "stub the call or use a fixture.",
    );
  });

beforeEach(() => {
  vi.stubGlobal("fetch", forbid("fetch"));
  vi.stubGlobal("XMLHttpRequest", forbid("XMLHttpRequest"));
});
