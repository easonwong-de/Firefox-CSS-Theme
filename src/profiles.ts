import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { cancel, isCancel, select } from "@clack/prompts";
import type { ProfileInfo } from "./types.js";

/**
 * Discovers the platform-specific directory where Firefox configuration and
 * profiles are located.
 */
export function getConfigDir(): string {
	if (process.platform === "darwin") {
		return path.join(
			os.homedir(),
			"Library",
			"Application Support",
			"Firefox",
		);
	}
	if (process.platform === "win32") {
		const appDataDir =
			process.env.APPDATA ||
			path.join(os.homedir(), "AppData", "Roaming");
		return path.join(appDataDir, "Mozilla", "Firefox");
	}
	return path.join(os.homedir(), ".mozilla", "firefox");
}

/**
 * Parses the Firefox profiles.ini configuration file to extract profile
 * records.
 */
export function listProfiles(customConfigDir?: string): ProfileInfo[] {
	const configDir = customConfigDir || getConfigDir();
	const profilesIniPath = path.join(configDir, "profiles.ini");

	if (!existsSync(profilesIniPath)) return [];

	const fileContent = readFileSync(profilesIniPath, "utf8");
	const iniLines = fileContent.split(/\r?\n/);
	const profileRecords: ProfileInfo[] = [];

	let currentSection: string | null = null;
	let currentProfileData: Partial<ProfileInfo> = {};

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
					? path.resolve(configDir, currentProfileData.path)
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
export function getProfileDir(profileName: string): string {
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

export interface SelectProfileOptions {
	includeTemp?: boolean;
}

/**
 * Prompts the user to select a Firefox profile from a list using terminal arrow
 * keys and enter to confirm.
 */
export async function selectProfile(
	profiles: ProfileInfo[],
	options: SelectProfileOptions = {},
): Promise<string> {
	const availableProfiles: ProfileInfo[] = options.includeTemp
		? [
				{
					name: "temporary",
					path: "",
					isDefault: false,
					isRelative: false,
				},
				...profiles,
			]
		: profiles;

	if (availableProfiles.length === 0)
		throw new Error("No Firefox profile detected.");
	if (availableProfiles.length === 1) return availableProfiles[0].name;

	if (!process.stdin.isTTY || !process.stdout.isTTY) {
		if (options.includeTemp) return "temporary";
		const profileNames = profiles.map((profile) => profile.name).join(", ");
		throw new Error(
			`Multiple Firefox profiles detected (${profileNames}). Specify target profile with -p, --profile <name>.`,
		);
	}

	const initialValue = options.includeTemp
		? "temporary"
		: availableProfiles.find((profile) => profile.isDefault)?.name ||
			availableProfiles[0].name;

	const selected = await select({
		message: "Select Firefox profile:",
		options: availableProfiles.map((profile) => ({
			value: profile.name,
			label: profile.name,
			hint: profile.isDefault ? "default" : undefined,
		})),
		initialValue: initialValue,
	});

	if (isCancel(selected)) {
		cancel("Operation cancelled.");
		process.exit(130);
	}

	return selected as string;
}
