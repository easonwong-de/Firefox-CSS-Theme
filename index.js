#!/usr/bin/env node

import { spawn } from "node:child_process";

console.warn(
	"\x1b[33m[DEPRECATED]\x1b[0m 'firefox-css-theme-mcp' has been renamed to 'firefox-css-theme'. " +
		"Please update your configuration to use 'npx -y firefox-css-theme mcp'.",
);

const arguments_ = ["mcp", ...process.argv.slice(2)];

const childProcess = spawn("firefox-css-theme", arguments_, {
	stdio: "inherit",
	shell: process.platform === "win32",
});

childProcess.on("error", (error) => {
	if (error && "code" in error && error.code === "ENOENT") {
		const fallbackProcess = spawn(
			"npx",
			["-y", "firefox-css-theme@latest", ...arguments_],
			{ stdio: "inherit", shell: process.platform === "win32" },
		);
		fallbackProcess.on("exit", (code, signal) => {
			if (signal) {
				process.kill(process.pid, signal);
			} else {
				process.exit(code ?? 0);
			}
		});
		return;
	}
	throw error;
});

childProcess.on("exit", (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
	} else {
		process.exit(code ?? 0);
	}
});
