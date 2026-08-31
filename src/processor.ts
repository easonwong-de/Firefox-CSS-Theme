import { existsSync, readFileSync } from "node:fs";
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

/** Compiles a CSS file and inlines @import rules via PostCSS. */
export async function compileCssFile(
	srcPath: string,
): Promise<CssCompilationResult> {
	const fullSrcPath = path.resolve(process.cwd(), srcPath);
	if (!existsSync(fullSrcPath)) {
		throw new Error(
			`Stylesheet file does not exist at path: ${fullSrcPath}`,
		);
	}

	const content = readFileSync(fullSrcPath, "utf8");
	return await compileCssString(content, fullSrcPath);
}
