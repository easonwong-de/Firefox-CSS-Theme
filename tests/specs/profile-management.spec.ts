import { describe, expect, test } from "bun:test";

import { getProfileDir, listProfiles } from "../../src/profiles.js";

describe("Firefox Profile Discovery and Name Resolution", () => {
	test("detects installed profiles and resolves profile directory", () => {
		const profiles = listProfiles();
		expect(Array.isArray(profiles)).toBe(true);

		if (profiles.length > 0) {
			const firstProfile = profiles[0];
			const resolvedPath = getProfileDir(firstProfile.name);
			expect(resolvedPath).toBe(firstProfile.path);
		}
	});
});
