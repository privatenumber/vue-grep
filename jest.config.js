module.exports = {
	transform: {
		'^.+\\.[jt]s$': 'esbuild-jest',
	},
	transformIgnorePatterns: [
		'node_modules/.pnpm(?!/vue-ast-utils)',
	],
};
