import cac from 'cac';
import globalyzer from 'globalyzer';
import globrex from 'globrex';
import { yellow } from 'colorette';
import queryParser from './lib/query-parser/index';
import { CliOptions } from './interfaces';
import walkAndSearch from './lib/walk-and-search';

const packageJson = require('../package.json'); // eslint-disable-line @typescript-eslint/no-var-requires

const cli = cac('vue-grep')
	.usage('<query> [path/glob ...]')
	.option(
		'-l, --files-with-matches',
		'Only print the paths with at least one match.',
	)
	.option(
		'-s, --show-children',
		'Show the children of matching elements. Defaults to being collapsed.',
	)
	.option(
		'--exclude-directory',
		'Directory names to exclude on non-glob searches. Default: node_modules, vendor, public, dist',
		{
			type: [String],
			default: [
				'node_modules',
				'vendor',
				'public',
				'dist',
			],
		},
	)
	.option(
		'--hidden',
		'Search hidden files and directories.',
	)
	.help()
	.version(packageJson.version)
	.example('$ vue-grep template[v-if]')
	.example('$ vue-grep slot[name=""]');

(async (argv) => {
	const options = argv.options as CliOptions;

	if (options.help || options.version) {
		process.exit(0);
	}

	const [
		queryString,
		...searchPaths
	] = argv.args;

	if (!queryString) {
		cli.outputHelp();
		return;
	}
	const query = queryParser(queryString);

	if (searchPaths.length === 0) {
		searchPaths.push(process.cwd());
	}

	for (const searchPath of searchPaths) {
		const globAnalysis = globalyzer(searchPath);

		if (globAnalysis.isGlob) {
			const { regex: globRegex } = globrex(globAnalysis.glob, {
				filepath: true,
				extended: true,
			});

			await walkAndSearch(globAnalysis.base, options, query, globRegex);
		} else {
			await walkAndSearch(searchPath, options, query);
		}
	}
})(cli.parse()).catch((error) => {
	console.log(yellow(`Error: ${error.message}`));
	process.exit(1);
});
