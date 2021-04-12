import { searchVue } from './utils';

describe('error cases', () => {
	test('no template', () => {
		const results = searchVue(`
		<script></script>
		`, '*');

		expect(results.length).toBe(0);
	});

	test('empty template', () => {
		const results = searchVue(`
		<template></template>
		`, '*');

		expect(results.length).toBe(0);
	});
});

describe('simple selector', () => {
	describe('universal selector', () => {
		test('"*"', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span>${seed}</span>
				</div>
			</template>
			`, '*');

			expect(results.length).toBe(2);
		});
	});

	describe('type selector', () => {
		test('tag: "span"', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span>${seed}</span>
				</div>
			</template>
			`, 'span');

			expect(results[0]).toMatchObject({
				children: [{ content: seed }],
			});
		});
	});

	describe('id selector', () => {
		test('id: "#some-id"', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span id="some-id">${seed}</span>
				</div>
			</template>
			`, '#some-id');

			expect(results[0]).toMatchObject({
				children: [{ content: seed }],
			});
		});
	});

	describe('attribute selector', () => {
		test('attribute: "[custom-attr]"', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span custom-attr="my title">${seed}</span>
				</div>
			</template>
			`, '[custom-attr]');

			expect(results[0]).toMatchObject({
				children: [{ content: seed }],
			});
		});

		test('attribute + value: "[title="my title"]"', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span title="my title">${seed}</span>
				</div>
			</template>
			`, '[title="my title"]');

			expect(results[0]).toMatchObject({
				children: [{ content: seed }],
			});
		});

		test('attribute + value (single-quotes and escape characters): "[title=\'my\\ttitle\']"', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span title="my\ttitle">${seed}</span>
				</div>
			</template>
			`, '[title=\'my\\ttitle\']');

			expect(results[0]).toMatchObject({
				children: [{ content: seed }],
			});
		});

		test('attribute + value: "[title="my title"]" - no match', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span title="my title">${seed}</span>
				</div>
			</template>
			`, '[title="different value"]');

			expect(results.length).toBe(0);
		});

		test('attribute + value: "[title!="my title"]" - negation - no match', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span title="my title">${seed}</span>
				</div>
			</template>
			`, '[title!="my title"]');

			expect(results.length).toBe(0);
		});

		test('attribute + white-space value: "span[title=" a b c "]"', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span title="a b c">No match</span>
					<span title=" a b c ">${seed}</span>
				</div>
			</template>
			`, 'span[title=" a b c "]');

			expect(results.length).toBe(1);
			expect(results[0]).toMatchObject({
				children: [{ content: seed }],
			});
		});

		test('attribute + regexp: "[title=/^starts with/]"', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span title="starts with this">${seed}</span>
				</div>
			</template>
			`, '[title=/^starts with/]');

			expect(results[0]).toMatchObject({
				children: [{ content: seed }],
			});
		});

		test('attribute + regexp: "[title!=/^starts with/]"', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span title="doesn't start with this">${seed}</span>
				</div>
			</template>
			`, '[title!=/^starts with/]');

			expect(results[0]).toMatchObject({
				children: [{ content: seed }],
			});
		});

		test('attribute + regexp: "[title=/^STARTS with/]" - flag (case sensitive) - no match', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span title="starts with this">${seed}</span>
				</div>
			</template>
			`, '[title=/^STARTS with/]');

			expect(results.length).toBe(0);
		});

		test('attribute + regexp: "[title=/^STARTS with/i]" - flag (case insensitive)', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span title="starts with this">${seed}</span>
				</div>
			</template>
			`, '[title=/^STARTS with/i]');

			expect(results[0]).toMatchObject({
				children: [{ content: seed }],
			});
		});
	});

	describe('directive selector', () => {
		describe('v-bind', () => {
			test('"[v-bind:some-prop]"', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span v-bind:some-prop="expression">${seed}</span>
					</div>
				</template>
				`, '[v-bind:some-prop]');

				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});

			test('"[v-bind:some-prop]" - match against shorthand', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span :some-prop="expression">${seed}</span>
					</div>
				</template>
				`, '[v-bind:some-prop]');

				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});

			test('name: "[v-bind]" on $attrs', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span v-bind="$attrs">${seed}</span>
					</div>
				</template>
				`, '[v-bind]');

				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});

			test('name + expression: "[v-bind="$attrs"]"', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span v-bind="$attrs">${seed}</span>
					</div>
				</template>
				`, '[v-bind="$attrs"]');

				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});

			test('name + expression: "[v-bind="$attrs"]" - no match', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span v-bind="{}">${seed}</span>
					</div>
				</template>
				`, '[v-bind="$attrs"]');

				expect(results.length).toBe(0);
			});

			test('argument: "[v-bind:propB="propValue"]"', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span v-bind:propA="propValue" v-bind:propB="propValue">${seed}</span>
					</div>
				</template>
				`, '[v-bind:propB="propValue"]');

				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});

			describe(':shorthand', () => {
				test('"[:some-prop]"', () => {
					const seed = Math.random().toString();
					const results = searchVue(`
					<template>
						<div>
							<span :some-prop="expression">${seed}</span>
						</div>
					</template>
					`, '[:some-prop]');

					expect(results[0]).toMatchObject({
						children: [{ content: seed }],
					});
				});

				test('"[:some-prop="expression"]"', () => {
					const seed = Math.random().toString();
					const results = searchVue(`
					<template>
						<div>
							<span :some-prop="expression">${seed}</span>
						</div>
					</template>
					`, '[:some-prop="expression"]');

					expect(results[0]).toMatchObject({
						children: [{ content: seed }],
					});
				});

				test('"[:some-prop.sync="expression"]"', () => {
					const seed = Math.random().toString();
					const results = searchVue(`
					<template>
						<div>
							<span :some-prop.sync="expression">${seed}</span>
						</div>
					</template>
					`, '[:some-prop.sync="expression"]');

					expect(results[0]).toMatchObject({
						children: [{ content: seed }],
					});
				});
			});
		});

		describe('v-on', () => {
			test('"[v-on:some-event]"', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span v-on:some-event="expression">${seed}</span>
					</div>
				</template>
				`, '[v-on:some-event]');

				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});

			test('"[v-on:some-event]" - match against shorthand', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span @some-event="expression">${seed}</span>
					</div>
				</template>
				`, '[v-on:some-event]');

				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});

			describe('@shorthand', () => {
				test('"[@some-event]', () => {
					const seed = Math.random().toString();
					const results = searchVue(`
					<template>
						<div>
							<span @some-event="expression">${seed}</span>
						</div>
					</template>
					`, '[@some-event]');

					expect(results[0]).toMatchObject({
						children: [{ content: seed }],
					});
				});

				test('"[@some-event="eventHandler"]"', () => {
					const seed = Math.random().toString();
					const results = searchVue(`
					<template>
						<div>
							<span @some-event="eventHandler">${seed}</span>
						</div>
					</template>
					`, '[@some-event="eventHandler"]');

					expect(results[0]).toMatchObject({
						children: [{ content: seed }],
					});
				});

				test('"[@some-event.native]"', () => {
					const seed = Math.random().toString();
					const results = searchVue(`
					<template>
						<div>
							<span @some-event.native="eventHandler">${seed}</span>
						</div>
					</template>
					`, '[@some-event.native]');

					expect(results[0]).toMatchObject({
						children: [{ content: seed }],
					});
				});

				test('"[@some-event.native]": no match', () => {
					const seed = Math.random().toString();
					const results = searchVue(`
					<template>
						<div>
							<span @some-event="eventHandler">${seed}</span>
						</div>
					</template>
					`, '[@some-event.native]');

					expect(results.length).toBe(0);
				});

				test('"[@some-event.once="eventHandler"]"', () => {
					const seed = Math.random().toString();
					const results = searchVue(`
					<template>
						<div>
							<span @some-event.once="eventHandler">${seed}</span>
						</div>
					</template>
					`, '[@some-event.once="eventHandler"]');

					expect(results[0]).toMatchObject({
						children: [{ content: seed }],
					});
				});

				test('"[@some-event.once="eventHandler"]": no match', () => {
					const seed = Math.random().toString();
					const results = searchVue(`
					<template>
						<div>
							<span @some-event="eventHandler">${seed}</span>
						</div>
					</template>
					`, '[@some-event.once="eventHandler"]');

					expect(results.length).toBe(0);
				});

				test('"[@some-event.once.prevent.stop]"', () => {
					const seed = Math.random().toString();
					const results = searchVue(`
					<template>
						<div>
							<span @some-event.stop.once.prevent="eventHandler">${seed}</span>
						</div>
					</template>
					`, '[@some-event.once.prevent.stop="eventHandler"]');

					expect(results[0]).toMatchObject({
						children: [{ content: seed }],
					});
				});

				test('"[@some-event.once.prevent.stop]": no match', () => {
					const seed = Math.random().toString();
					const results = searchVue(`
					<template>
						<div>
							<span @some-event.stop.prevent="eventHandler">${seed}</span>
						</div>
					</template>
					`, '[@some-event.once.prevent.stop="eventHandler"]');

					expect(results.length).toBe(0);
				});

				test('"[v-on="$listeners"]": no match', () => {
					const seed = Math.random().toString();
					const results = searchVue(`
					<template>
						<div>
							<span @submit.prevent>${seed}</span>
						</div>
					</template>
					`, '[v-on="$listeners"]');

					expect(results.length).toBe(0);
				});
			});
		});

		describe('v-slot', () => {
			test('"[v-slot]"', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span v-slot:slot-name>${seed}</span>
					</div>
				</template>
				`, '[v-slot]');

				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});

			test('"[v-slot:slot-name]"', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span v-slot:slot-name>${seed}</span>
					</div>
				</template>
				`, '[v-slot:slot-name]');

				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});

			test('"[v-slot:slot-name]" - match against shorthand', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span #slot-name>${seed}</span>
					</div>
				</template>
				`, '[v-slot:slot-name]');

				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});

			test('"[v-slot:[dynamicSlotName]]"', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span v-slot:[dynamicSlotName]>${seed}</span>
					</div>
				</template>
				`, '[v-slot:[dynamicSlotName]]');

				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});

			describe('#shorthand', () => {
				test('"[#some-event]', () => {
					const seed = Math.random().toString();
					const results = searchVue(`
					<template>
						<div>
							<span #slot-name>${seed}</span>
						</div>
					</template>
					`, '[#slot-name]');

					expect(results[0]).toMatchObject({
						children: [{ content: seed }],
					});
				});

				test('"[#some-slot="slotProps"]"', () => {
					const seed = Math.random().toString();
					const results = searchVue(`
					<template>
						<div>
							<span #some-slot="slotProps">${seed}</span>
						</div>
					</template>
					`, '[#some-slot="slotProps"]');

					expect(results[0]).toMatchObject({
						children: [{ content: seed }],
					});
				});
			});
		});

		describe('dynamic', () => {
			test('"[v-bind:[]]" - match all dynamic', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span v-bind:[dynamic-prop]="msg">${seed}</span>
						<span v-bind="1" />
					</div>
				</template>
				`, '[v-bind:[]]');

				expect(results.length).toBe(1);
				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});

			test('"[v-on:[dynamic-event]]"', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span v-on:[dynamic-event]="msg">${seed}</span>
					</div>
				</template>
				`, '[v-on:[dynamic-event]]');

				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});

			test('"[v-bind:[dynamic-prop]="different"]" - no match', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span v-bind:[dynamic-prop]="msg">${seed}</span>
					</div>
				</template>
				`, '[v-bind:[dynamic-prop]="different"]');

				expect(results.length).toBe(0);
			});

			test('"[:[dynamic-prop]]"', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span :[dynamic-prop]="msg">${seed}</span>
					</div>
				</template>
				`, '[v-bind:[dynamic-prop]]');

				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});

			test('"[@[dynamic-event]]"', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span @[dynamic-event]="msg">${seed}</span>
					</div>
				</template>
				`, '[v-on:[dynamic-event]]');

				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});
		});

		describe('misc', () => {
			test('modifier: "[v-model.trim="msg"]"', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span v-model.trim="msg">${seed}</span>
					</div>
				</template>
				`, '[v-model.trim="msg"]');

				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});

			test('name + regexp: "[v-bind=/^\\$/]"', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span v-bind="$attrs">${seed}</span>
					</div>
				</template>
				`, '[v-bind=/^\\$/]');

				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});

			test('name + regexp: "[v-bind=/Attrs$/]" - no match', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span v-bind="attrs">${seed}</span>
					</div>
				</template>
				`, '[v-bind=/Attrs$/]');

				expect(results.length).toBe(0);
			});

			test('name + empty string', () => {
				const seed = Math.random().toString();
				const results = searchVue(`
				<template>
					<div>
						<span v-bind="">${seed}</span>
						<span v-bind />
					</div>
				</template>
				`, '[v-bind=""]');

				expect(results.length).toBe(1);
				expect(results[0]).toMatchObject({
					children: [{ content: seed }],
				});
			});
		});
	});

	describe('class selector', () => {
		test('static', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span class="some-class-a some-class-b">${seed}</span>
				</div>
			</template>
			`, '.some-class-b');

			expect(results[0]).toMatchObject({
				children: [{ content: seed }],
			});
		});

		test('dynamic - string literal', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span v-bind="" :class="'some-class-a some-class-b'">${seed}</span>
				</div>
			</template>
			`, '.some-class-b');

			expect(results[0]).toMatchObject({
				children: [{ content: seed }],
			});
		});

		test('dynamic - array literal', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span :class="['some-class-a', 'some-class-b']">${seed}</span>
				</div>
			</template>
			`, '.some-class-b');

			expect(results[0]).toMatchObject({
				children: [{ content: seed }],
			});
		});

		test('dynamic - object literal', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span :class="{
						classA: true,
						'some-class-b': true,
					}">${seed}</span>
				</div>
			</template>
			`, '.some-class-b');

			expect(results[0]).toMatchObject({
				children: [{ content: seed }],
			});
		});

		test('dynamic - array of strings and object literals', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span :class="[
						{
							classA: true,
							classB: true,
						},
						{
							classC: true,
						},
						'class-d some-class-b',
					]">${seed}</span>
				</div>
			</template>
			`, '.some-class-b');

			expect(results[0]).toMatchObject({
				children: [{ content: seed }],
			});
		});

		test('dynamic - array of nested object literals', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span :class="[
						{
							classA: true,
							classB: false,
						},
						{
							classC: false,
						},
						[
							{
								'class-d some-class-b': true,
							},
						],
					]">${seed}</span>
				</div>
			</template>
			`, '.some-class-b');

			expect(results[0]).toMatchObject({
				children: [{ content: seed }],
			});
		});

		test('dynamic - object literal disabled - no match', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span :class="{
						'class-c': false,
					}">${seed}</span>
				</div>
			</template>
			`, '.class-c');

			expect(results.length).toBe(0);
		});

		test('dynamic - simple expression', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span :class="{ 'class-c': true || false }">${seed}</span>
				</div>
			</template>
			`, '.class-c');

			expect(results.length).toBe(1);
		});

		test('dynamic - simple expression in key', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span :class="{ ['class' + '-c']: true || false }">${seed}</span>
				</div>
			</template>
			`, '.class-c');

			expect(results.length).toBe(1);
		});

		test('dynamic - simple expression in key (css modules) - no match', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span :class="{ [$style.className]: true || false }">${seed}</span>
				</div>
			</template>
			`, '.class-c');

			expect(results.length).toBe(0);
		});

		test('dynamic - invalid object - no match', () => {
			const seed = Math.random().toString();
			const results = searchVue(`
			<template>
				<div>
					<span :class="{ invalid object }">${seed}</span>
				</div>
			</template>
			`, '.class-c');

			expect(results.length).toBe(0);
		});
	});
});

describe('compound selector', () => {
	test('tag + attribute', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span title="some title">${seed}</span>
			</div>
		</template>
		`, 'span[title]');

		expect(results[0]).toMatchObject({
			children: [{ content: seed }],
		});
		expect(results.length).toBe(1);
	});

	test('static class + attribute', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span class="some-class" title="some title">${seed}</span>
			</div>
		</template>
		`, '.some-class[title]');

		expect(results[0]).toMatchObject({
			children: [{ content: seed }],
		});
		expect(results.length).toBe(1);
	});

	test('dynamic class + attribute', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span :class="['some-class']" title="some title">${seed}</span>
			</div>
		</template>
		`, '.some-class[title]');

		expect(results[0]).toMatchObject({
			children: [{ content: seed }],
		});
		expect(results.length).toBe(1);
	});

	test('multiple directives', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span :prop-a="propA" :prop-b.modifier="propB">${seed}</span>
			</div>
		</template>
		`, '[:prop-b="propB"]');

		expect(results[0]).toMatchObject({
			children: [{ content: seed }],
		});
		expect(results.length).toBe(1);
	});

	test('no match', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span title="some title">${seed}</span>
			</div>
		</template>
		`, 'span[title="some other title"]');

		expect(results.length).toBe(0);
	});
});
