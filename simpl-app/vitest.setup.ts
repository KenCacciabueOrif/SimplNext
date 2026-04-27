/**
 * Last updated: 2026-04-27
 * Purpose: Global Vitest setup — extends the expect API with @testing-library/jest-dom
 *          matchers (toBeInTheDocument, toHaveAttribute, etc.) for all test suites.
 *          Uses the explicit extend pattern so the setup works in both node and jsdom
 *          environments without requiring globals: true.
 *          Also registers automatic DOM cleanup after each test so renders do not
 *          accumulate across test cases.
 */

import { expect, afterEach } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

expect.extend(matchers);
afterEach(cleanup);
