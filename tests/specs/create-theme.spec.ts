import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "bun:test";
import { createCommand } from "../../src/commands/create.js";

describe("Theme Project Scaffolding", () => {
	test("scaffolds theme projects with various targets", async () => {
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

			expect(existsSync(pkgJsonPath)).toBe(true);
			expect(existsSync(gitignorePath)).toBe(true);
			expect(existsSync(readmePath)).toBe(true);
			expect(existsSync(chromeCssPath)).toBe(true);
			expect(existsSync(contentCssPath)).toBe(true);

			const parsedPkg = JSON.parse(readFileSync(pkgJsonPath, "utf8")) as {
				devDependencies?: Record<string, string>;
				name?: string;
				scripts?: Record<string, string>;
			};

			expect(parsedPkg.name).toBe("test-theme");
			expect(parsedPkg.scripts?.start).toBe("firefox-css-theme start");
			expect(parsedPkg.scripts?.["install:theme"]).toBe(
				"firefox-css-theme install",
			);
			expect(
				parsedPkg.devDependencies?.["firefox-css-theme"],
			).toBeDefined();

			await createCommand({
				force: true,
				name: "chrome-only-theme",
				target: "chrome",
			});

			const chromeOnlyDir = path.join(baseTempDir, "chrome-only-theme");
			expect(existsSync(path.join(chromeOnlyDir, "userChrome.css"))).toBe(
				true,
			);
			expect(
				existsSync(path.join(chromeOnlyDir, "userContent.css")),
			).toBe(false);

			await createCommand({
				force: true,
				name: "content-only-theme",
				target: "content",
			});

			const contentOnlyDir = path.join(baseTempDir, "content-only-theme");
			expect(
				existsSync(path.join(contentOnlyDir, "userChrome.css")),
			).toBe(false);
			expect(
				existsSync(path.join(contentOnlyDir, "userContent.css")),
			).toBe(true);

			const originalIsTTY = process.stdin.isTTY;
			Object.defineProperty(process.stdin, "isTTY", {
				value: false,
				configurable: true,
			});
			try {
				await createCommand({
					force: true,
					name: "default-target-theme",
				});
				const defaultTargetDir = path.join(
					baseTempDir,
					"default-target-theme",
				);
				expect(
					existsSync(path.join(defaultTargetDir, "userChrome.css")),
				).toBe(true);
				expect(
					existsSync(path.join(defaultTargetDir, "userContent.css")),
				).toBe(false);
			} finally {
				Object.defineProperty(process.stdin, "isTTY", {
					value: originalIsTTY,
					configurable: true,
				});
			}
		} finally {
			process.chdir(originalWorkingDir);
			rmSync(baseTempDir, { force: true, recursive: true });
		}
	});
});
