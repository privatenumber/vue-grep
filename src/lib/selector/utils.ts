import { ElementNode } from '@vue/compiler-core';
import { isElement } from 'vue-ast-utils';
import { ElementWithParent } from './interfaces';

export const includesAll = <T>(
	array: T[],
	elements: T[],
): boolean => elements.every(element => array.includes(element));

export function tryEval(classExpression: string): unknown | false {
	try {
		// It's evaluating user-facing code so safe to assume nothing malicious
		// Note: it's using "indirect eval" which doesn't access the local scope
		// eslint-disable-next-line no-eval
		return global.eval(`(${classExpression})`);
	} catch {
		return false;
	}
}

export const getChildren = (
	node: ElementNode,
): ElementWithParent[] => node.children
	.filter(isElement)
	.map((child) => {
		(child as ElementWithParent).parent = node;
		return child;
	});
