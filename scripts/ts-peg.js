import fs from 'fs';
import pegjs from 'pegjs';
import tspegjs from 'ts-pegjs';

const [inputPath, outputPath] = process.argv.slice(2);
const sourceCode = fs.readFileSync(inputPath).toString();
const outputCode = pegjs.generate(sourceCode, {
	output: 'source',
	plugins: [
		tspegjs,
	],
	tspegjs: {
		customHeader: `
		import {
			NodeTypes,
			Identifier,
			TagName,
			Attribute,
			Directive,
			ClassName,
			Not,
			Is,
			Empty,
			Contains,
			NthChild,
			NthLastChild,
			Query,
			Compound,
		} from './interfaces';
		`,
	},
	returnTypes: {
		String: 'string',
		Identifier: 'Identifier',
		TagName: 'TagName',
		Attribute: 'Attribute',
		Directive: 'Directive',
		ClassName: 'ClassName',
		Contains: 'Contains',
		Not: 'Not',
		Is: 'Is',
		Empty: 'Empty',
		NthChild: 'NthChild',
		NthLastChild: 'NthLastChild',
		Sequence: 'Query | Compound',
	},
});

fs.writeFileSync(outputPath, outputCode);
