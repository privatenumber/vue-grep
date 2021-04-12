import { RootNode } from '@vue/compiler-core';
import { isElement } from 'vue-ast-utils';
import { Query } from '../query-parser/interfaces';
import { traverseQueryTree } from './traverse-query-tree';
import { getChildren } from './utils';
import { QueryMatch } from './interfaces';

function selector(
	vueAstRootNode: RootNode,
	queryNode: Query,
): QueryMatch[] {
	const rootTemplateNode = vueAstRootNode.children
		.filter(isElement)
		.find(node => (node.tag === 'template'));

	if (!rootTemplateNode) {
		return [];
	}

	return traverseQueryTree(getChildren(rootTemplateNode), queryNode);
}

export default selector;
