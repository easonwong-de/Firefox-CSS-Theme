import { Builder, By, type WebDriver } from "selenium-webdriver";
import * as firefox from "selenium-webdriver/firefox.js";
import { getProfileDir } from "./profiles.js";
import { styleRegistry } from "./registry.js";
import type {} from "./selenium-webdriver.d.ts";
import type {
	BrowserToolboxLauncherModule,
	BrowserToolboxResult,
	FirefoxCommandElement,
	InjectedStyleDetails,
	ScreenshotResult,
	StyleInjectionResult,
	StyleRemovalResult,
	StyleTarget,
	ToolbarCustomisationAction,
	ToolbarCustomisationResult,
	UiElementDetails,
	UiNodeHierarchy,
} from "./types.js";

export class FirefoxManager {
	private driver: WebDriver | null = null;

	/**
	 * Launches and initialises a Firefox instance with marionette chrome
	 * debugging capabilities enabled.
	 */
	public async initialiseBrowser(
		binaryPath?: string,
		profileName?: string,
		headless?: boolean,
		novaUi?: boolean,
	): Promise<void> {
		if (this.driver) return;

		const isNovaUiEnabled = novaUi ?? process.argv.includes("--nova-ui");
		const isHeadlessEnabled =
			headless ?? process.argv.includes("--headless");

		const options = new firefox.Options();
		options.addArguments("-no-remote", "-new-instance");
		if (isHeadlessEnabled) options.addArguments("-headless");

		options
			.setPreference("devtools.chrome.enabled", true)
			.setPreference("devtools.debugger.remote-enabled", true)
			.setPreference("devtools.debugger.prompt-connection", false)
			.setPreference(
				"toolkit.legacyUserProfileCustomizations.stylesheets",
				true,
			)
			.setPreference("marionette.allow-system-access", true)
			.setPreference("remote.allow-system-access", true)
			.setPreference("browser.nova.enabled", isNovaUiEnabled)
			.setPreference(
				"browser.newtabpage.activity-stream.nova.enabled",
				isNovaUiEnabled,
			);

		if (binaryPath) options.setBinary(binaryPath);
		if (profileName) {
			const profileDirectory = getProfileDir(profileName);
			options.setProfile(profileDirectory);
		}

		const service = new firefox.ServiceBuilder()
			.enableVerboseLogging(true)
			.addArguments("--allow-system-access");

		try {
			this.driver = await new Builder()
				.forBrowser("firefox")
				.setFirefoxOptions(options)
				.setFirefoxService(service)
				.build();

			await this.ensureChromeContext();
			if (!isHeadlessEnabled) {
				await this.openBrowserToolbox().catch(() => {});
			}
		} catch (error) {
			if (this.driver) {
				await this.driver.quit().catch(() => {});
				this.driver = null;
			}
			throw error;
		}
	}

	/** Terminates the active Firefox browser session and cleans up resources. */
	public async terminateBrowser(): Promise<void> {
		if (!this.driver) return;
		const activeDriver = this.driver;
		this.driver = null;
		await activeDriver.quit().catch(() => {});
	}

	/** Awaits the closure of all Firefox browser windows. */
	public async waitForWindowClose(): Promise<void> {
		if (!this.driver) return;

		try {
			await this.driver.wait(async () => {
				const windowHandles = await this.driver!.getAllWindowHandles();
				return windowHandles.length === 0;
			});
		} catch {
			return;
		}
	}

	/** Ensures that the WebDriver context is set to the Firefox chrome scope. */
	public async ensureChromeContext(): Promise<void> {
		if (!this.driver) {
			throw new Error("Firefox driver instance is not initialised.");
		}
		await this.driver.setContext("chrome");
	}

	/**
	 * Executes a synchronous or asynchronous JavaScript function or snippet in
	 * the Firefox chrome context.
	 */
	public async executeChromeScript<T>(
		script: string | ((...argumentsList: any[]) => T | Promise<T>),
		...argumentsList: unknown[]
	): Promise<T> {
		await this.ensureChromeContext();
		return (await this.driver!.executeScript(
			script,
			...argumentsList,
		)) as T;
	}

	/** Queries and extracts details for DOM elements matching a CSS selector. */
	public async queryElements(selector: string): Promise<UiElementDetails[]> {
		await this.ensureChromeContext();

		return this.executeChromeScript<UiElementDetails[]>(
			(querySelector: string) =>
				Array.from(
					document.querySelectorAll(querySelector),
					(element) => ({
						tagName: element.tagName.toLowerCase(),
						id: element.id || "",
						className: element.className || "",
						childCount: element.children.length,
						textContent: (element.textContent || "")
							.trim()
							.slice(0, 100),
						attributes: Object.fromEntries(
							Array.from(element.attributes, (attribute) => [
								attribute.name,
								attribute.value,
							]),
						),
					}),
				),
			selector,
		);
	}

	/** Retrieves computed CSS property declarations for a targeted UI element. */
	public async getComputedStyles(
		selector: string,
		stylePropertyNames?: string[],
	): Promise<Record<string, string>> {
		await this.ensureChromeContext();

		return this.executeChromeScript<Record<string, string>>(
			(targetSelector: string, requestedProperties?: string[]) => {
				const targetElement = document.querySelector(targetSelector);
				if (!targetElement) {
					throw new Error(
						"Element not found for selector: " + targetSelector,
					);
				}
				const computedStyleDeclaration =
					window.getComputedStyle(targetElement);
				const propertyNames =
					requestedProperties && requestedProperties.length > 0
						? requestedProperties
						: Array.from(computedStyleDeclaration);
				const styleResult: Record<string, string> = {};

				for (const propertyName of propertyNames) {
					styleResult[propertyName] =
						computedStyleDeclaration.getPropertyValue(propertyName);
				}

				return styleResult;
			},
			selector,
			stylePropertyNames,
		);
	}

	/**
	 * Traverses and returns the UI element node hierarchy up to a maximum
	 * depth.
	 */
	public async getUiTree(
		rootSelector: string = "window",
		maxDepth: number = 3,
	): Promise<UiNodeHierarchy> {
		await this.ensureChromeContext();

		return this.executeChromeScript<UiNodeHierarchy>(
			(targetSelector: string, maximumTraversalDepth: number) => {
				const rootTarget =
					targetSelector === "window"
						? document.documentElement
						: document.querySelector(targetSelector);

				if (!rootTarget) {
					throw new Error(
						"Root element not found for selector: " +
							targetSelector,
					);
				}

				const rootNodeHierarchy: UiNodeHierarchy = {
					tagName: rootTarget.tagName.toLowerCase(),
					id: rootTarget.id || "",
					className: rootTarget.className || "",
					attributes: Object.fromEntries(
						Array.from(rootTarget.attributes, (attribute) => [
							attribute.name,
							attribute.value,
						]),
					),
					children: [],
				};

				const nodeQueue: Array<{
					domNode: Element;
					hierarchyNode: UiNodeHierarchy;
					currentDepth: number;
				}> = [
					{
						domNode: rootTarget,
						hierarchyNode: rootNodeHierarchy,
						currentDepth: 0,
					},
				];

				while (nodeQueue.length > 0) {
					const queueItem = nodeQueue.shift();
					if (
						!queueItem ||
						queueItem.currentDepth >= maximumTraversalDepth
					) {
						continue;
					}

					for (const childElement of Array.from(
						queueItem.domNode.children,
					)) {
						const childHierarchyNode: UiNodeHierarchy = {
							tagName: childElement.tagName.toLowerCase(),
							id: childElement.id || "",
							className: childElement.className || "",
							attributes: Object.fromEntries(
								Array.from(
									childElement.attributes,
									(attribute) => [
										attribute.name,
										attribute.value,
									],
								),
							),
							children: [],
						};

						queueItem.hierarchyNode.children.push(
							childHierarchyNode,
						);
						nodeQueue.push({
							domNode: childElement,
							hierarchyNode: childHierarchyNode,
							currentDepth: queueItem.currentDepth + 1,
						});
					}
				}

				return rootNodeHierarchy;
			},
			rootSelector,
			maxDepth,
		);
	}

	/** Enters or exits Firefox toolbar customisation mode in the browser window. */
	public async customiseToolbar(
		action: ToolbarCustomisationAction = "enter",
	): Promise<ToolbarCustomisationResult> {
		await this.ensureChromeContext();

		return this.executeChromeScript<ToolbarCustomisationResult>(
			async (requestedAction: ToolbarCustomisationAction) => {
				const customizeMode = window.gCustomizeMode;
				const documentElement = document.documentElement;

				if (!customizeMode) {
					const customizeCommand = document.getElementById(
						"cmd_CustomizeToolbars",
					) as FirefoxCommandElement | null;
					if (customizeCommand) {
						customizeCommand.doCommand();
						return {
							isCustomising:
								documentElement.hasAttribute("customizing"),
							success: true,
						};
					}
					throw new Error(
						"Customise toolbar mode is not available in the current context.",
					);
				}

				const isCurrentlyCustomising =
					documentElement.hasAttribute("customizing") ||
					Boolean(customizeMode.visible);
				const shouldEnter = requestedAction === "enter";

				if (shouldEnter !== isCurrentlyCustomising) {
					const transitionEventName = shouldEnter
						? "customizationready"
						: "aftercustomization";

					await new Promise<void>((resolve) => {
						const timeout = setTimeout(resolve, 5000);
						window.addEventListener(
							transitionEventName,
							() => {
								clearTimeout(timeout);
								resolve();
							},
							{ once: true },
						);
						customizeMode[requestedAction]();
					});
				}

				return {
					isCustomising:
						documentElement.hasAttribute("customizing") ||
						Boolean(customizeMode.visible),
					success: true,
				};
			},
			action,
		);
	}

	/** Alias for initialise or manage Firefox toolbar customisation mode. */
	public async customizeToolbar(
		action: ToolbarCustomisationAction = "enter",
	): Promise<ToolbarCustomisationResult> {
		return this.customiseToolbar(action);
	}

	/** Injects a userChrome stylesheet into the browser UI document tree. */
	public async injectChromeStyle(
		css: string,
		id: string = "mcp-injected-style",
		srcPath?: string,
	): Promise<StyleInjectionResult> {
		await this.ensureChromeContext();

		const result = await this.executeChromeScript<StyleInjectionResult>(
			(id: string, cssSource: string) => {
				let existingStyleElement = document.getElementById(id);
				if (!existingStyleElement) {
					existingStyleElement = document.createElement("style");
					existingStyleElement.id = id;
					existingStyleElement.setAttribute("type", "text/css");
					document.documentElement.appendChild(existingStyleElement);
				}

				existingStyleElement.textContent = cssSource;
				return { id, success: true };
			},
			id,
			css,
		);

		styleRegistry.register(id, srcPath, "chrome");
		return result;
	}

	/**
	 * Registers and injects a userContent stylesheet via the Firefox Style
	 * Sheet Service.
	 */
	public async injectContentStyle(
		css: string,
		id: string = "mcp-injected-content-style",
		srcPath?: string,
	): Promise<StyleInjectionResult> {
		await this.ensureChromeContext();

		const result = await this.executeChromeScript<StyleInjectionResult>(
			(id: string, cssSource: string) => {
				const win = window as any;
				win.__injectedContentSheets =
					win.__injectedContentSheets || new Map<string, string>();
				const prevUriStr = win.__injectedContentSheets.get(id);

				const sss = (globalThis as any).Cc[
					"@mozilla.org/content/style-sheet-service;1"
				].getService((globalThis as any).Ci.nsIStyleSheetService);
				const ioService = (globalThis as any).Cc[
					"@mozilla.org/network/io-service;1"
				].getService((globalThis as any).Ci.nsIIOService);

				if (prevUriStr) {
					try {
						const prevUri = ioService.newURI(prevUriStr);
						if (sss.sheetRegistered(prevUri, sss.USER_SHEET)) {
							sss.unregisterSheet(prevUri, sss.USER_SHEET);
						}
					} catch {}
				}

				const newUriStr =
					"data:text/css;charset=utf-8," +
					encodeURIComponent(cssSource);
				const newUri = ioService.newURI(newUriStr);
				if (!sss.sheetRegistered(newUri, sss.USER_SHEET)) {
					sss.loadAndRegisterSheet(newUri, sss.USER_SHEET);
				}
				win.__injectedContentSheets.set(id, newUriStr);
				return { id, success: true };
			},
			id,
			css,
		);

		styleRegistry.register(id, srcPath, "content");
		return result;
	}

	/** Removes an injected userChrome stylesheet by its element identifier. */
	public async removeChromeStyle(id: string): Promise<StyleRemovalResult> {
		await this.ensureChromeContext();

		const result = await this.executeChromeScript<StyleRemovalResult>(
			(id: string) => {
				const targetStyleElement = document.getElementById(id);
				if (targetStyleElement) {
					targetStyleElement.remove();
					return { id, removed: true };
				}
				return { id, removed: false };
			},
			id,
		);

		styleRegistry.unregister(id);
		return result;
	}

	/**
	 * Unregisters an injected userContent stylesheet from the Firefox Style
	 * Sheet Service.
	 */
	public async removeContentStyle(id: string): Promise<StyleRemovalResult> {
		await this.ensureChromeContext();

		const result = await this.executeChromeScript<StyleRemovalResult>(
			(id: string) => {
				let removed = false;
				const win = window as any;
				if (win.__injectedContentSheets?.has(id)) {
					const uriStr = win.__injectedContentSheets.get(id);
					try {
						const sss = (globalThis as any).Cc[
							"@mozilla.org/content/style-sheet-service;1"
						].getService(
							(globalThis as any).Ci.nsIStyleSheetService,
						);
						const ioService = (globalThis as any).Cc[
							"@mozilla.org/network/io-service;1"
						].getService((globalThis as any).Ci.nsIIOService);
						const uri = ioService.newURI(uriStr);
						if (sss.sheetRegistered(uri, sss.USER_SHEET)) {
							sss.unregisterSheet(uri, sss.USER_SHEET);
						}
						removed = true;
					} catch {}
					win.__injectedContentSheets.delete(id);
				}

				return { id, removed };
			},
			id,
		);

		styleRegistry.unregister(id);
		return result;
	}

	/** Lists all active userChrome style elements injected in the DOM. */
	public async listChromeStyles(): Promise<InjectedStyleDetails[]> {
		await this.ensureChromeContext();

		const domStyles = await this.executeChromeScript<
			Array<{ id: string; length: number }>
		>(() =>
			Array.from(document.querySelectorAll("style[id]"), (element) => ({
				id: element.id,
				length: element.textContent ? element.textContent.length : 0,
			})),
		);

		return domStyles.map((item) => ({
			id: item.id,
			length: item.length,
			srcPath: styleRegistry.get(item.id)?.srcPath,
			target: "chrome" as StyleTarget,
		}));
	}

	/** Lists all active userContent style sheets registered in memory. */
	public async listContentStyles(): Promise<InjectedStyleDetails[]> {
		await this.ensureChromeContext();

		const contentStyles = await this.executeChromeScript<
			Array<{ id: string; length: number }>
		>(() => {
			const win = window as any;
			if (!win.__injectedContentSheets) return [];
			return Array.from(
				win.__injectedContentSheets.entries(),
				([id, uriStr]: [string, string]) => ({
					id,
					length: decodeURIComponent(
						uriStr.replace(/^data:text\/css;charset=utf-8,/, ""),
					).length,
				}),
			);
		});

		return contentStyles.map((item) => ({
			id: item.id,
			length: item.length,
			srcPath: styleRegistry.get(item.id)?.srcPath,
			target: "content" as StyleTarget,
		}));
	}

	/**
	 * Captures a base64-encoded PNG screenshot of the whole window or a target
	 * element.
	 */
	public async getScreenshot(
		targetSelector?: string,
	): Promise<ScreenshotResult> {
		await this.ensureChromeContext();

		const screenshotTarget = targetSelector
			? await this.driver!.findElement(By.css(targetSelector))
			: this.driver!;
		const base64Image = await screenshotTarget.takeScreenshot();
		return { base64Image, format: "png" };
	}

	/** Launches the Firefox Browser Toolbox developer tools window. */
	private async openBrowserToolbox(): Promise<BrowserToolboxResult> {
		await this.ensureChromeContext();

		return this.executeChromeScript<BrowserToolboxResult>(() => {
			try {
				const { BrowserToolboxLauncher } =
					ChromeUtils.importESModule<BrowserToolboxLauncherModule>(
						"resource://devtools/client/framework/browser-toolbox/Launcher.sys.mjs",
					);
				BrowserToolboxLauncher.init();
				return { success: true };
			} catch {
				return { success: false };
			}
		});
	}
}

export const firefoxManager = new FirefoxManager();
