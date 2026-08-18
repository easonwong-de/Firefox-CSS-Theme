#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { FirefoxManager } from "../src/firefox.js";
import type { TestContext } from "./types.js";
import { TestResults, getTestCases } from "./utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC_DIR = path.join(__dirname, "specs");

async function main(): Promise<void> {
	const results = new TestResults();
	const firefoxManager = new FirefoxManager();

	try {
		const testCases = await getTestCases(SPEC_DIR);
		console.log(`\nFound ${testCases.length} test specification(s).\n`);

		await firefoxManager.initialiseBrowser();

		for (const testCase of testCases) {
			console.log(`\n🔍 \x1b[1;34mTest case: ${testCase.name}\x1b[0m\n`);
			try {
				const context: TestContext = { firefoxManager, results };
				await testCase.run(context);
			} catch (error) {
				results.error(testCase.name, error);
			}
		}
	} catch (error) {
		results.error("Test Suite", error);
	} finally {
		console.log();
		await firefoxManager.terminateBrowser().catch(() => {});
	}

	results.summary();
	process.exit(results.exitCode());
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
