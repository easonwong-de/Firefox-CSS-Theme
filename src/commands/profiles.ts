import { log } from "@clack/prompts";
import { listProfiles } from "../profiles.js";

/** Executes the 'profiles' CLI command to list all detected Firefox profiles. */
export async function profilesCommand(): Promise<void> {
	const profiles = listProfiles();
	if (profiles.length === 0) {
		log.warn(
			"No Firefox profiles detected in default configuration directory.",
		);
		return;
	}

	log.info("Detected Firefox Profiles:");
	for (const profile of profiles) {
		const defaultBadge = profile.isDefault ? " (default)" : "";
		log.message(`  ${profile.name}${defaultBadge}\n    ${profile.path}`);
	}
}
