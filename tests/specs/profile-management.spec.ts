import {
	listFirefoxProfiles,
	resolveProfileDirectoryByName,
} from "../../src/profiles.js";
import type { TestCase } from "../types.js";

export const testCase: TestCase = {
	name: "Firefox Profile Discovery and Name Resolution",
	async run({ results }) {
		const profiles = listFirefoxProfiles();
		if (Array.isArray(profiles)) {
			results.pass("Detected installed Firefox profiles list");
		} else {
			results.fail("Failed to retrieve profiles list", profiles);
		}

		if (profiles.length > 0) {
			const firstProfile = profiles[0];
			const resolvedPath = resolveProfileDirectoryByName(
				firstProfile.name,
			);
			if (resolvedPath === firstProfile.path) {
				results.pass("Resolved profile path matches detected path");
			} else {
				results.fail("Profile path mismatch upon resolution", {
					expected: firstProfile.path,
					resolved: resolvedPath,
				});
			}
		} else {
			results.pass(
				"No system profiles present in environment (skipped lookup)",
			);
		}
	},
};
