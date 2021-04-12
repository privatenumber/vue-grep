/*
Fork of esquery
https://github.com/estools/esquery/blob/master/grammar.pegjs
*/

{
	// const NodeTypes = {
	// 	TAG_NAME: 'TAG_NAME',
	// 	CLASS_NAME: 'CLASS_NAME',
	// 	ATTRIBUTE: 'ATTRIBUTE',
	// 	DIRECTIVE: 'DIRECTIVE',
	// 	LITERAL: 'LITERAL',
	// 	REGEXP: 'REGEXP',
	// 	COMPOUND: 'COMPOUND',
	// 	CHILD: 'CHILD',
	// 	SIBLING: 'SIBLING',
	// 	ADJACENT: 'ADJACENT',
	// 	DESCENDANT: 'DESCENDANT',
	// 	TYPE: 'TYPE',
	// 	IS: 'IS',
	// 	NOT: 'NOT',
	// 	CONTAINS: 'CONTAINS',
	// 	EMPTY: 'EMPTY',
	// 	NTH_CHILD: 'NTH_CHILD',
	// 	NTH_LAST_CHILD: 'NTH_LAST_CHILD',
	// };

	function nth(n) {
		return {
			type: NodeTypes.NTH_CHILD,
			index: {
				type: NodeTypes.LITERAL,
				value: n,
			},
		};
	}

	function nthLast(n) {
		return {
			type: NodeTypes.NTH_LAST_CHILD,
			index: {
				type: NodeTypes.LITERAL,
				value: n,
			},
		};
	}

	function strUnescape(s) {
		return s.replace(/\\(.)/g, (match, ch) => {
			switch(ch) {
				case 'b': return '\b';
				case 'f': return '\f';
				case 'n': return '\n';
				case 'r': return '\r';
				case 't': return '\t';
				case 'v': return '\v';
				default: return ch;
			}
		});
	}
}

Start
	= _ ss:Selectors _ {
		return ss.length === 1 ? ss[0] : {
			type: NodeTypes.IS,
			selectors: ss,
		};
	}
	/ _ {
		return void 0;
	}

_ = " "*

BinaryOperator
	= _ ">" _ {
		return NodeTypes.CHILD;
	}
	/ _ "~" _ {
		return NodeTypes.SIBLING;
	}
	/ _ "+" _ {
		return NodeTypes.ADJACENT;
	}
	/ " " _ {
		return NodeTypes.DESCENDANT;
	}


EqualityOperator = not:"!"? "="  {
	return (not || '') + '=';
}

String
	= "\"" d:([^\\"] / a:"\\" b:. { return a + b; })* "\"" {
		return {
			type: NodeTypes.LITERAL,
			value: strUnescape(d.join('')),
		};
	}
	/ "'" d:([^\\'] / a:"\\" b:. { return a + b; })* "'" {
		return {
			type: NodeTypes.LITERAL,
			value: strUnescape(d.join('')),
		};
	}

Flags = [imsu]+

Regexp = "/" pattern:[^/]+ "/" flags:Flags? {
	return {
		type: NodeTypes.REGEXP,
		value: new RegExp(
			pattern.join(''),
			flags ? flags.join('') : '',
		),
	};
}

IdentifierName = i:[^ [\],():#!=><~+.]+ {
	return i.join('');
}

Identifier = "#" i:IdentifierName {
	return {
		type: NodeTypes.ATTRIBUTE,
		name: 'id',
		operator: '=',
		value: {
			type: NodeTypes.LITERAL,
			value: i,
		},
	};
}

TagName = i:IdentifierName {
	return {
		type: NodeTypes.TAG_NAME,
		value: i,
	};
}

ClassName = "." i:IdentifierName {
	return {
		type: NodeTypes.CLASS_NAME,
		name: i,
	};
}

DirectiveArgument
	= arg: IdentifierName {
		return {
			isStatic: true,
			content: arg,
		};
	}

	/ "[" _ arg: IdentifierName? _ "]" {
		return {
			isStatic: false,
			content: arg,
		};
	};

DirectiveNameArg
	= ':' arg:DirectiveArgument {
		return {
			type: NodeTypes.DIRECTIVE,
			name: 'bind',
			arg,
		};
	}
	/ '@' arg:DirectiveArgument {
		return {
			type: NodeTypes.DIRECTIVE,
			name: 'on',
			arg,
		};
	}
	/ '#' arg:DirectiveArgument {
		return {
			type: NodeTypes.DIRECTIVE,
			name: 'slot',
			arg,
		};
	}
	/ 'v-' name:IdentifierName arg:(':' DirectiveArgument)? {
		return {
			type: NodeTypes.DIRECTIVE,
			name,
			arg: arg?.[1],
		};
	}

Directive = directive:DirectiveNameArg modifiers:('.' IdentifierName)* {
	if (modifiers.length > 0) {
		directive.modifiers = modifiers.map(m => m[1]);
	}

	return directive;
}

AttributeName = name:IdentifierName {
	return {
		type: NodeTypes.ATTRIBUTE,
		name,
	};
}

AttributeSyntax
	= attributeName:(Directive / AttributeName) _ operator:EqualityOperator _ value:(String / Regexp) {
		return {
			...attributeName,
			operator,
			value,
		};
	}
	/ Directive
	/ AttributeName

Attribute = "[" _ attribute:AttributeSyntax _ "]" {
	return attribute;
}

Not = ":not(" _ selectors:Selectors _ ")" {
	return {
		type: NodeTypes.NOT,
		selectors,
	};
}

Is = ":is(" _ selectors:Selectors _ ")" {
	return {
		type: NodeTypes.IS,
		selectors,
	};
}

Empty = ":empty" {
	return {
		type: NodeTypes.EMPTY,
	};
}

Contains = ":contains(" _ string:(String / Regexp) _ ")" {
	return {
		type: NodeTypes.CONTAINS,
		string,
	};
}

FirstChild = ":first-child" {
	return nth(1);
}

LastChild = ":last-child" {
	return nthLast(1);
}

NthChild = ":nth-child(" _ n:[0-9]+ _ ")" {
	return nth(parseInt(n.join(''), 10));
}

NthLastChild = ":nth-last-child(" _ n:[0-9]+ _ ")" {
	return nthLast(parseInt(n.join(''), 10));
}

Atom
	= TagName
	/ Identifier
	/ ClassName
	/ Attribute
	/ Not
	/ Is
	/ Empty
	/ Contains
	/ FirstChild
	/ LastChild
	/ NthChild
	/ NthLastChild

Sequence = atoms:Atom+ {
	return (atoms.length === 1) ? atoms[0] : {
		type: NodeTypes.COMPOUND,
		selectors: atoms,
	};
}

Selector = sequence:Sequence operatorSequence:(BinaryOperator Sequence)* {
	return operatorSequence.reduce(
		(left, [type, right]) => ({ type, left, right }),
		sequence,
	);
}

Selectors = selector:Selector commaSelectors:(_ "," _ Selector)* {
	return [
		selector,
		...commaSelectors.map(([,,,selector]) => selector),
	];
}
