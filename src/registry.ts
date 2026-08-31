import { createHash } from "node:crypto";
import type { StyleTarget } from "./types.js";

export const ROOT_USER_CHROME_ID = "root:userChrome";
export const ROOT_USER_CONTENT_ID = "root:userContent";

export class StyleRegistry {
	private styles: Map<
		string,
		{ registeredAt: Date; srcPath?: string; target: StyleTarget }
	> = new Map();

	/**
	 * Generates a deterministic short hash ID for a file path when no explicit
	 * ID is supplied.
	 */
	public generateIdForFile(srcPath: string): string {
		const hash = createHash("sha256")
			.update(srcPath, "utf8")
			.digest("hex")
			.slice(0, 8);
		return `id-${hash}`;
	}

	/** Registers or updates a style entry in the in-memory registry. */
	public register(
		id: string,
		srcPath?: string,
		target: StyleTarget = "chrome",
	): void {
		this.styles.set(id, {
			registeredAt: new Date(),
			srcPath: srcPath,
			target: target,
		});
	}

	/**
	 * Unregisters a style entry from the in-memory registry, returning whether
	 * it was found.
	 */
	public unregister(id: string): boolean {
		return this.styles.delete(id);
	}

	/** Retrieves metadata for a registered style. */
	public get(
		id: string,
	):
		| { registeredAt: Date; srcPath?: string; target: StyleTarget }
		| undefined {
		return this.styles.get(id);
	}

	/** Returns registered styles with optional target filtering. */
	public list(
		targetFilter?: StyleTarget,
	): Array<{
		id: string;
		registeredAt: Date;
		srcPath?: string;
		target: StyleTarget;
	}> {
		return Array.from(this.styles.entries())
			.filter(
				([, entry]) => !targetFilter || entry.target === targetFilter,
			)
			.map(([id, entry]) => ({
				id: id,
				registeredAt: entry.registeredAt,
				srcPath: entry.srcPath,
				target: entry.target,
			}));
	}
}

export const styleRegistry = new StyleRegistry();
