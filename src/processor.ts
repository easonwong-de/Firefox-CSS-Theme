import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";
import postcssImport from "postcss-import";
import type { CssCompilationResult } from "./types.js";

/** Compiles a CSS string using PostCSS and inlines @import dependencies. */
export async function compileCssString(
	css: string,
	basePath: string = path.resolve(process.cwd(), "style.css"),
): Promise<CssCompilationResult> {
	const processor = postcss([postcssImport()]);
	const output = await processor.process(css, { from: basePath });

	const importedFiles: string[] = [];
	for (const message of output.messages) {
		if (message.type === "dependency" && typeof message.file === "string") {
			importedFiles.push(message.file);
		}
	}

	return { css: output.css, importedFiles: importedFiles };
}

/**
 * Compiles a CSS file, inlines @import rules via PostCSS, and optionally writes
 * the output bundle to a destination path.
 */
export async function compileCssFile(
	srcPath: string,
	destPath?: string,
): Promise<CssCompilationResult> {
	const absoluteSrcPath = path.resolve(process.cwd(), srcPath);
	if (!existsSync(absoluteSrcPath)) {
		throw new Error(
			`Stylesheet file does not exist at path: ${absoluteSrcPath}`,
		);
	}

	const sourceContent = readFileSync(absoluteSrcPath, "utf8");
	const result = await compileCssString(sourceContent, absoluteSrcPath);

	if (destPath) {
		const absoluteDestPath = path.resolve(process.cwd(), destPath);
		const destDir = path.dirname(absoluteDestPath);
		if (!existsSync(destDir)) {
			mkdirSync(destDir, { recursive: true });
		}
		writeFileSync(absoluteDestPath, result.css, "utf8");
	}

	return result;
}
