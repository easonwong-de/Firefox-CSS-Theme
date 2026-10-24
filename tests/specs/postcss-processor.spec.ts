import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { compileCssFile, compileCssString } from "../../src/processor.js";

describe("PostCSS Preprocessing and Import Inlining", () => {
	test("compiles direct CSS string", async () => {
		const simpleCss = "#nav-bar { display: flex; }";
		const directResult = await compileCssString(simpleCss);
		expect(directResult.css.trim()).toBe(simpleCss.trim());
	});

	test("inlines @import dependency and tracks files", async () => {
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
			expect(fileResult.css.includes("--accent-color: #ff0000;")).toBe(
				true,
			);
			expect(
				fileResult.css.includes("body { color: var(--accent-color); }"),
			).toBe(true);
			expect(
				fileResult.importedFiles.some((imported) =>
					imported.endsWith("partial.css"),
				),
			).toBe(true);
		} finally {
			rmSync(tempDir, { force: true, recursive: true });
		}
	});
});
