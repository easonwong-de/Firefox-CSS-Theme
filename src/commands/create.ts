import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { CreateCommandOptions } from "../types.js";

const DEFAULT_CHROME_CSS = `/* Firefox userChrome.css */
@namespace url("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");
@namespace html url("http://www.w3.org/1999/xhtml");

`;

const DEFAULT_CONTENT_CSS = `/* Firefox userContent.css */
@namespace url("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");
@namespace html url("http://www.w3.org/1999/xhtml");

`;

/**
 * Scaffolds starter userChrome.css and userContent.css boilerplate files with
 * namespace headers.
 */
export async function createCommand(
	options: CreateCommandOptions = {},
): Promise<void> {
	const chromePath = path.resolve(
		process.cwd(),
		options.chromePath || "userChrome.css",
	);
	const contentPath = path.resolve(
		process.cwd(),
		options.contentPath || "userContent.css",
	);

	if (existsSync(chromePath) && !options.force) {
		console.warn(
			`\x1b[33m[skip]\x1b[0m ${chromePath} already exists. Use --force to overwrite.`,
		);
	} else {
		writeFileSync(chromePath, DEFAULT_CHROME_CSS, "utf8");
		console.log(`\x1b[32m[created]\x1b[0m ${chromePath}`);
	}

	if (existsSync(contentPath) && !options.force) {
		console.warn(
			`\x1b[33m[skip]\x1b[0m ${contentPath} already exists. Use --force to overwrite.`,
		);
	} else {
		writeFileSync(contentPath, DEFAULT_CONTENT_CSS, "utf8");
		console.log(`\x1b[32m[created]\x1b[0m ${contentPath}`);
	}
}
