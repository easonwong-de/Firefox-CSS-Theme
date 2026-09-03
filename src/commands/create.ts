import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { log } from "@clack/prompts";
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
 * Scaffolds a starter stylesheet template file on disk if it does not already
 * exist or if forced.
 */
function createStylesheetFile(
	filePath: string,
	defaultContent: string,
	force?: boolean,
): void {
	const resolvedPath = path.resolve(process.cwd(), filePath);
	if (existsSync(resolvedPath) && !force) {
		log.warn(`${resolvedPath} already exists. Use --force to overwrite.`);
		return;
	}
	writeFileSync(resolvedPath, defaultContent, "utf8");
	log.success(`Created ${resolvedPath}`);
}

/**
 * Scaffolds starter userChrome.css and userContent.css boilerplate files with
 * namespace headers.
 */
export async function createCommand(
	options: CreateCommandOptions = {},
): Promise<void> {
	createStylesheetFile(
		options.chromePath || "userChrome.css",
		DEFAULT_CHROME_CSS,
		options.force,
	);
	createStylesheetFile(
		options.contentPath || "userContent.css",
		DEFAULT_CONTENT_CSS,
		options.force,
	);
}
