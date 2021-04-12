import { isElement } from 'vue-ast-utils';
import {
	Query,
	NodeTypes,
	CombinatorTypes,
} from '../query-parser/interfaces';
import { isRelational } from '../query-parser';
import { testQuery } from './test-query';
import {
	ElementWithParent,
	QueryMatch,
} from './interfaces';
import { getChildren } from './utils';

type RelationalOperation = (leftMatches: QueryMatch[], rightQuery: Query) => QueryMatch[];

const createRelationalOperations = (
	operations: Record<CombinatorTypes, RelationalOperation>,
) => operations;

const relationalQueryTypes = createRelationalOperations({
	[NodeTypes.ADJACENT](leftMatches, rightQuery) {
		const results: QueryMatch[] = [];
		for (const { node: leftNode } of leftMatches) {
			const leftNodeIndex = leftNode.parent.children.indexOf(leftNode);
			const adjacentNode = leftNode.parent.children[leftNodeIndex + 1];

			if (isElement(adjacentNode)) {
				const queryMatched = adjacentNode && testQuery(adjacentNode, rightQuery);

				if (queryMatched) {
					results.push(queryMatched);
				}
			}
		}
		return results;
	},

	[NodeTypes.SIBLING](leftMatches, rightQuery) {
		const results: QueryMatch[] = [];
		for (const { node: leftNode } of leftMatches) {
			const leftNodeIndex = leftNode.parent.children.indexOf(leftNode);

			for (const siblingNode of leftNode.parent.children.slice(leftNodeIndex + 1)) {
				if (isElement(siblingNode)) {
					const queryMatched = testQuery(siblingNode, rightQuery);
					if (queryMatched && !results.some(n => n.node === queryMatched.node)) {
						results.push(queryMatched);
					}
				}
			}
		}
		return results;
	},

	[NodeTypes.CHILD](leftMatches, rightQuery) {
		const results: QueryMatch[] = [];
		for (const { node: leftNode } of leftMatches) {
			for (const childNode of leftNode.children) {
				if (isElement(childNode)) {
					const queryMatched = testQuery(childNode, rightQuery);
					if (queryMatched && !results.some(n => n.node === queryMatched.node)) {
						results.push(queryMatched);
					}
				}
			}
		}
		return results;
	},

	[NodeTypes.DESCENDANT](leftMatches, rightQuery) {
		const results: QueryMatch[] = [];
		for (const { node: leftNode } of leftMatches) {
			const elementChildren = leftNode.children.filter(isElement);
			const rightMatches = traverseQueryTree(elementChildren, rightQuery);

			for (const match of rightMatches) {
				if (!results.some(n => n.node === match.node)) {
					results.push(match);
				}
			}
		}
		return results;
	},
});

function searchVueAst(
	elementNode: ElementWithParent | ElementWithParent[],
	queryNode: Query,
) {
	const results: QueryMatch[] = [];
	const queue = [...(Array.isArray(elementNode) ? elementNode : [elementNode])];
	while (queue.length > 0) {
		const node = queue.shift();
		const queryMatched = testQuery(node, queryNode);
		if (queryMatched) {
			results.push(queryMatched);
		}

		if (isElement(node)) {
			queue.push(...getChildren(node));
		}
	}

	return results;
}

export function traverseQueryTree(
	elementNode: ElementWithParent | ElementWithParent[],
	queryNode: Query,
): QueryMatch[] {
	if (isRelational(queryNode)) {
		const leftMatches = traverseQueryTree(elementNode, queryNode.left);
		const handler = relationalQueryTypes[queryNode.type];
		return handler(leftMatches, queryNode.right);
	}

	return searchVueAst(elementNode, queryNode);
}
