import { afterAll, beforeAll, jest } from "bun:test";
import { firefoxManager } from "../src/firefox.js";

jest.setTimeout(30000);

beforeAll(async () => {
	const isHeadless = !process.argv.includes("--no-headless");
	await firefoxManager.initialiseBrowser(undefined, undefined, isHeadless);
}, 60000);

afterAll(async () => {
	await firefoxManager.terminateBrowser().catch(() => {});
}, 30000);
