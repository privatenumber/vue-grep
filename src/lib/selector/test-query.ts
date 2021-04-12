import {
	isStaticExp,
	isText,
	SourceLocation,
} from '@vue/compiler-core';
import {
	isElement,
	isAttribute,
	isDirective,
	isSimpleExpression,
} from 'vue-ast-utils';
import {
	Query,
	NodeTypes,
	TagName,
	ClassName,
	Attribute,
	Directive,
	Contains,
	Not,
	Is,
	NthChild,
	NthLastChild,
} from '../query-parser/interfaces';
import { isCompound } from '../query-parser';
import {
	ElementWithParent,
	QueryMatch,
	SourceRange,
} from './interfaces';
import {
	tryEval,
	includesAll,
} from './utils';

const applyOperator = (operator: string, condition: boolean) => (
	operator === '='
		? condition
		: !condition
);

const highlightNodeName = (node: ElementWithParent): SourceRange => ({
	start: {
		offset: node.loc.start.offset + 1,
	},
	end: {
		offset: node.loc.start.offset + 1 + node.tag.length,
	},
});

const highlightNodeCloseTag = (node: ElementWithParent): SourceRange => {
	if (node.isSelfClosing) {
		return {
			start: {
				offset: node.loc.end.offset - 2,
			},
			end: node.loc.end,
		};
	}
	const endTag = node.loc.source.match(/<\/.+>$/);
	return {
		start: {
			offset: node.loc.start.offset + endTag.index,
		},
		end: node.loc.end,
	};
};

type Matcher = (node: ElementWithParent, queryNode) => SourceRange[] | false;

type MatcherTypes
	= NodeTypes.TAG_NAME
	| NodeTypes.CLASS_NAME
	| NodeTypes.ATTRIBUTE
	| NodeTypes.DIRECTIVE
	| NodeTypes.EMPTY
	| NodeTypes.CONTAINS
	| NodeTypes.NTH_CHILD
	| NodeTypes.NTH_LAST_CHILD
	| NodeTypes.NOT
	| NodeTypes.IS;

type VueClassObject = {
	[key: string]: string;
}
type VueClassType = string | VueClassType[] | VueClassObject;

const createMatchers = (matchers: Record<MatcherTypes, Matcher>) => matchers;

function getAttributeNameLocation(sourceLocation: SourceLocation): SourceRange {
	const hasEqual = sourceLocation.source.indexOf('=');

	if (hasEqual === -1) {
		return sourceLocation;
	}

	return {
		...sourceLocation,
		end: {
			offset: sourceLocation.start.offset + hasEqual,
		},
	};
}

const matchers = createMatchers({
	[NodeTypes.TAG_NAME](node, queryNode: TagName) {
		if (
			queryNode.value !== '*'
			&& queryNode.value !== node.tag
		) {
			return false;
		}

		return [highlightNodeName(node)];
	},

	[NodeTypes.CLASS_NAME](node, queryNode: ClassName) {
		const targetClass = queryNode.name;
		const staticClassNode = node.props?.filter(isAttribute).find(prop => (prop.name === 'class'));

		if (staticClassNode) {
			const staticClasses = staticClassNode.value?.content.split(' ');
			if (staticClasses?.includes(targetClass)) {
				return [staticClassNode.loc];
			}
		}

		const dynamicClassNode = node.props?.filter(isDirective).find(prop => (
			prop.name === 'bind'
			&& prop.arg
			&& isStaticExp(prop.arg)
			&& prop.arg?.content === 'class'
		));

		if (
			dynamicClassNode
			&& isSimpleExpression(dynamicClassNode.exp)
		) {
			const parsedClassContent = tryEval(dynamicClassNode.exp?.content);

			if (parsedClassContent) {
				const queue: VueClassType = (
					Array.isArray(parsedClassContent)
						? parsedClassContent
						: [parsedClassContent]
				);
				while (queue.length > 0) {
					const classNode = queue.shift();
					if (
						typeof classNode === 'string'
						&& classNode.split(' ').includes(targetClass)
					) {
						return [dynamicClassNode.loc];
					}

					if (Array.isArray(classNode)) {
						queue.push(...classNode);
					} else if (typeof classNode === 'object') {
						for (const activeClass in classNode) {
							if (classNode[activeClass]) {
								queue.push(activeClass);
							}
						}
					}
				}
			}
		}

		return false;
	},

	[NodeTypes.ATTRIBUTE](node, queryNode: Attribute) {
		const attributeNode = node.props?.filter(isAttribute).find(
			prop => (queryNode.name === prop.name),
		);

		if (!attributeNode) {
			return false;
		}

		if (!queryNode.value) {
			return [getAttributeNameLocation(attributeNode.loc)];
		}

		if (queryNode.value.type === NodeTypes.LITERAL) {
			if (
				queryNode.operator === '='
				&& queryNode.value.value !== attributeNode.value.content
			) {
				return false;
			}
			if (
				queryNode.operator === '!='
				&& queryNode.value.value === attributeNode.value.content
			) {
				return false;
			}
		}

		if (queryNode.value.type === NodeTypes.REGEXP) {
			if (
				queryNode.operator === '='
				&& !queryNode.value.value.test(attributeNode.value.content)
			) {
				return false;
			}
			if (
				queryNode.operator === '!='
				&& queryNode.value.value.test(attributeNode.value.content)
			) {
				return false;
			}
		}

		return [attributeNode.loc];
	},

	[NodeTypes.DIRECTIVE](node, queryNode: Directive) {
		const directiveNodes = node.props?.filter(isDirective).filter(prop => (
			prop.name === queryNode.name
			&& (
				!queryNode.arg
				|| (
					isSimpleExpression(prop.arg)
					&& queryNode.arg.isStatic === prop.arg?.isStatic
					&& (
						!queryNode.arg.content
						|| (
							isSimpleExpression(prop.arg)
							&& prop.arg.content === queryNode.arg.content
						)
					)
				)
			)

			&& (
				!queryNode.modifiers
				|| includesAll(prop.modifiers, queryNode.modifiers)
			)

			&& (
				!queryNode.value
				|| (
					isSimpleExpression(prop.exp)
					&& (
						(
							queryNode.value.type === NodeTypes.LITERAL
							&& applyOperator(
								queryNode.operator,
								queryNode.value.value === prop.exp?.content,
							)
						)
						|| (
							queryNode.value.type === NodeTypes.REGEXP
							&& applyOperator(
								queryNode.operator,
								queryNode.value.value.test(prop.exp?.content),
							)
						)
					)
				)
			)
		));

		if (directiveNodes.length === 0) {
			return false;
		}

		return directiveNodes.map(directiveNode => (
			queryNode.value
				? directiveNode.loc
				: getAttributeNameLocation(directiveNode.loc)
		));
	},

	[NodeTypes.EMPTY](node) {
		if (node.children.length > 0) {
			return false;
		}

		return [highlightNodeCloseTag(node)];
	},

	[NodeTypes.IS](node, queryNode: Is) {
		const matched = queryNode.selectors.some(selector => testQuery(node, selector));
		if (!matched) {
			return false;
		}

		return [highlightNodeName(node)];
	},

	[NodeTypes.NOT](node, queryNode: Not) {
		const matched = queryNode.selectors.some(selector => testQuery(node, selector));
		if (matched) {
			return false;
		}

		return [highlightNodeName(node)];
	},

	[NodeTypes.CONTAINS](node, queryNode: Contains) {
		const searchString = queryNode.string;
		const found = node.children.filter(isText).find(textNode => (
			searchString.type === NodeTypes.LITERAL
				? textNode.loc.source === searchString.value
				: searchString.value.test(textNode.loc.source)
		));
		if (!found) {
			return false;
		}
		return [found.loc];
	},

	[NodeTypes.NTH_CHILD](node, queryNode: NthChild) {
		const nodeIndex = isElement(node.parent) && node.parent.children.indexOf(node);
		if ((nodeIndex + 1) !== queryNode.index.value) {
			return false;
		}

		return [highlightNodeName(node)];
	},

	[NodeTypes.NTH_LAST_CHILD](node, queryNode: NthLastChild) {
		const nodeIndex = (
			isElement(node.parent)
			&& (node.parent.children.length - node.parent.children.indexOf(node))
		);
		if (nodeIndex !== queryNode.index.value) {
			return false;
		}

		return [highlightNodeName(node)];
	},
});

export function testQuery(
	node: ElementWithParent,
	query: Query,
): (QueryMatch|false) {
	if (!isElement(node)) {
		return false;
	}

	const highlightSubnodes = [];
	const queue = [query];
	while (queue.length > 0) {
		const queryNode = queue.shift();
		const { type: queryNodeType } = queryNode;

		if (isCompound(queryNode)) {
			queue.push(...queryNode.selectors);
			continue;
		}

		const matcher = matchers[queryNodeType];
		if (!matcher) {
			console.log(`No matcher for "${queryNodeType}"`);
		}
		const matched = matcher(node, queryNode);
		if (!matched) {
			return false;
		}

		highlightSubnodes.push(...matched);
	}

	return {
		node,
		highlightSubnodes,
	};
}
