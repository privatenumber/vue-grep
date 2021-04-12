export enum NodeTypes {
	TAG_NAME,
	CLASS_NAME,
	ATTRIBUTE,
	DIRECTIVE,
	LITERAL,
	REGEXP,
	COMPOUND,

	// Combinators
	CHILD,
	SIBLING,
	ADJACENT,
	DESCENDANT,

	IS,
	NOT,
	CONTAINS,
	EMPTY,
	NTH_CHILD,
	NTH_LAST_CHILD,
}

export type CombinatorTypes
	= NodeTypes.ADJACENT
	| NodeTypes.SIBLING
	| NodeTypes.CHILD
	| NodeTypes.DESCENDANT;

interface QueryNode {
	type: NodeTypes;
}

interface AttributeStringValue {
	type: NodeTypes.LITERAL;
	value: string;
}
interface AttributeRegExpValue {
	type: NodeTypes.REGEXP;
	value: RegExp;
}
interface AttributeBase extends QueryNode {
	operator?: string;
	value?: AttributeStringValue | AttributeRegExpValue;
}
export interface Attribute extends AttributeBase {
	type: NodeTypes.ATTRIBUTE;
	name: string;
}

export interface Identifier extends Attribute {
	name: 'id';
}

interface DirectiveArgument {
	isStatic: boolean;
	content: string;
}
export interface Directive extends AttributeBase {
	type: NodeTypes.DIRECTIVE;
	name: string;
	arg?: DirectiveArgument;
	modifiers?: string[];
}
export interface TagName extends QueryNode {
	type: NodeTypes.TAG_NAME;
	value: string;
}
export interface ClassName extends QueryNode {
	type: NodeTypes.CLASS_NAME;
	name: string;
}
export interface Not extends QueryNode {
	type: NodeTypes.NOT;
	selectors: Query[];
}
export interface Is extends QueryNode {
	type: NodeTypes.IS;
	selectors: Query[];
}
export interface Empty extends QueryNode {
	type: NodeTypes.EMPTY;
	selectors: Query[];
}
export interface Contains extends QueryNode {
	type: NodeTypes.CONTAINS;
	string: AttributeStringValue | AttributeRegExpValue;
}

export interface NthChild extends QueryNode {
	type: NodeTypes.NTH_CHILD;
	index: {
		type: NodeTypes.LITERAL;
		value: number;
	};
}
export interface NthLastChild extends QueryNode {
	type: NodeTypes.NTH_LAST_CHILD;
	index: {
		type: NodeTypes.LITERAL;
		value: number;
	};
}
export interface Combinator {
	type: CombinatorTypes;
	left: Query;
	right: Query;
}

export interface Compound {
	type: NodeTypes.COMPOUND;
	selectors: Query[];
}

export type Query
	= TagName
	| Identifier
	| ClassName
	| Attribute
	| Directive
	| Not
	| Combinator
	| Empty
	| Contains
	| Compound;
