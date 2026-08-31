import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { compileCssString } from "../processor.js";
import { listProfiles, resolveProfileDirectoryByName } from "../profiles.js";
import type { InstallCommandOptions } from "../types.js";

/**
 * Enables the stylesheet customisation preference in the target Firefox
 * profile's user.js configuration file.
 */
function enableCustomStylesheets(profileDir: string): void {
	const userJsPath = path.join(profileDir, "user.js");
	const prefLine =
		'user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);';

	if (!existsSync(userJsPath)) {
		writeFileSync(userJsPath, `${prefLine}\n`, "utf8");
		return;
	}

	const userJsContent = readFileSync(userJsPath, "utf8");
	const prefRegex =
		/user_pref\s*\(\s*["']toolkit\.legacyUserProfileCustomizations\.stylesheets["']\s*,\s*(?:true|false)\s*\);?/;
	const updatedContent = prefRegex.test(userJsContent)
		? userJsContent.replace(prefRegex, prefLine)
		: `${userJsContent.trimEnd()}\n${prefLine}\n`;

	writeFileSync(userJsPath, updatedContent, "utf8");
}

/**
 * Compiles and installs a theme stylesheet to the target destination, merging
 * with existing CSS if requested.
 */
async function installStylesheet(
	srcPath: string | undefined,
	destPath: string,
	merge?: boolean,
	existingCss?: string,
): Promise<void> {
	if (!srcPath) return;
	const sourceCss = readFileSync(srcPath, "utf8");
	let mergedCss = sourceCss;

	if (
		merge &&
		existingCss &&
		!existingCss.includes(sourceCss.trim()) &&
		!sourceCss.includes(existingCss.trim())
	) {
		mergedCss = `${existingCss}\n\n${sourceCss}`;
	}

	const compiledBundle = await compileCssString(mergedCss, srcPath);
	writeFileSync(destPath, compiledBundle.css, "utf8");
	console.log(
		`\x1b[32m[installed]\x1b[0m ${path.basename(destPath)} -> ${destPath}`,
	);
}

/**
 * Installs and compiles theme stylesheets directly into the target Firefox
 * profile's chrome folder.
 */
export async function installCommand(
	options: InstallCommandOptions = {},
): Promise<void> {
	let profileName = options.profileName;

	if (!profileName) {
		const profiles = listProfiles();
		if (profiles.length === 0) {
			throw new Error("No Firefox profile detected.");
		} else if (profiles.length === 1) {
			profileName = profiles[0].name;
		} else {
			const profileNames = profiles
				.map((profile) => profile.name)
				.join(", ");
			throw new Error(
				`Multiple Firefox profiles detected (${profileNames}). Specify target profile with -p, --profile <name>.`,
			);
		}
	}

	const profileDir = resolveProfileDirectoryByName(profileName);
	const chromeDir = path.join(profileDir, "chrome");

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
		console.warn("No stylesheet files found to install.");
		return;
	}

	const destChromePath = path.join(chromeDir, "userChrome.css");
	const destContentPath = path.join(chromeDir, "userContent.css");
	const existingChromeCss =
		options.merge && existsSync(destChromePath)
			? readFileSync(destChromePath, "utf8")
			: undefined;
	const existingContentCss =
		options.merge && existsSync(destContentPath)
			? readFileSync(destContentPath, "utf8")
			: undefined;

	const requiresConfirmation =
		!options.force &&
		existsSync(chromeDir) &&
		(options.merge
			? Boolean(
					(srcChromePath && existingChromeCss) ||
					(srcContentPath && existingContentCss),
				)
			: readdirSync(chromeDir).length > 0);

	if (requiresConfirmation) {
		const readlineInterface = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		const warningAction = options.merge ? "merged" : "overwritten";
		const userResponse = await readlineInterface.question(
			`\x1b[33m[warning]\x1b[0m Existing theme files will be ${warningAction} in profile "${profileName}". Proceed? (y/N) `,
		);
		readlineInterface.close();
		if (userResponse.trim().toLowerCase() !== "y") {
			console.log("Install operation cancelled.");
			return;
		}
	}

	enableCustomStylesheets(profileDir);

	if (existsSync(chromeDir)) {
		rmSync(chromeDir, { recursive: true, force: true });
	}
	mkdirSync(chromeDir, { recursive: true });

	await installStylesheet(
		srcChromePath,
		destChromePath,
		options.merge,
		existingChromeCss,
	);
	await installStylesheet(
		srcContentPath,
		destContentPath,
		options.merge,
		existingContentCss,
	);
}
