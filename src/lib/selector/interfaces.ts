import { ElementNode } from '@vue/compiler-core';

type SourcePosition = {
	offset: number;
}

export type SourceRange = {
	start: SourcePosition;
	end: SourcePosition;
}

export type ElementWithParent = ElementNode & {
	parent?: ElementWithParent;
};

export type QueryMatch = {
	node: ElementWithParent;
	highlightSubnodes: SourceRange[]; // rename to locations
}
