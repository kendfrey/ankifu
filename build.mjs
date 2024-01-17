import esbuild from "esbuild"
import IgnorePlugin from "esbuild-plugin-ignore"

await esbuild.build(
{
	entryPoints: ["./js/index.js"],
	bundle: true,
	sourcemap: true,
	sourcesContent: false,
	outfile: "./dist/index.js",
	plugins:
	[
		IgnorePlugin(
		[
			{ resourceRegExp: /^fs$/ },
			{ resourceRegExp: /^jschardet$/ },
			{ resourceRegExp: /^iconv-lite$/ },
		]),
	],
});