import { lazy } from "react";
import type { ComponentType } from "react";

const DELAYS_MS = [400, 1200];

/**
 * Like `React.lazy`, but retries the dynamic import a few times. On flaky
 * networks a single chunk request can fail; retrying avoids a blank screen.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<C extends ComponentType<any>>(load: () => Promise<{ default: C }>) {
  return lazy(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= DELAYS_MS.length; attempt++) {
      try {
        return await load();
      } catch (error) {
        lastError = error;
        if (attempt < DELAYS_MS.length) {
          await new Promise((resolve) => setTimeout(resolve, DELAYS_MS[attempt]));
        }
      }
    }
    throw lastError;
  });
}
