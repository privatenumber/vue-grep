import { parse } from './parser';
import {
	NodeTypes,
	Query,
	Compound,
	Combinator,
} from './interfaces';

function queryParser(queryString: string): Query {
	try {
		return parse(queryString);
	} catch {
		throw new Error(`Failed to parse query \`${queryString}\``);
	}
}

export const isCompound = (node: Query): node is Compound => node.type === NodeTypes.COMPOUND;

export const isRelational = (
	queryNode: Query,
): queryNode is Combinator => [
	NodeTypes.ADJACENT,
	NodeTypes.SIBLING,
	NodeTypes.CHILD,
	NodeTypes.DESCENDANT,
].includes(queryNode.type);

export default queryParser;
