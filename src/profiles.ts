import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { FirefoxProfileInfo } from "./types.js";

/**
 * Discovers the platform-specific directory where Firefox configuration and
 * profiles are located.
 */
export function getFirefoxConfigurationDirectory(): string {
	if (process.platform === "darwin") {
		return path.join(
			os.homedir(),
			"Library",
			"Application Support",
			"Firefox",
		);
	}
	if (process.platform === "win32") {
		const applicationDataDirectory =
			process.env.APPDATA ||
			path.join(os.homedir(), "AppData", "Roaming");
		return path.join(applicationDataDirectory, "Mozilla", "Firefox");
	}
	return path.join(os.homedir(), ".mozilla", "firefox");
}

/**
 * Parses the Firefox profiles.ini configuration file to extract profile
 * records.
 */
export function listProfiles(
	customConfigurationDirectory?: string,
): FirefoxProfileInfo[] {
	const configurationDirectory =
		customConfigurationDirectory || getFirefoxConfigurationDirectory();
	const profilesIniPath = path.join(configurationDirectory, "profiles.ini");

	if (!existsSync(profilesIniPath)) return [];

	const fileContent = readFileSync(profilesIniPath, "utf8");
	const iniLines = fileContent.split(/\r?\n/);
	const profileRecords: FirefoxProfileInfo[] = [];

	let currentSection: string | null = null;
	let currentProfileData: Partial<FirefoxProfileInfo> = {};

	const pushProfileRecord = (): void => {
		if (
			currentSection?.toLowerCase().startsWith("profile") &&
			currentProfileData.name &&
			currentProfileData.path
		) {
			const isRelative = currentProfileData.isRelative ?? true;
			profileRecords.push({
				name: currentProfileData.name,
				path: isRelative
					? path.resolve(
							configurationDirectory,
							currentProfileData.path,
						)
					: currentProfileData.path,
				isRelative: isRelative,
				isDefault: Boolean(currentProfileData.isDefault),
			});
		}
	};

	for (const line of iniLines) {
		const trimmedLine = line.trim();
		if (trimmedLine.startsWith("[") && trimmedLine.endsWith("]")) {
			pushProfileRecord();
			currentSection = trimmedLine.slice(1, -1);
			currentProfileData = {};
			continue;
		}

		const equalsIndex = trimmedLine.indexOf("=");
		if (equalsIndex === -1) continue;

		const key = trimmedLine.slice(0, equalsIndex).trim();
		const value = trimmedLine.slice(equalsIndex + 1).trim();

		if (key === "Name") currentProfileData.name = value;
		if (key === "Path") currentProfileData.path = value;
		if (key === "IsRelative") currentProfileData.isRelative = value === "1";
		if (key === "Default") currentProfileData.isDefault = value === "1";
	}

	pushProfileRecord();
	return profileRecords;
}

/** Resolves a registered Firefox profile name to its filesystem directory path. */
export function resolveProfileDirectoryByName(profileName: string): string {
	const profiles = listProfiles();
	const matchedProfile = profiles.find(
		(profile) => profile.name === profileName,
	);
	if (!matchedProfile) {
		const availableProfileNames = profiles
			.map((profile) => profile.name)
			.join(", ");
		throw new Error(
			`Profile "${profileName}" not found. Available profiles: ${availableProfileNames || "none"}`,
		);
	}
	return matchedProfile.path;
}
