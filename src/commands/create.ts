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

const templateDirectory = fileURLToPath(
	new URL("../../templates", import.meta.url),
);

/** Cancels the active prompt operation and terminates execution. */
function handleCancellation(value: unknown): void {
	if (!isCancel(value)) return;
	cancel("Operation cancelled.");
	process.exit(130);
}

/**
 * Scaffolds a starter stylesheet template file on disk if it does not already
 * exist or if forced.
 */
function createStylesheetFile(
	targetDirectory: string,
	relativeFilePath: string,
	templateFileName: string,
): void {
	const resolvedPath = path.resolve(targetDirectory, relativeFilePath);
	const parentDirectory = path.dirname(resolvedPath);
	if (!existsSync(parentDirectory)) {
		mkdirSync(parentDirectory, { recursive: true });
	}
	const templateContent = readFileSync(
		path.join(templateDirectory, templateFileName),
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

	const isCurrentDirectory = chosenThemeName === ".";
	const projectDirectory = isCurrentDirectory
		? process.cwd()
		: path.resolve(process.cwd(), chosenThemeName);
	const packageName = isCurrentDirectory
		? path.basename(projectDirectory)
		: chosenThemeName;

	let chosenTarget = options.target;
	if (!chosenTarget && isInteractive) {
		const stylesheetChoice = await select({
			message: "Which stylesheet(s) would you like to include?",
			options: [
				{
					value: "both",
					label: "Both userChrome.css and userContent.css",
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

	if (existsSync(projectDirectory)) {
		const existingEntries = readdirSync(projectDirectory);
		if (existingEntries.length > 0 && !options.force) {
			if (!isInteractive) {
				log.warn(
					`Directory "${chosenThemeName}" is not empty. Use --force to overwrite.`,
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
		mkdirSync(projectDirectory, { recursive: true });
	}

	const packageJson = JSON.parse(
		readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
	) as { version?: string };
	const dependencyVersion = packageJson.version
		? `^${packageJson.version}`
		: "^0.2.6";

	const packageJsonTemplate = readFileSync(
		path.join(templateDirectory, "package.json"),
		"utf8",
	);
	const generatedPackageJson = packageJsonTemplate
		.replace("{{NAME}}", packageName)
		.replace("{{VERSION}}", dependencyVersion);

	const gitignoreTemplate = readFileSync(
		path.join(templateDirectory, "gitignore"),
		"utf8",
	);

	const readmeTemplate = readFileSync(
		path.join(templateDirectory, "README.md"),
		"utf8",
	);
	const generatedReadme = readmeTemplate.replace("{{NAME}}", packageName);

	writeFileSync(
		path.join(projectDirectory, "package.json"),
		generatedPackageJson,
		"utf8",
	);
	writeFileSync(
		path.join(projectDirectory, ".gitignore"),
		gitignoreTemplate,
		"utf8",
	);
	writeFileSync(
		path.join(projectDirectory, "README.md"),
		generatedReadme,
		"utf8",
	);

	if (chosenTarget === "both" || chosenTarget === "chrome") {
		createStylesheetFile(
			projectDirectory,
			"userChrome.css",
			"userChrome.css",
		);
	}

	if (chosenTarget === "both" || chosenTarget === "content") {
		createStylesheetFile(
			projectDirectory,
			"userContent.css",
			"userContent.css",
		);
	}

	if (isInteractive) {
		const nextSteps = isCurrentDirectory
			? "npm install\n  npm run start"
			: `cd ${chosenThemeName}\n  npm install\n  npm run start`;
		outro(
			`Scaffolded ${packageName} successfully.\n\nNext steps:\n  ${nextSteps}`,
		);
		return;
	}

	log.success(
		`Scaffolded ${packageName} successfully in ${projectDirectory}`,
	);
}
