import type { FirefoxManager } from "../src/firefox.js";
import type { TestResults } from "./utils.js";

export type TestContext = {
	firefoxManager: FirefoxManager;
	results: TestResults;
};

export type TestCase = {
	name: string;
	run(context: TestContext): Promise<void>;
};
