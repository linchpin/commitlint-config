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
			expect(explain('feat(nonsense): Update something')).toContain('"nonsense" is not a valid scope');
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

	// Dependency updates carry no task, so the scope slot names the kind of dependency.
	// wp-plugin / wp-theme keep WordPress updates legible in a mostly automated log.
	describe('dependency scopes', () => {
		const { explain } = config;
		const pattern = config.parserPreset.parserOpts.headerPattern;

		test.each([
			'update(wp-plugin): Update translatepress-multilingual to v3.2.4',
			'update(wp-theme): Update ollie-pro to v2.6.1',
			'build(deps): Update npm-run-all2 to v9.0.3',
			'build(deps-dev): Update svgo to v3.3.4',
			'build(composer): Update humbug/php-scoper to v0.18.19',
			'build(npm): Update webpack to v5.94.0',
			'chore(actions): Update actions/checkout to v7',
		])('accepts %s', (header) => {
			expect(explain(header)).toBeNull();
			expect(header).toMatch(pattern);
		});

		// deps-dev must win over deps, or the scope parses as `deps` and the header breaks.
		test('parses deps-dev as a whole scope', () => {
			const [, , scope] = 'build(deps-dev): Update svgo to v3'.match(pattern);
			expect(scope).toBe('deps-dev');
		});

		test.each([
			'feat(nonsense): Bad scope',
			'feat(DEP): Old uppercase scope',
			'feat(PLUGIN): Old uppercase scope',
		])('still rejects %s', (header) => {
			expect(explain(header)).not.toBeNull();
		});
	});

	// wp-plugin and wp-theme double as types, not just scopes, so a repo whose
	// release-please-config gives WordPress plugins/themes their own changelog section can
	// emit one. release-please groups strictly by type, so this is the only way in.
	describe('wp-plugin and wp-theme as types', () => {
		const { explain } = config;
		const pattern = config.parserPreset.parserOpts.headerPattern;

		test.each([
			'wp-plugin(wporg): Update akismet to v5.3',
			'wp-plugin(linchpin): Update some-plugin to v3.0',
			'wp-theme(deps): Update twentytwentyfour to v2.0',
		])('accepts %s', (header) => {
			expect(explain(header)).toBeNull();
			expect(header).toMatch(pattern);
		});

		test('wporg and linchpin are valid scopes', () => {
			expect(explain('wp-plugin(wporg): Update something')).toBeNull();
			expect(explain('wp-plugin(linchpin): Update something')).toBeNull();
		});

		test('the scope form documented above still works alongside the type form', () => {
			expect(explain('update(wp-plugin): Update translatepress-multilingual to v3.2.4')).toBeNull();
			expect(explain('update(wp-theme): Update ollie-pro to v2.6.1')).toBeNull();
		});
	});
});
