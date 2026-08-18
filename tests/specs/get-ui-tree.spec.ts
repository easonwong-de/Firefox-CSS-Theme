import type { TestCase } from "../types.js";

export const testCase: TestCase = {
	name: "Get UI Tree",
	async run({ firefoxManager, results }) {
		const tree = await firefoxManager.getUserInterfaceTree("#nav-bar", 2);

		if (tree && typeof tree === "object") {
			results.pass("Retrieved UI tree root");
		} else {
			results.fail("Failed to retrieve UI tree", tree);
			return;
		}

		if (tree.id === "nav-bar" && tree.tagName === "toolbar") {
			results.pass("UI tree root matches target element");
		} else {
			results.fail("UI tree root mismatch", {
				id: tree.id,
				tagName: tree.tagName,
			});
		}

		if (Array.isArray(tree.children) && tree.children.length > 0) {
			results.pass(
				`UI tree hierarchy includes ${tree.children.length} child nodes`,
			);
		} else {
			results.fail("UI tree child nodes missing or empty");
		}
	},
};
