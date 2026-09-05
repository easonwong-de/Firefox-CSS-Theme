import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	cancel,
	confirm,
	intro,
	isCancel,
	log,
	outro,
	select,
	text,
} from "@clack/prompts";
import type { CreateCommandOptions, CreateStylesheetTarget } from "../types.js";

const templateDir = fileURLToPath(new URL("../../templates", import.meta.url));

/** Cancels the active prompt operation and terminates execution. */
function handleCancellation(value: unknown): void {
	if (!isCancel(value)) return;
	cancel("Operation cancelled.");
	process.exit(130);
}

/**
 * Scaffolds a starter stylesheet template file on disk.
 */
function createStylesheetFile(
	targetDir: string,
	relativeFilePath: string,
	templateFileName: string,
): void {
	const resolvedPath = path.resolve(targetDir, relativeFilePath);
	const parentDir = path.dirname(resolvedPath);
	if (!existsSync(parentDir)) {
		mkdirSync(parentDir, { recursive: true });
	}
	const templateContent = readFileSync(
		path.join(templateDir, templateFileName),
		"utf8",
	);
	writeFileSync(resolvedPath, templateContent, "utf8");
}

/**
 * Scaffolds a minimal Firefox CSS theme npm package with interactive prompts.
 */
export async function createCommand(
	options: CreateCommandOptions = {},
): Promise<void> {
	const isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
	if (isInteractive) intro("firefox-css-theme create");

	let chosenThemeName = options.name?.trim();
	if (!chosenThemeName && isInteractive) {
		const themeNameInput = await text({
			message: "What is your theme name?",
			placeholder: "my-firefox-theme",
			defaultValue: "my-firefox-theme",
			validate(value) {
				const trimmedValue = value?.trim() ?? "";
				if (trimmedValue.length === 0)
					return "Theme name cannot be empty.";
				if (
					trimmedValue !== "." &&
					!/^[a-zA-Z0-9@._-]+$/.test(trimmedValue)
				) {
					return "Theme name may only contain alphanumeric characters, hyphens, underscores, dots, and @.";
				}
			},
		});
		handleCancellation(themeNameInput);
		chosenThemeName = (themeNameInput as string).trim();
	}
	if (!chosenThemeName) chosenThemeName = "my-firefox-theme";

	const isCurrentDir = chosenThemeName === ".";
	const projectDir = isCurrentDir
		? process.cwd()
		: path.resolve(process.cwd(), chosenThemeName);
	const pkgName = isCurrentDir ? path.basename(projectDir) : chosenThemeName;

	let chosenTarget = options.target;
	if (!chosenTarget && isInteractive) {
		const stylesheetChoice = await select({
			message: "Which stylesheet(s) would you like to include?",
			options: [
				{
					value: "both",
					label: "userChrome.css & userContent.css",
					hint: "customise browser chrome and web content",
				},
				{
					value: "chrome",
					label: "userChrome.css only",
					hint: "customise Firefox browser interface",
				},
				{
					value: "content",
					label: "userContent.css only",
					hint: "customise web and internal pages",
				},
			],
			initialValue: "both",
		});
		handleCancellation(stylesheetChoice);
		chosenTarget = stylesheetChoice as CreateStylesheetTarget;
	}
	if (!chosenTarget) chosenTarget = "both";

	if (existsSync(projectDir)) {
		const existingEntries = readdirSync(projectDir);
		if (existingEntries.length > 0 && !options.force) {
			if (!isInteractive) {
				log.warn(
					`Directory "${chosenThemeName}" is not empty. Use --force to proceed without warning.`,
				);
				return;
			}
			const shouldProceed = await confirm({
				message: `Directory "${chosenThemeName}" is not empty. Continue and potentially overwrite existing files?`,
				initialValue: false,
			});
			if (isCancel(shouldProceed) || !shouldProceed) {
				cancel("Operation cancelled.");
				process.exit(130);
			}
		}
	} else {
		mkdirSync(projectDir, { recursive: true });
	}

	const pkgJsonTemplate = readFileSync(
		path.join(templateDir, "package.json"),
		"utf8",
	);
	const generatedPkgJson = pkgJsonTemplate.replace("{{NAME}}", pkgName);

	const gitignoreTemplate = readFileSync(
		path.join(templateDir, "gitignore"),
		"utf8",
	);

	const readmeTemplate = readFileSync(
		path.join(templateDir, "README.md"),
		"utf8",
	);
	const generatedReadme = readmeTemplate.replace("{{NAME}}", pkgName);

	writeFileSync(
		path.join(projectDir, "package.json"),
		generatedPkgJson,
		"utf8",
	);
	writeFileSync(
		path.join(projectDir, ".gitignore"),
		gitignoreTemplate,
		"utf8",
	);
	writeFileSync(path.join(projectDir, "README.md"), generatedReadme, "utf8");

	if (chosenTarget === "both" || chosenTarget === "chrome") {
		createStylesheetFile(projectDir, "userChrome.css", "userChrome.css");
	}

	if (chosenTarget === "both" || chosenTarget === "content") {
		createStylesheetFile(projectDir, "userContent.css", "userContent.css");
	}

	if (isInteractive) {
		const nextSteps = isCurrentDir
			? "npm install\n  npm run start"
			: `cd ${chosenThemeName}\n  npm install\n  npm run start`;
		outro(
			`Scaffolded ${pkgName} successfully.\n\nNext steps:\n  ${nextSteps}`,
		);
		return;
	}

	log.success(`Scaffolded ${pkgName} successfully in ${projectDir}`);
}
