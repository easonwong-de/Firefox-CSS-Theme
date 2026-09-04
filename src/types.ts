export interface UiElementDetails {
	attributes: Record<string, string>;
	childCount: number;
	className: string;
	id: string;
	tagName: string;
	textContent: string;
}

export interface UiNodeHierarchy {
	attributes: Record<string, string>;
	children: UiNodeHierarchy[];
	className: string;
	id: string;
	tagName: string;
}

export type ToolbarCustomisationAction = "enter" | "exit";

export interface ToolbarCustomisationResult {
	isCustomising: boolean;
	success: boolean;
}

export interface StyleInjectionResult {
	id: string;
	success: boolean;
}

export interface StyleRemovalResult {
	id: string;
	removed: boolean;
}

export interface ScreenshotResult {
	base64Image: string;
	format: string;
}

export interface BrowserToolboxResult {
	success: boolean;
}

export interface FirefoxCustomiseMode {
	enter(): void;
	exit(): void;
	visible?: boolean;
}

export interface FirefoxCommandElement extends HTMLElement {
	doCommand(): void;
}

export interface BrowserToolboxLauncherModule {
	BrowserToolboxLauncher: { init(): void };
}

export interface ProfileInfo {
	isDefault: boolean;
	isRelative: boolean;
	name: string;
	path: string;
}

export type StyleTarget = "chrome" | "content";

export interface InjectedStyleDetails {
	id: string;
	length: number;
	srcPath?: string;
	target: StyleTarget;
}

export interface CssCompilationResult {
	css: string;
	importedFiles: string[];
}

export type CreateStylesheetTarget = "both" | "chrome" | "content";

export interface CreateCommandOptions {
	force?: boolean;
	name?: string;
	target?: CreateStylesheetTarget;
}

export interface StartCommandOptions {
	binaryPath?: string;
	headless?: boolean;
	novaUi?: boolean;
	profileName?: string;
	watch?: boolean;
}

export interface InstallCommandOptions {
	force?: boolean;
	merge?: boolean;
	profileName?: string;
}

export interface McpCommandOptions {
	profileName?: string;
	binaryPath?: string;
	headless?: boolean;
	novaUi?: boolean;
}

declare global {
	interface Window {
		gCustomizeMode?: FirefoxCustomiseMode;
	}

	const ChromeUtils: {
		importESModule<T = Record<string, unknown>>(uri: string): T;
	};

	const Services: {
		io: { newURI(uri: string): any };
		styleSheetService: {
			AGENT_SHEET: number;
			AUTHOR_SHEET: number;
			USER_SHEET: number;
			loadAndRegisterSheet(uri: any, type: number): void;
			sheetRegistered(uri: any, type: number): boolean;
			unregisterSheet(uri: any, type: number): void;
		};
	};
}
