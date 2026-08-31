import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { compileCssString } from "../processor.js";
import {
	listFirefoxProfiles,
	resolveProfileDirectoryByName,
} from "../profiles.js";
import type { SaveCommandOptions } from "../types.js";

/**
 * Saves and compiles theme stylesheets directly into the target Firefox
 * profile's chrome folder.
 */
export async function saveCommand(
	options: SaveCommandOptions = {},
): Promise<void> {
	let profileName = options.profileName;

	if (!profileName) {
		const availableProfiles = listFirefoxProfiles();
		if (availableProfiles.length === 0) {
			throw new Error("No Firefox profile detected.");
		} else if (availableProfiles.length === 1) {
			profileName = availableProfiles[0].name;
		} else {
			const profileNames = availableProfiles
				.map((profile) => profile.name)
				.join(", ");
			throw new Error(
				`Multiple Firefox profiles detected (${profileNames}). Specify target profile with -p, --profile <name>.`,
			);
		}
	}

	const profileDir = resolveProfileDirectoryByName(profileName);
	const chromeDir = path.join(profileDir, "chrome");

	if (!existsSync(chromeDir)) {
		mkdirSync(chromeDir, { recursive: true });
	}

	const srcChromePath = options.chromePath
		? path.resolve(process.cwd(), options.chromePath)
		: existsSync(path.resolve(process.cwd(), "userChrome.css"))
			? path.resolve(process.cwd(), "userChrome.css")
			: undefined;

	const srcContentPath = options.contentPath
		? path.resolve(process.cwd(), options.contentPath)
		: existsSync(path.resolve(process.cwd(), "userContent.css"))
			? path.resolve(process.cwd(), "userContent.css")
			: undefined;

	if (!srcChromePath && !srcContentPath) {
		console.warn("No stylesheet files found to save.");
		return;
	}

	const destChromePath = path.join(chromeDir, "userChrome.css");
	const destContentPath = path.join(chromeDir, "userContent.css");

	const requiresConfirmation =
		!options.force &&
		((srcChromePath && existsSync(destChromePath)) ||
			(srcContentPath && existsSync(destContentPath)));

	if (requiresConfirmation) {
		const readlineInterface = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		const userResponse = await readlineInterface.question(
			`\x1b[33m[warning]\x1b[0m Existing theme files will be overwritten in profile "${profileName}". Proceed? (y/N) `,
		);
		readlineInterface.close();

		if (userResponse.trim().toLowerCase() !== "y") {
			console.log("Save operation cancelled.");
			return;
		}
	}

	if (srcChromePath) {
		const sourceContent = readFileSync(srcChromePath, "utf8");
		let mergedCss = sourceContent;

		if (existsSync(destChromePath)) {
			const existingDestinationContent = readFileSync(
				destChromePath,
				"utf8",
			);
			if (
				!existingDestinationContent.includes(sourceContent.trim()) &&
				!sourceContent.includes(existingDestinationContent.trim())
			) {
				mergedCss = `${existingDestinationContent}\n\n${sourceContent}`;
			}
		}

		const compiledBundle = await compileCssString(mergedCss, srcChromePath);
		writeFileSync(destChromePath, compiledBundle.css, "utf8");
		console.log(
			`\x1b[32m[saved]\x1b[0m userChrome.css -> ${destChromePath}`,
		);
	}

	if (srcContentPath) {
		const sourceContent = readFileSync(srcContentPath, "utf8");
		let mergedCss = sourceContent;

		if (existsSync(destContentPath)) {
			const existingDestinationContent = readFileSync(
				destContentPath,
				"utf8",
			);
			if (
				!existingDestinationContent.includes(sourceContent.trim()) &&
				!sourceContent.includes(existingDestinationContent.trim())
			) {
				mergedCss = `${existingDestinationContent}\n\n${sourceContent}`;
			}
		}

		const compiledBundle = await compileCssString(
			mergedCss,
			srcContentPath,
		);
		writeFileSync(destContentPath, compiledBundle.css, "utf8");
		console.log(
			`\x1b[32m[saved]\x1b[0m userContent.css -> ${destContentPath}`,
		);
	}
}
