import { Builder, By, type WebDriver } from "selenium-webdriver";
import * as firefox from "selenium-webdriver/firefox.js";

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

export class FirefoxBrowserManager {
	private driverInstance: WebDriver | null = null;

	public async initialiseBrowser(
		binaryPath?: string,
		profileDirectory?: string,
	): Promise<void> {
		if (this.driverInstance) return;

		const firefoxOptions = new firefox.Options();
		firefoxOptions.addArguments("-remote-allow-system-access");
		firefoxOptions.setPreference("devtools.chrome.enabled", true);
		firefoxOptions.setPreference("devtools.debugger.remote-enabled", true);
		firefoxOptions.setPreference(
			"toolkit.legacyUserProfileCustomizations.stylesheets",
			true,
		);

		if (binaryPath) firefoxOptions.setBinary(binaryPath);
		if (profileDirectory) firefoxOptions.setProfile(profileDirectory);

		this.driverInstance = await new Builder()
			.forBrowser("firefox")
			.setFirefoxOptions(firefoxOptions)
			.build();

		await this.ensureChromeContext();
	}

	public async terminateBrowser(): Promise<void> {
		if (!this.driverInstance) return;

		await this.driverInstance.quit();
		this.driverInstance = null;
	}

	public async ensureChromeContext(): Promise<void> {
		if (!this.driverInstance) {
			throw new Error("Firefox driver instance is not initialised.");
		}
		await this.driverInstance.setContext("chrome");
	}

	public async executeChromeScript<T>(
		script: string | Function,
		...argumentsList: unknown[]
	): Promise<T> {
		await this.ensureChromeContext();
		return (await this.driverInstance!.executeScript(
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

	public async injectUserInterfaceStyle(
		cascadingStyleSheetContent: string,
		styleIdentifier: string = "mcp-injected-style",
	): Promise<{ success: boolean; identifier: string }> {
		await this.ensureChromeContext();

		return await this.executeChromeScript<{
			identifier: string;
			success: boolean;
		}>(
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
	): Promise<{ removed: boolean; identifier: string }> {
		await this.ensureChromeContext();

		return await this.executeChromeScript<{
			identifier: string;
			removed: boolean;
		}>((identifier: string) => {
			const targetStyleElement = document.getElementById(identifier);
			if (targetStyleElement) {
				targetStyleElement.remove();
				return { removed: true, identifier: identifier };
			}
			return { removed: false, identifier: identifier };
		}, styleIdentifier);
	}

	public async captureScreenshot(
		targetSelector?: string,
	): Promise<{ base64Image: string; format: string }> {
		await this.ensureChromeContext();

		if (targetSelector) {
			const targetWebElement = await this.driverInstance!.findElement(
				By.css(targetSelector),
			);
			const elementScreenshotBase64 =
				await targetWebElement.takeScreenshot();
			return { base64Image: elementScreenshotBase64, format: "png" };
		}

		const fullWindowScreenshotBase64 =
			await this.driverInstance!.takeScreenshot();
		return { base64Image: fullWindowScreenshotBase64, format: "png" };
	}
}

export const globalFirefoxManager = new FirefoxBrowserManager();
