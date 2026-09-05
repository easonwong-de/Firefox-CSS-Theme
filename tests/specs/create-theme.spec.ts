import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createCommand } from "../../src/commands/create.js";
import type { TestCase } from "../types.js";

export const testCase: TestCase = {
	name: "Theme Project Scaffolding",
	async run({ results }) {
		const baseTempDir = mkdtempSync(
			path.join(os.tmpdir(), "firefox-theme-create-test-"),
		);
		const originalWorkingDir = process.cwd();

		try {
			process.chdir(baseTempDir);

			await createCommand({
				force: true,
				name: "test-theme",
				target: "both",
			});

			const themeDir = path.join(baseTempDir, "test-theme");
			const pkgJsonPath = path.join(themeDir, "package.json");
			const gitignorePath = path.join(themeDir, ".gitignore");
			const readmePath = path.join(themeDir, "README.md");
			const chromeCssPath = path.join(themeDir, "userChrome.css");
			const contentCssPath = path.join(themeDir, "userContent.css");

			if (
				existsSync(pkgJsonPath) &&
				existsSync(gitignorePath) &&
				existsSync(readmePath) &&
				existsSync(chromeCssPath) &&
				existsSync(contentCssPath)
			) {
				results.pass(
					"Scaffolded full theme package with both stylesheets",
				);
			} else {
				results.fail("Missing expected files in scaffolded theme");
			}

			const parsedPkg = JSON.parse(readFileSync(pkgJsonPath, "utf8")) as {
				devDependencies?: Record<string, string>;
				name?: string;
				scripts?: Record<string, string>;
			};

			if (
				parsedPkg.name === "test-theme" &&
				parsedPkg.scripts?.start === "firefox-css-theme start" &&
				parsedPkg.scripts?.["install:theme"] ===
					"firefox-css-theme install" &&
				parsedPkg.devDependencies?.["firefox-css-theme"]
			) {
				results.pass(
					"package.json configured with required scripts and dependency",
				);
			} else {
				results.fail(
					"package.json contents do not match expected schema",
					{ parsedPkg: parsedPkg },
				);
			}

			await createCommand({
				force: true,
				name: "chrome-only-theme",
				target: "chrome",
			});

			const chromeOnlyDir = path.join(baseTempDir, "chrome-only-theme");
			if (
				existsSync(path.join(chromeOnlyDir, "userChrome.css")) &&
				!existsSync(path.join(chromeOnlyDir, "userContent.css"))
			) {
				results.pass("Scaffolded theme with userChrome.css only");
			} else {
				results.fail("Stylesheet mismatch for chrome-only target");
			}

			await createCommand({
				force: true,
				name: "content-only-theme",
				target: "content",
			});

			const contentOnlyDir = path.join(baseTempDir, "content-only-theme");
			if (
				!existsSync(path.join(contentOnlyDir, "userChrome.css")) &&
				existsSync(path.join(contentOnlyDir, "userContent.css"))
			) {
				results.pass("Scaffolded theme with userContent.css only");
			} else {
				results.fail("Stylesheet mismatch for content-only target");
			}
		} finally {
			process.chdir(originalWorkingDir);
			rmSync(baseTempDir, { force: true, recursive: true });
		}
	},
};
