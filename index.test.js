'use strict';

const config = require('./index');

describe('@linchpinagency/commitlint-config', () => {
	test('exports an object', () => {
		expect(typeof config).toBe('object');
	});

	test('extends @commitlint/config-conventional', () => {
		expect(config.extends).toContain('@commitlint/config-conventional');
	});

	test('type-enum rule is set to error level', () => {
		const [level] = config.rules['type-enum'];
		expect(level).toBe(2);
	});

	test('type-enum includes expected types', () => {
		const [, , types] = config.rules['type-enum'];
		const expected = ['improve', 'build', 'chore', 'ci', 'docs', 'feat', 'feature', 'fix', 'perf', 'refactor', 'revert', 'style', 'test', 'update'];
		expect(types).toEqual(expect.arrayContaining(expected));
	});

	test('subject-case rule is set to warning level', () => {
		const [level] = config.rules['subject-case'];
		expect(level).toBe(1);
	});

	test('parserPreset is defined with headerPattern and headerCorrespondence', () => {
		expect(config.parserPreset).toBeDefined();
		expect(config.parserPreset.parserOpts.headerPattern).toBeInstanceOf(RegExp);
		expect(config.parserPreset.parserOpts.headerCorrespondence).toEqual(['type', 'scope', 'subject']);
	});

	test('headerPattern matches valid commit message', () => {
		const pattern = config.parserPreset.parserOpts.headerPattern;
		expect('feat(PROJ-123): Add new feature').toMatch(pattern);
		expect('feature(NO-TASK): Add another feature').toMatch(pattern);
		expect('fix(NO-TASK): Fix a bug').toMatch(pattern);
		expect('docs(#42): Update readme').toMatch(pattern);
	});

	test('helpUrl points to conventionalcommits.org', () => {
		expect(config.helpUrl).toBe('https://www.conventionalcommits.org');
	});

	test('messages are defined', () => {
		expect(config.messages['type-enum']).toBeDefined();
		expect(config.messages['subject-case']).toBeDefined();
		expect(config.messages['header-pattern']).toBeDefined();
	});
});
