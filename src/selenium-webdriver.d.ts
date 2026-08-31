import "selenium-webdriver";

declare module "selenium-webdriver" {
	interface WebDriver {
		/**
		 * Changes target context for commands between chrome- and content
		 * (available with Firefox/GeckoDriver).
		 */
		setContext(context: "chrome" | "content" | string): Promise<void>;

		/**
		 * Gets the context that is currently in effect. Available when using
		 * Firefox/GeckoDriver.
		 */
		getContext?(): Promise<"chrome" | "content" | string>;
	}
}
