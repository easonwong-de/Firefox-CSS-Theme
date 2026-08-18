export interface UserInterfaceElementDetails {
	attributes: Record<string, string>;
	childCount: number;
	className: string;
	id: string;
	tagName: string;
	textContent: string;
}

export interface UserInterfaceNodeHierarchy {
	attributes: Record<string, string>;
	children: UserInterfaceNodeHierarchy[];
	className: string;
	id: string;
	tagName: string;
}

export type ToolbarCustomizationAction = "enter" | "exit";

export interface ToolbarCustomizationResult {
	isCustomizing: boolean;
	success: boolean;
}

export interface StyleInjectionResult {
	identifier: string;
	success: boolean;
}

export interface StyleRemovalResult {
	identifier: string;
	removed: boolean;
}

export interface ScreenshotCaptureResult {
	base64Image: string;
	format: string;
}

export interface BrowserToolboxResult {
	success: boolean;
}

export interface FirefoxCustomizeMode {
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

declare global {
	interface Window {
		gCustomizeMode?: FirefoxCustomizeMode;
	}

	const ChromeUtils: {
		importESModule<T = Record<string, unknown>>(uri: string): T;
	};
}
