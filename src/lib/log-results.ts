import {
	magenta, green, redBright, yellow,
} from 'colorette';
import { RootNode } from '@vue/compiler-core';
import { CliOptions } from '../interfaces';
import { QueryMatch } from './selector/interfaces';

type StringReplacement = {
	start: number;
	end: number;
	content: string;
}

const isOverlapping = (r1: StringReplacement, r2: StringReplacement) => (
	(r2.start <= r1.start && r1.start <= r2.end)
	|| (r2.start <= r1.end && r1.end <= r2.end)
);

class SafeStringManipulator {
	#sourceCode: string;

	#queuedReplacements: StringReplacement[];

	constructor(sourceCode) {
		this.#sourceCode = sourceCode;
		this.#queuedReplacements = [];
	}

	replace(replacement: StringReplacement) {
		this.#queuedReplacements.push(replacement);
	}

	getNonCollidingReplacementQueue() {
		this.#queuedReplacements.sort((a, b) => b.start - a.start);
		const queuedReplacements: StringReplacement[] = [];

		for (const r1 of this.#queuedReplacements) {
			if (!queuedReplacements.some(r2 => isOverlapping(r1, r2))) {
				queuedReplacements.push(r1);
			}
		}
		return queuedReplacements;
	}

	toString(
		start: number,
		end: number,
	) {
		const queuedReplacements = this.getNonCollidingReplacementQueue();
		let sourceCode = this.#sourceCode;
		let offset = 0;
		for (const replace of queuedReplacements) {
			sourceCode = (
				sourceCode.slice(0, replace.start)
				+ replace.content
				+ sourceCode.slice(replace.end)
			);

			offset += replace.content.length - (replace.end - replace.start);
		}

		return sourceCode.slice(start, end + offset);
	}
}

const getStartOfLine = (
	sourceCode: string,
	beforeOffset: number,
) => sourceCode.slice(0, beforeOffset).lastIndexOf('\n') + 1;

export function logResults(
	options: CliOptions,
	filePath: string,
	results: QueryMatch[],
	vueAst: RootNode,
): void {
	console.log(magenta(filePath));

	if (options.filesWithMatches) {
		return;
	}

	const { source: sourceCode } = vueAst.loc;
	for (const result of results) {
		const fileSource = new SafeStringManipulator(sourceCode);
		const childrenStart = result.node.children[0]?.loc.start.offset;
		const childrenEnd = result.node.children[result.node.children.length - 1]?.loc.end.offset;
		let highlightsChild = false;

		for (const highlight of result.highlightSubnodes) {
			fileSource.replace({
				start: highlight.start.offset,
				end: highlight.end.offset,
				content: redBright(sourceCode.slice(highlight.start.offset, highlight.end.offset)),
			});

			if (childrenStart <= highlight.start.offset && highlight.start.offset <= childrenEnd) {
				highlightsChild = true;
			}
		}

		if (
			!options.showChildren
			&& result.node.children.length > 0
			&& !highlightsChild
		) {
			fileSource.replace({
				start: childrenStart,
				end: childrenEnd,
				content: '...',
			});
		}

		const { loc } = result.node;
		console.log(`${green(loc.start.line.toString())}:`);
		console.log(fileSource.toString(
			getStartOfLine(sourceCode, loc.start.offset),
			loc.end.offset,
		));
	}
}

export function logError(
	filePath: string,
	errorMessage: string,
): void {
	console.log(magenta(filePath));
	console.log(yellow(errorMessage), '\n');
}
