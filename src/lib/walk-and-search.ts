import assert from 'assert';
import fs from 'fs';
import fsExists from 'fs.promises.exists';
import { walkStream } from '@nodelib/fs.walk';
import { parse } from '@vue/compiler-dom';
import { CliOptions } from '../interfaces';
import searchVueAst from './selector';
import { logResults, logError } from './log-results';
import { Query } from './query-parser/interfaces';

/**
 * This shims the document for HTML sanitization in '@vue/compiler-dom':
 * https://github.com/vuejs/vue-next/blob/870f2a/packages/compiler-dom/src/decodeHtmlBrowser.ts#L6
 *
 * The browser version is imported instead of the Node.js version because it's in ESM
 * and dramatically lighter (lack of sanitization).
 *
 * I don't think we need sanitization for the purposes of grepping.
 */
// @ts-expect-error explained ^
global.document = {
	createElement() {
		let htmlContent;
		return {
			// eslint-disable-next-line accessor-pairs
			set innerHTML(value) {
				htmlContent = value;
			},
			get textContent() {
				return htmlContent;
			},
		};
	},
};

async function searchVueFile(
	options: CliOptions,
	filePath: string,
	query: Query,
) {
	const content = await fs.promises.readFile(filePath);
	let vueAst;
	try {
		vueAst = parse(content.toString());
	} catch (error) {
		logError(filePath, `Error parsing: ${error.message}`);
		console.log(error);
		return;
	}

	const results = searchVueAst(vueAst, query);
	if (results.length > 0) {
		logResults(options, filePath, results, vueAst);
	}
}

async function walkAndSearch(
	searchPath: string,
	options: CliOptions,
	query: Query,
	entryPattrn = /\.vue$/,
): Promise<void> {
	assert(await fsExists(searchPath), `Path not found "${searchPath}"`);

	const fileStat = await fs.promises.stat(searchPath);

	if (await fileStat.isFile()) {
		return await searchVueFile(options, searchPath, query);
	}

	return await new Promise<void>((resolve) => {
		const searches = [];
		walkStream(searchPath, {
			deepFilter: ({ name }) => (
				!options.excludeDirectory.includes(name)
				&& (
					options.hidden
					|| !name.startsWith('.')
				)
			),

			entryFilter: ({ path, name, dirent }) => (
				dirent.isFile()
				&& entryPattrn.test(path)
				&& (
					options.hidden
					|| !name.startsWith('.')
				)
			),
		})
			.on('data', (file) => {
				searches.push(
					searchVueFile(options, file.path, query),
				);
			})
			.on('end', async () => {
				await Promise.all(searches);
				resolve();
			});
	});
}

export default walkAndSearch;
