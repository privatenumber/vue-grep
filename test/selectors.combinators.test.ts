import { searchVue } from './utils';

describe('descendant combinator', () => {
	test('span span', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span>
					<span title="some title">${seed}</span>
				</span>
			</div>
		</template>
		`, 'span span');

		expect(results[0]).toMatchObject({
			children: [{ content: seed }],
		});
		expect(results.length).toBe(1);
	});

	test('div div span', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span>
					<div>
						<span title="some title">${seed}</span>
					</div>
				</span>
			</div>
		</template>
		`, 'div div span');

		expect(results.length).toBe(1);
		expect(results[0]).toMatchObject({
			children: [{ content: seed }],
		});
	});
});

describe('child combinator', () => {
	test('span > span', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span>
					<span title="some title">${seed}</span>
				</span>
			</div>
		</template>
		`, 'span > span');

		expect(results[0]).toMatchObject({
			children: [{ content: seed }],
		});
		expect(results.length).toBe(1);
	});

	test('span > div > span', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span>
					<div>
						<span title="some title">${seed}</span>
					</div>
				</span>
			</div>
		</template>
		`, 'span > div > span');

		expect(results[0]).toMatchObject({
			children: [{ content: seed }],
		});
		expect(results.length).toBe(1);
	});
});

describe('general sibling combinator', () => {
	test('span ~ span', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span />
				<div />
				<div />
				<div />
				<span />
				<div />
				<span title="some title">${seed}</span>
			</div>
		</template>
		`, 'span ~ span');

		expect(results[1]).toMatchObject({
			children: [{ content: seed }],
		});
		expect(results.length).toBe(2);
	});

	test('div ~ span ~ span', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<div />
				<div />
				<div />
				<span />
				<div />
				<span title="some title">${seed}</span>
			</div>
		</template>
		`, 'div ~ span ~ span');

		expect(results[0]).toMatchObject({
			children: [{ content: seed }],
		});
		expect(results.length).toBe(1);
	});
});

describe('adjacent sibling combinator', () => {
	test('span + span', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span />
				<span title="some title">${seed}</span>
			</div>
		</template>
		`, 'span + span');

		expect(results[0]).toMatchObject({
			children: [{ content: seed }],
		});
		expect(results.length).toBe(1);
	});

	test('span + span + span', () => {
		const seed = Math.random().toString();
		const results = searchVue(`
		<template>
			<div>
				<span />
				<span />
				<span title="some title">${seed}</span>
			</div>
		</template>
		`, 'span + span + span');

		expect(results[0]).toMatchObject({
			children: [{ content: seed }],
		});
		expect(results.length).toBe(1);
	});
});
