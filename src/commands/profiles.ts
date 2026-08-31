import { listFirefoxProfiles } from "../profiles.js";

/** Executes the 'profiles' CLI command to list all detected Firefox profiles. */
export async function profilesCommand(): Promise<void> {
	const profiles = listFirefoxProfiles();

	if (profiles.length === 0) {
		console.log(
			"No Firefox profiles detected in default configuration directory.",
		);
		return;
	}

	console.log("\nDetected Firefox Profiles:\n");
	for (const profile of profiles) {
		const defaultBadge = profile.isDefault
			? " \x1b[32m(default)\x1b[0m"
			: "";

		console.log(`  \x1b[1m${profile.name}\x1b[0m${defaultBadge}`);
		console.log(`    \x1b[90m${profile.path}\x1b[0m\n`);
	}
}
