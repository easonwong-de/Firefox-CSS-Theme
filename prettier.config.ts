import { type Config } from "prettier";

const config: Config = {
	endOfLine: "lf",
	objectWrap: "collapse",
	plugins: ["prettier-plugin-jsdoc"],
	printWidth: 80,
	tabWidth: 4,
	useTabs: true,
};

export default config;
