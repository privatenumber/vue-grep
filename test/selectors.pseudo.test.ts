import { searchVue } from './utils';

describe('pseudo classes', () => {
	test(':empty', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span seed="${seed}"></span>
			</div>
		</template>
		`, ':empty');

		expect(results.length).toBe(1);
		expect(results[0]).toMatchObject({
			props: [{
				name: 'seed',
				value: {
					content: seed,
				},
			}],
			children: [],
		});
	});

	test(':contains()', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span>${seed}</span>
			</div>
		</template>
		`, `:contains('${seed}')`);

		expect(results.length).toBe(1);
		expect(results[0]).toMatchObject({
			children: [{ content: seed }],
		});
	});

	test(':contains() - should not match subset', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span>${seed}</span>
			</div>
		</template>
		`, `:contains('${seed.slice(0, 3)}')`);

		expect(results.length).toBe(0);
	});

	test(':contains() w/ interpolation', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span seed="${seed}">{{ someInterpolation }}</span>
			</div>
		</template>
		`, ':contains(\'{{ someInterpolation }}\')');

		expect(results.length).toBe(1);
		expect(results[0]).toMatchObject({
			props: [{
				name: 'seed',
				value: {
					content: seed,
				},
			}],
		});
	});

	test(':contains() w/ regex', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span seed="${seed}">{{ someInterpolation }}</span>
			</div>
		</template>
		`, ':contains(/{{.+}}/)');

		expect(results.length).toBe(1);
		expect(results[0]).toMatchObject({
			props: [{
				name: 'seed',
				value: {
					content: seed,
				},
			}],
		});
	});

	test(':first-child', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span>${seed}</span>
				<span />
			</div>
		</template>
		`, 'span:first-child');

		expect(results.length).toBe(1);
		expect(results[0]).toMatchObject({
			children: [{ content: seed }],
		});
	});

	test(':last-child', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span />
				<span>${seed}</span>
			</div>
		</template>
		`, 'span:last-child');

		expect(results.length).toBe(1);
		expect(results[0]).toMatchObject({
			children: [{ content: seed }],
		});
	});

	test(':nth-child()', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span />
				<span>${seed}</span>
				<span />
			</div>
		</template>
		`, 'span:nth-child(2)');

		expect(results.length).toBe(1);
		expect(results[0]).toMatchObject({
			children: [{ content: seed }],
		});
	});

	test(':nth-child() in multi-root template', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<span />
			<span>${seed}</span>
			<span />
		</template>
		`, 'span:nth-child(2)');

		expect(results.length).toBe(1);
		expect(results[0]).toMatchObject({
			children: [{ content: seed }],
		});
	});

	test(':nth-last-child()', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span />
				<span>${seed}</span>
				<span />
			</div>
		</template>
		`, 'span:nth-last-child(2)');

		expect(results.length).toBe(1);
		expect(results[0]).toMatchObject({
			children: [{ content: seed }],
		});
	});
});
