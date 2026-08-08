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
		const expected = ['add', 'improve', 'build', 'chore', 'ci', 'docs', 'feat', 'feature', 'fix', 'perf', 'refactor', 'remove', 'revert', 'style', 'test', 'update'];
		expect(types).toEqual(expect.arrayContaining(expected));
	});

	// Every type in type-enum must also be reachable through headerPattern. The two are
	// separate lists, so a type added to one and not the other passes type-enum and is
	// then rejected by the parser — the failure mode this guards against.
	test('every allowed type is accepted by headerPattern', () => {
		const [, , types] = config.rules['type-enum'];
		const pattern = config.parserPreset.parserOpts.headerPattern;
		for (const type of types) {
			expect(`${type}(PROJ-123): Some subject`).toMatch(pattern);
		}
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
		expect('add(PROJ-123): Add a thing').toMatch(pattern);
		expect('remove(PROJ-123): Remove a thing').toMatch(pattern);
	});

	// release-please owns the format of its own release commit, so linting it can only
	// ever fail the release PR. Regressing this blocks every release in every repo.
	describe('release-please commits are ignored', () => {
		const ignored = (message) => config.ignores.some((fn) => fn(message));

		test.each([
			'chore(main): release 1.1.0',
			'chore(master): release 2.10.2',
			'chore(main): release v1.0.0',
			'chore(commitlint-config): release 1.2.3',
		])('ignores %s', (message) => {
			expect(ignored(message)).toBe(true);
		});

		test.each([
			'chore(NO-TASK): Release the hounds',
			'feat(PROJ-123): Add release notes',
			'chore(main): Update something else',
		])('does not ignore %s', (message) => {
			expect(ignored(message)).toBe(false);
		});
	});

	test('helpUrl points to conventionalcommits.org', () => {
		expect(config.helpUrl).toBe('https://www.conventionalcommits.org');
	});

	// The previous config carried a top-level `messages` key. That is not a commitlint
	// option and never reached the user; diagnostics now come from the linchpin-header rule.
	test('does not rely on a non-existent messages option', () => {
		expect(config.messages).toBeUndefined();
	});

	describe('linchpin-header explains which part failed', () => {
		const { explain } = config;

		test.each([
			['feat(PROJ-123): Add new feature'],
			['fix(NO-TASK): Fix a bug'],
			['docs(#42): Update readme'],
			['build(NO-TASK): Update npm dependency npm-run-all2 to v9.0.3'],
		])('accepts %s', (header) => {
			expect(explain(header)).toBeNull();
		});

		test('names the offending type, not an empty subject', () => {
			const out = explain('nope(PROJ-123): Bad type here');
			expect(out).toContain('"nope" is not a valid type');
			expect(out).not.toContain('subject may not be empty');
		});

		test('names the offending scope', () => {
			expect(explain('feat(deps): Update something')).toContain('"deps" is not a valid scope');
		});

		test('suggests the uppercase form of a lowercase task key', () => {
			expect(explain('feat(proj-123): Lowercase key')).toContain('try "PROJ-123"');
		});

		test('catches the NOTASK typo specifically', () => {
			expect(explain('feat(NOTASK): Typo scope')).toContain('exactly as NO-TASK');
		});

		test('reports a missing scope', () => {
			expect(explain('feat: No scope at all')).toContain('scope is missing');
		});

		test('reports a missing subject', () => {
			expect(explain('feat(NO-TASK):')).toContain('subject is missing');
		});

		test('reports an empty header', () => {
			expect(explain('')).toContain('empty');
		});
	});
});
