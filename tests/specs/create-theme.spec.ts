import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createCommand } from "../../src/commands/create.js";
import type { TestCase } from "../types.js";

export const testCase: TestCase = {
	name: "Theme Project Scaffolding",
	async run({ results }) {
		const baseTemporaryDirectory = mkdtempSync(
			path.join(os.tmpdir(), "firefox-theme-create-test-"),
		);
		const originalWorkingDirectory = process.cwd();

		try {
			process.chdir(baseTemporaryDirectory);

			await createCommand({
				force: true,
				name: "test-theme",
				target: "both",
			});

			const themeDirectory = path.join(
				baseTemporaryDirectory,
				"test-theme",
			);
			const packageJsonPath = path.join(themeDirectory, "package.json");
			const gitignorePath = path.join(themeDirectory, ".gitignore");
			const readmePath = path.join(themeDirectory, "README.md");
			const chromeCssPath = path.join(themeDirectory, "userChrome.css");
			const contentCssPath = path.join(themeDirectory, "userContent.css");

			if (
				existsSync(packageJsonPath) &&
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

			const parsedPackage = JSON.parse(
				readFileSync(packageJsonPath, "utf8"),
			) as {
				devDependencies?: Record<string, string>;
				name?: string;
				scripts?: Record<string, string>;
			};

			if (
				parsedPackage.name === "test-theme" &&
				parsedPackage.scripts?.start === "firefox-css-theme start" &&
				parsedPackage.scripts?.["install:theme"] ===
					"firefox-css-theme install" &&
				parsedPackage.devDependencies?.["firefox-css-theme"]
			) {
				results.pass(
					"package.json configured with required scripts and dependency",
				);
			} else {
				results.fail(
					"package.json contents do not match expected schema",
					{ parsedPackage },
				);
			}

			await createCommand({
				force: true,
				name: "chrome-only-theme",
				target: "chrome",
			});

			const chromeOnlyDirectory = path.join(
				baseTemporaryDirectory,
				"chrome-only-theme",
			);
			if (
				existsSync(path.join(chromeOnlyDirectory, "userChrome.css")) &&
				!existsSync(path.join(chromeOnlyDirectory, "userContent.css"))
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

			const contentOnlyDirectory = path.join(
				baseTemporaryDirectory,
				"content-only-theme",
			);
			if (
				!existsSync(
					path.join(contentOnlyDirectory, "userChrome.css"),
				) &&
				existsSync(path.join(contentOnlyDirectory, "userContent.css"))
			) {
				results.pass("Scaffolded theme with userContent.css only");
			} else {
				results.fail("Stylesheet mismatch for content-only target");
			}
		} finally {
			process.chdir(originalWorkingDirectory);
			rmSync(baseTemporaryDirectory, { force: true, recursive: true });
		}
	},
};
