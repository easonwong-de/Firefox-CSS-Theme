import fs from "node:fs/promises";
import path from "node:path";
import type { TestCase } from "./types.js";

/** Accumulates test results and formats output reports. */
export class TestResults {
	private passedCount = 0;
	private failedCount = 0;
	private errorCount = 0;
	private failures: Array<{ message: string; details?: unknown }> = [];
	private errors: Array<{ testCaseName: string; error: unknown }> = [];

	public pass(message: string): void {
		this.passedCount++;
		console.log(`  \x1b[32m✔\x1b[0m ${message}`);
	}

	public fail(message: string, details?: unknown): void {
		this.failedCount++;
		this.failures.push({ message, details });
		console.log(`  \x1b[31m✖\x1b[0m ${message}`);
		if (details !== undefined) {
			console.log(
				`    \x1b[90m${typeof details === "string" ? details : JSON.stringify(details)}\x1b[0m`,
			);
		}
	}

	public error(testCaseName: string, error: unknown): void {
		this.errorCount++;
		this.errors.push({ testCaseName, error });
		console.log(
			`  \x1b[31m✖\x1b[0m \x1b[31mError in ${testCaseName}:\x1b[0m`,
			error,
		);
	}

	public summary(): void {
		const totalCount =
			this.passedCount + this.failedCount + this.errorCount;
		console.log("\n" + "─".repeat(50));
		console.log("\x1b[1mTest Suite Summary\x1b[0m");
		console.log(`Total checks: ${totalCount}`);
		console.log(`  \x1b[32mPassed: ${this.passedCount}\x1b[0m`);
		if (this.failedCount > 0) {
			console.log(`  \x1b[31mFailed: ${this.failedCount}\x1b[0m`);
		}
		if (this.errorCount > 0) {
			console.log(`  \x1b[31mErrors: ${this.errorCount}\x1b[0m`);
		}
		console.log("─".repeat(50) + "\n");
	}

	public exitCode(): number {
		return this.failedCount > 0 || this.errorCount > 0 ? 1 : 0;
	}
}

/** Utility delay helper. */
export function sleep(milliseconds: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** Discovers and loads test cases from spec files in a directory. */
export async function getTestCases(dirPath: string): Promise<TestCase[]> {
	const dirEntries = await fs.readdir(dirPath, { withFileTypes: true });
	const specificationFiles = dirEntries
		.filter(
			(entry) =>
				entry.isFile() &&
				entry.name.endsWith(".spec.ts") &&
				!entry.name.startsWith("."),
		)
		.map((entry) => entry.name)
		.sort((first, second) => first.localeCompare(second));

	const testCases: TestCase[] = [];
	for (const specificationFile of specificationFiles) {
		const specificationFilePath = path.join(dirPath, specificationFile);
		const moduleExports = await import(specificationFilePath);
		if (moduleExports.testCase) {
			testCases.push(moduleExports.testCase as TestCase);
		}
	}
	return testCases;
}
