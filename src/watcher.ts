import { existsSync } from "node:fs";
import path from "node:path";
import { type FSWatcher, watch } from "chokidar";

export type WatchEventType = "add" | "change" | "unlink";

export interface WatchedTarget {
	filePaths: string[];
	onChange: (
		eventType: WatchEventType,
		changedFilePath: string,
	) => Promise<void> | void;
}

export type WatchedCssTarget = WatchedTarget;

export class FileWatcher {
	private fileSystemWatcher: FSWatcher | null = null;
	private targets: Set<WatchedTarget> = new Set();
	private timers: Map<WatchedTarget, NodeJS.Timeout> = new Map();

	/** Registers a target with its file paths to be watched for changes. */
	public addTarget(target: WatchedTarget): void {
		this.targets.add(target);

		if (this.fileSystemWatcher) {
			for (const filePath of target.filePaths) {
				this.fileSystemWatcher.add(
					path.resolve(process.cwd(), filePath),
				);
			}
		}
	}

	/** Updates the list of file paths watched for a registered target. */
	public updateFilePaths(
		target: WatchedTarget,
		nextFilePaths: string[],
	): void {
		const previousAbsolutePaths = target.filePaths.map((filePath) =>
			path.resolve(process.cwd(), filePath),
		);
		const nextAbsolutePaths = nextFilePaths.map((filePath) =>
			path.resolve(process.cwd(), filePath),
		);

		target.filePaths = nextFilePaths;

		if (this.fileSystemWatcher) {
			for (const previousPath of previousAbsolutePaths) {
				if (!nextAbsolutePaths.includes(previousPath)) {
					this.fileSystemWatcher.unwatch(previousPath);
				}
			}
			for (const nextPath of nextAbsolutePaths) {
				if (!previousAbsolutePaths.includes(nextPath)) {
					this.fileSystemWatcher.add(nextPath);
				}
			}
		}
	}

	/** Removes a target from the active watch list. */
	public removeTarget(target: WatchedTarget): void {
		this.targets.delete(target);

		const debounceTimer = this.timers.get(target);
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			this.timers.delete(target);
		}

		if (this.fileSystemWatcher) {
			for (const filePath of target.filePaths) {
				this.fileSystemWatcher.unwatch(
					path.resolve(process.cwd(), filePath),
				);
			}
		}
	}

	/**
	 * Initialises the file watcher and begins monitoring all registered target
	 * file paths.
	 */
	public async start(): Promise<void> {
		if (this.fileSystemWatcher) return;

		const targetPaths: string[] = [];
		for (const target of this.targets) {
			for (const filePath of target.filePaths) {
				const absolutePath = path.resolve(process.cwd(), filePath);
				if (!targetPaths.includes(absolutePath)) {
					targetPaths.push(absolutePath);
				}
			}
		}

		this.fileSystemWatcher = watch(targetPaths, {
			awaitWriteFinish: { pollInterval: 50, stabilityThreshold: 100 },
			ignoreInitial: true,
			persistent: true,
		});

		this.fileSystemWatcher.on("change", (changedFilePath) => {
			this.handleFileChange("change", changedFilePath);
		});

		this.fileSystemWatcher.on("add", (addedFilePath) => {
			this.handleFileChange("add", addedFilePath);
		});

		this.fileSystemWatcher.on("unlink", (unlinkedFilePath) => {
			this.handleFileChange("unlink", unlinkedFilePath);
		});

		await new Promise<void>((resolve) => {
			this.fileSystemWatcher!.on("ready", () => resolve());
		});
	}

	/** Closes the file system watcher and cancels any pending debounce timers. */
	public async close(): Promise<void> {
		for (const timer of this.timers.values()) {
			clearTimeout(timer);
		}
		this.timers.clear();

		if (this.fileSystemWatcher) {
			await this.fileSystemWatcher.close();
			this.fileSystemWatcher = null;
		}
	}

	private handleFileChange(
		eventType: WatchEventType,
		changedFilePath: string,
	): void {
		const absoluteChangedPath = path.resolve(
			process.cwd(),
			changedFilePath,
		);

		for (const target of this.targets) {
			const targetAbsolutePaths = target.filePaths.map((filePath) =>
				path.resolve(process.cwd(), filePath),
			);

			const isMatch = targetAbsolutePaths.includes(absoluteChangedPath);

			if (isMatch) {
				const existingTimer = this.timers.get(target);
				if (existingTimer) clearTimeout(existingTimer);

				const newTimer = setTimeout(async () => {
					this.timers.delete(target);
					await target.onChange(eventType, absoluteChangedPath);
				}, 100);

				this.timers.set(target, newTimer);
			}
		}
	}
}

export const fileWatcher = new FileWatcher();
