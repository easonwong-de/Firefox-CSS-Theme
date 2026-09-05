import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { compileCssFile, compileCssString } from "../../src/processor.js";
import type { TestCase } from "../types.js";

export const testCase: TestCase = {
	name: "PostCSS Preprocessing and Import Inlining",
	async run({ results }) {
		const simpleCss = "#nav-bar { display: flex; }";
		const directResult = await compileCssString(simpleCss);

		if (directResult.css.trim() === simpleCss.trim()) {
			results.pass(
				"Direct CSS string compiled and matched input content",
			);
		} else {
			results.fail("Direct CSS string compilation content mismatch", {
				actual: directResult.css,
				expected: simpleCss,
			});
		}

		const tempDir = mkdtempSync(path.join(os.tmpdir(), "postcss-test-"));
		const partialFilePath = path.join(tempDir, "partial.css");
		const rootFilePath = path.join(tempDir, "root.css");

		try {
			writeFileSync(
				partialFilePath,
				":root { --accent-color: #ff0000; }",
				"utf8",
			);
			writeFileSync(
				rootFilePath,
				'@import "./partial.css";\nbody { color: var(--accent-color); }',
				"utf8",
			);

			const fileResult = await compileCssFile(rootFilePath);

			if (
				fileResult.css.includes("--accent-color: #ff0000;") &&
				fileResult.css.includes("body { color: var(--accent-color); }")
			) {
				results.pass("PostCSS successfully inlined @import dependency");
			} else {
				results.fail("Failed to inline @import dependency", fileResult);
			}

			if (
				fileResult.importedFiles.some((imported) =>
					imported.endsWith("partial.css"),
				)
			) {
				results.pass("Imported dependencies tracked accurately");
			} else {
				results.fail(
					"Missing dependency in compilation result",
					fileResult,
				);
			}
		} finally {
			rmSync(tempDir, { force: true, recursive: true });
		}
	},
};
