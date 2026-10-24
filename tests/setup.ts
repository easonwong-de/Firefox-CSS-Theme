import { afterAll, beforeAll, jest, spyOn } from "bun:test";

import { log } from "@clack/prompts";

import { firefoxManager } from "../src/firefox.js";

log.message = () => {};
log.info = () => {};
log.success = () => {};
log.step = () => {};
log.warn = () => {};
log.error = () => {};

spyOn(process.stdout, "write").mockImplementation(() => true);
spyOn(console, "log").mockImplementation(() => {});

jest.setTimeout(30000);

beforeAll(async () => {
	const isHeadless = !process.argv.includes("--no-headless");
	await firefoxManager.initialiseBrowser(undefined, undefined, isHeadless);
}, 60000);

afterAll(async () => {
	await firefoxManager.terminateBrowser().catch(() => {});
}, 30000);
