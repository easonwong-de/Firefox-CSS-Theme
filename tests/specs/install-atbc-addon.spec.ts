import { afterAll, describe, expect, test } from "bun:test";
import {
	ATBC_ADDON_ID,
	ATBC_DOWNLOAD_URL,
	installAtbcAddon,
} from "../../src/commands/start.js";
import { firefoxManager } from "../../src/firefox.js";

describe("Adaptive Tab Bar Colour Add-on Installation", () => {
	afterAll(async () => {
		await firefoxManager.uninstallAddon(ATBC_ADDON_ID).catch(() => {});
	});

	test("detects uninstalled add-on correctly", async () => {
		await firefoxManager.uninstallAddon(ATBC_ADDON_ID).catch(() => {});
		const isInstalled =
			await firefoxManager.isAddonInstalled(ATBC_ADDON_ID);
		expect(isInstalled).toBe(false);
	});

	test("installs ATBC add-on when not installed", async () => {
		await firefoxManager.uninstallAddon(ATBC_ADDON_ID).catch(() => {});
		await installAtbcAddon(ATBC_DOWNLOAD_URL);

		const isInstalled =
			await firefoxManager.isAddonInstalled(ATBC_ADDON_ID);
		expect(isInstalled).toBe(true);
	});

	test("skips installation if add-on is already installed", async () => {
		const isInstalled =
			await firefoxManager.isAddonInstalled(ATBC_ADDON_ID);
		if (!isInstalled) {
			await installAtbcAddon(ATBC_DOWNLOAD_URL);
		}

		await installAtbcAddon(ATBC_DOWNLOAD_URL);

		const isInstalledAfter =
			await firefoxManager.isAddonInstalled(ATBC_ADDON_ID);
		expect(isInstalledAfter).toBe(true);
	});

	test("warns and proceeds when add-on download or installation fails", async () => {
		await firefoxManager.uninstallAddon(ATBC_ADDON_ID).catch(() => {});

		await expect(
			installAtbcAddon(
				"https://addons.mozilla.org/invalid-404-addon.xpi",
			),
		).resolves.toBeUndefined();

		const isInstalled =
			await firefoxManager.isAddonInstalled(ATBC_ADDON_ID);
		expect(isInstalled).toBe(false);
	});

	test("registers --atbc CLI option on start command after headless", () => {
		const result = Bun.spawnSync(["bun", "src/cli.ts", "start", "--help"]);
		const output = result.stdout.toString();
		expect(output).toContain("--atbc");
		expect(output).not.toContain("-a, --atbc");
		expect(output).toContain("Install Adaptive Tab Bar Colour add-on");

		const headlessIndex = output.indexOf("--headless");
		const atbcIndex = output.indexOf("--atbc");
		const toolboxIndex = output.indexOf("--no-toolbox");

		expect(headlessIndex).toBeGreaterThan(-1);
		expect(atbcIndex).toBeGreaterThan(headlessIndex);
		expect(toolboxIndex).toBeGreaterThan(atbcIndex);
	});
});
