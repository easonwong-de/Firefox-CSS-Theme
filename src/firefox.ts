import { Builder, By, type WebDriver } from "selenium-webdriver";
import * as firefox from "selenium-webdriver/firefox.js";

import type {
	BrowserToolboxLauncherModule,
	BrowserToolboxResult,
	FirefoxCommandElement,
	ScreenshotCaptureResult,
	StyleInjectionResult,
	StyleRemovalResult,
	ToolbarCustomizationAction,
	ToolbarCustomizationResult,
	UserInterfaceElementDetails,
	UserInterfaceNodeHierarchy,
} from "./types.js";

export class FirefoxManager {
	private driver: WebDriver | null = null;

	public async initialiseBrowser(
		binaryPath?: string,
		profileDirectory?: string,
	): Promise<void> {
		if (this.driver) return;

		const isNovaUiEnabled = process.argv.includes("--nova-ui");

		const firefoxOptions = new firefox.Options();
		firefoxOptions.addArguments("-no-remote", "-new-instance");
		firefoxOptions.setPreference("devtools.chrome.enabled", true);
		firefoxOptions.setPreference("devtools.debugger.remote-enabled", true);
		firefoxOptions.setPreference(
			"devtools.debugger.prompt-connection",
			false,
		);
		firefoxOptions.setPreference(
			"toolkit.legacyUserProfileCustomizations.stylesheets",
			true,
		);
		firefoxOptions.setPreference("marionette.allow-system-access", true);
		firefoxOptions.setPreference("remote.allow-system-access", true);
		firefoxOptions.setPreference("browser.nova.enabled", isNovaUiEnabled);
		firefoxOptions.setPreference(
			"browser.newtabpage.activity-stream.nova.enabled",
			isNovaUiEnabled,
		);

		if (binaryPath) firefoxOptions.setBinary(binaryPath);
		if (profileDirectory) firefoxOptions.setProfile(profileDirectory);

		const firefoxService = new firefox.ServiceBuilder()
			.enableVerboseLogging(true)
			.addArguments("--allow-system-access");

		try {
			this.driver = await new Builder()
				.forBrowser("firefox")
				.setFirefoxOptions(firefoxOptions)
				.setFirefoxService(firefoxService)
				.build();

			await this.ensureChromeContext();
			await this.openBrowserToolbox().catch(() => {});
		} catch (error) {
			if (this.driver) {
				await this.driver.quit().catch(() => {});
				this.driver = null;
			}
			throw error;
		}
	}

	public async terminateBrowser(): Promise<void> {
		if (!this.driver) return;

		await this.driver.quit();
		this.driver = null;
	}

	public async ensureChromeContext(): Promise<void> {
		if (!this.driver) {
			throw new Error("Firefox driver instance is not initialised.");
		}
		await this.driver.setContext("chrome");
	}

	public async executeChromeScript<T>(
		script: string | Function,
		...argumentsList: unknown[]
	): Promise<T> {
		await this.ensureChromeContext();
		return (await this.driver!.executeScript(
			script,
			...argumentsList,
		)) as T;
	}

	public async queryElements(
		selector: string,
	): Promise<UserInterfaceElementDetails[]> {
		await this.ensureChromeContext();

		return await this.executeChromeScript<UserInterfaceElementDetails[]>(
			(querySelector: string) => {
				const matchedElements = Array.from(
					document.querySelectorAll(querySelector),
				);
				return matchedElements.map((element) => {
					const attributeMap: Record<string, string> = {};
					for (const attribute of Array.from(element.attributes)) {
						attributeMap[attribute.name] = attribute.value;
					}
					return {
						tagName: element.tagName.toLowerCase(),
						id: element.id || "",
						className: element.className || "",
						childCount: element.children.length,
						textContent: (element.textContent || "")
							.trim()
							.slice(0, 100),
						attributes: attributeMap,
					};
				});
			},
			selector,
		);
	}

	public async getComputedStyles(
		selector: string,
		stylePropertyNames?: string[],
	): Promise<Record<string, string>> {
		await this.ensureChromeContext();

		return await this.executeChromeScript<Record<string, string>>(
			(targetSelector: string, requestedProperties?: string[]) => {
				const targetElement = document.querySelector(targetSelector);
				if (!targetElement) {
					throw new Error(
						"Element not found for selector: " + targetSelector,
					);
				}
				const computedStyleDeclaration =
					window.getComputedStyle(targetElement);
				const styleResult: Record<string, string> = {};

				if (
					Array.isArray(requestedProperties) &&
					requestedProperties.length > 0
				) {
					for (const propertyName of requestedProperties) {
						styleResult[propertyName] =
							computedStyleDeclaration.getPropertyValue(
								propertyName,
							);
					}
				} else {
					for (
						let index = 0;
						index < computedStyleDeclaration.length;
						index++
					) {
						const propertyName = computedStyleDeclaration[index];
						styleResult[propertyName] =
							computedStyleDeclaration.getPropertyValue(
								propertyName,
							);
					}
				}

				return styleResult;
			},
			selector,
			stylePropertyNames,
		);
	}

	public async getUserInterfaceTree(
		rootSelector: string = "window",
		maximumDepth: number = 3,
	): Promise<UserInterfaceNodeHierarchy> {
		await this.ensureChromeContext();

		return await this.executeChromeScript<UserInterfaceNodeHierarchy>(
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

				function serializeNode(
					node: Element,
					currentDepth: number,
				): UserInterfaceNodeHierarchy {
					const attributeMap: Record<string, string> = {};
					for (const attribute of Array.from(node.attributes)) {
						attributeMap[attribute.name] = attribute.value;
					}

					const serializedChildren: UserInterfaceNodeHierarchy[] = [];
					if (currentDepth < maximumTraversalDepth) {
						for (const child of Array.from(node.children)) {
							serializedChildren.push(
								serializeNode(child, currentDepth + 1),
							);
						}
					}

					return {
						tagName: node.tagName.toLowerCase(),
						id: node.id || "",
						className: node.className || "",
						attributes: attributeMap,
						children: serializedChildren,
					};
				}

				return serializeNode(rootTarget, 0);
			},
			rootSelector,
			maximumDepth,
		);
	}

	public async customizeToolbar(
		action: ToolbarCustomizationAction = "enter",
	): Promise<ToolbarCustomizationResult> {
		await this.ensureChromeContext();

		return await this.executeChromeScript<ToolbarCustomizationResult>(
			async (requestedAction: ToolbarCustomizationAction) => {
				const customizeMode = window.gCustomizeMode;
				const documentElement = document.documentElement;

				if (!customizeMode) {
					const customizeCommand = document.getElementById(
						"cmd_CustomizeToolbars",
					) as FirefoxCommandElement | null;
					if (customizeCommand) {
						customizeCommand.doCommand();
						return {
							isCustomizing:
								documentElement.hasAttribute("customizing"),
							success: true,
						};
					}
					throw new Error(
						"Customize toolbar mode is not available in the current context.",
					);
				}

				const isCurrentlyCustomizing =
					documentElement.hasAttribute("customizing") ||
					Boolean(customizeMode.visible);
				const shouldEnter = requestedAction === "enter";

				if (shouldEnter !== isCurrentlyCustomizing) {
					const transitionEventName = shouldEnter
						? "customizationready"
						: "aftercustomization";

					await new Promise<void>((resolve) => {
						const timeoutIdentifier = setTimeout(resolve, 5000);
						const handleTransition = () => {
							clearTimeout(timeoutIdentifier);
							window.removeEventListener(
								transitionEventName,
								handleTransition,
							);
							resolve();
						};
						window.addEventListener(
							transitionEventName,
							handleTransition,
						);
						customizeMode[requestedAction]();
					});
				}

				return {
					isCustomizing:
						documentElement.hasAttribute("customizing") ||
						Boolean(customizeMode.visible),
					success: true,
				};
			},
			action,
		);
	}

	public async injectUserInterfaceStyle(
		cascadingStyleSheetContent: string,
		styleIdentifier: string = "mcp-injected-style",
	): Promise<StyleInjectionResult> {
		await this.ensureChromeContext();

		return await this.executeChromeScript<StyleInjectionResult>(
			(identifier: string, cssSource: string) => {
				let existingStyleElement = document.getElementById(identifier);
				if (!existingStyleElement) {
					existingStyleElement = document.createElement("style");
					existingStyleElement.id = identifier;
					existingStyleElement.setAttribute("type", "text/css");
					document.documentElement.appendChild(existingStyleElement);
				}

				existingStyleElement.textContent = cssSource;
				return { success: true, identifier: identifier };
			},
			styleIdentifier,
			cascadingStyleSheetContent,
		);
	}

	public async removeUserInterfaceStyle(
		styleIdentifier: string,
	): Promise<StyleRemovalResult> {
		await this.ensureChromeContext();

		return await this.executeChromeScript<StyleRemovalResult>(
			(identifier: string) => {
				const targetStyleElement = document.getElementById(identifier);
				if (targetStyleElement) {
					targetStyleElement.remove();
					return { removed: true, identifier: identifier };
				}
				return { removed: false, identifier: identifier };
			},
			styleIdentifier,
		);
	}

	public async captureScreenshot(
		targetSelector?: string,
	): Promise<ScreenshotCaptureResult> {
		await this.ensureChromeContext();

		if (targetSelector) {
			const targetWebElement = await this.driver!.findElement(
				By.css(targetSelector),
			);
			const elementScreenshotBase64 =
				await targetWebElement.takeScreenshot();
			return { base64Image: elementScreenshotBase64, format: "png" };
		}

		const fullWindowScreenshotBase64 = await this.driver!.takeScreenshot();
		return { base64Image: fullWindowScreenshotBase64, format: "png" };
	}

	private async openBrowserToolbox(): Promise<BrowserToolboxResult> {
		await this.ensureChromeContext();

		return await this.executeChromeScript<BrowserToolboxResult>(() => {
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
