import { parse } from '@vue/compiler-dom';
import searchVueAst from '../src/lib/selector';
import queryParser from '../src/lib/query-parser';
import { ElementWithParent } from '../src/lib/selector/interfaces';

export function searchVue(
	vueSourceString: string,
	queryString: string,
): ElementWithParent[] {
	const vueAst = parse(vueSourceString);
	const query = queryParser(queryString);
	return searchVueAst(vueAst, query).map(result => result.node);
}
