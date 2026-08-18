'use strict';

// wp-plugin and wp-theme are scopes, not types. The type says what happened - `update` for a
// bump, `remove` for a package that is gone - and the scope says what it happened to.
//
// They were briefly types as well, in 1.3.0, so that release-please could give WordPress
// updates their own changelog section: `changelog-sections[].type` is the only key that schema
// offers, so a dedicated section is reachable through type and nothing else. The team chose the
// scope form regardless, which means WordPress updates share whatever section `update` maps to.
// That is the accepted trade - the scope still renders as the bold prefix on each changelog
// bullet, so plugin and theme lines stay apart inside the shared section.
const TYPES = ['add', 'improve', 'build', 'chore', 'ci', 'docs', 'feat', 'feature', 'fix', 'perf', 'refactor', 'remove', 'revert', 'style', 'test', 'update'];

// Dependency updates have no task behind them, so the scope slot carries the kind of
// dependency instead - which is what the wider ecosystem does too (`build(deps)`,
// `chore(deps-dev)`). wp-plugin and wp-theme keep WordPress updates obvious at a glance
// in a log that is mostly automated. wporg and linchpin are kept for hand-written commits;
// nothing emits them now that a package's source travels in a TAG instead, which leaves the
// scope free to say what kind of thing was updated. deps-dev precedes deps so the longer
// one wins.
const DEP_SCOPES = ['deps-dev', 'deps', 'wp-plugin', 'wp-theme', 'npm', 'composer', 'actions', 'wporg', 'linchpin'];

// An optional bracketed tag between the colon and the subject, carrying context the scope has
// no room for - `[.org]` for a wordpress.org package, `[packagist]` for packagist.linchpin.com.
//
// Deliberately not an enumerated list: this is a label for a reader, not a routing key. The
// charset is what keeps it a label - it stops `[see PROJ-1 for why]` from turning the tag into
// a sentence, and stops an unclosed bracket from swallowing the rest of the header.
//
// Non-capturing in headerPattern on purpose. The subject group has to keep capturing the
// sentence, so subject-case reads `Update akismet to v5`, not `[.org] Update akismet to v5`.
const TAG_CHARS = '[\\w.\\-]+';
const TAG = `(?:\\[${TAG_CHARS}\\]\\s*)?`;

// The same shape, for explain(). `[^\]]*` rather than TAG_CHARS so that a malformed tag is
// caught and quoted back instead of silently failing to match; group 1 is the tag body.
const TAG_AT_START = /^\[([^\]]*)\](\s*)/;
const VALID_TAG = new RegExp(`^${TAG_CHARS}$`);

// A ClickUp-style task key, NO-TASK, a GitHub issue number, or a dependency scope.
const SCOPE = new RegExp(`^(?:[A-Z]+-\\d+|NO-TASK|#\\d+|${DEP_SCOPES.join('|')})$`);

// Deliberately loose: this is what splits a header up so we can say which part is wrong.
// headerPattern below is the strict one, and it matching is the actual pass condition.
const LOOSE_HEADER = /^([^\s(!:]+)(?:\(([^)]*)\))?(!)?:[ \t]*(.*)$/;

const FORMAT = '<type>(<scope>): <Subject>';
const SCOPE_HELP = 'a task key such as PROJ-123, NO-TASK, a GitHub issue number such as #42, '
	+ `or a dependency scope (${DEP_SCOPES.join(', ')})`;
const EXAMPLE = 'Example: feat(PROJ-123): Add new feature';
const TAG_EXAMPLE = '[.org] or [packagist]';

/**
 * Explain what is wrong with a header, in the terms the author needs to fix it.
 *
 * commitlint on its own cannot do this. When headerPattern fails to match, the parser
 * extracts nothing, so the built-in rules report "type may not be empty" and "subject may
 * not be empty" - which is confusing when the real problem is a misspelled type or a scope
 * that is not a task key.
 *
 * @param {string} header First line of the commit message.
 * @returns {string|null} A description of every problem found, or null when the header is fine.
 */
function explain(header) {
	if (!header || !header.trim()) {
		return `Commit message is empty. Expected ${FORMAT}. ${EXAMPLE}`;
	}

	const match = header.match(LOOSE_HEADER);
	if (!match) {
		return [
			`"${header}" is not in the form ${FORMAT}.`,
			`A type, a scope in parentheses, then a colon and a space are all required.`,
			EXAMPLE,
		].join('\n');
	}

	const [, type, scope, , subject] = match;
	const problems = [];

	if (!TYPES.includes(type)) {
		const near = TYPES.filter((t) => t.startsWith(type.slice(0, 2)) || type.startsWith(t.slice(0, 2)));
		problems.push(
			`"${type}" is not a valid type.${near.length ? ` Did you mean ${near.map((t) => `"${t}"`).join(' or ')}?` : ''}` +
			`\n  Valid types: ${TYPES.join(', ')}`
		);
	}

	if (scope === undefined) {
		problems.push(`The scope is missing. Put one in parentheses after the type - use ${SCOPE_HELP}.`);
	} else if (!SCOPE.test(scope)) {
		const hint = /^no.?task$/i.test(scope)
			? ' Write it exactly as NO-TASK.'
			: /^[a-z]+-\d+$/.test(scope)
				? ` Task keys are uppercase - try "${scope.toUpperCase()}".`
				: '';
		problems.push(`"${scope}" is not a valid scope.${hint}\n  Use ${SCOPE_HELP}.`);
	}

	// The tag is optional structure, not part of the subject, so strip it before judging what is
	// left. Without this a leading `[` reads as a subject that does not start with a letter -
	// true to the letter, and useless for fixing an otherwise fine header.
	let body = subject;
	const tag = subject.match(TAG_AT_START);

	if (tag) {
		if (!VALID_TAG.test(tag[1])) {
			problems.push(
				`"[${tag[1]}]" is not a valid tag. A tag holds letters, digits, dots, hyphens or `
				+ `underscores - for example ${TAG_EXAMPLE}.`
			);
		}
		body = subject.slice(tag[0].length);
	} else if (subject.startsWith('[')) {
		// Left as the whole subject deliberately: the closing bracket is the one problem worth
		// reporting, and treating the rest as a subject would add a spurious second complaint.
		problems.push(
			`The tag is missing its closing bracket. Write it as ${TAG_EXAMPLE}, then the subject.`
		);
	}

	if (!body.trim()) {
		problems.push('The subject is missing. Describe the change after the colon.');
	}

	// The strict pattern stops at the first character it cannot take, so a header can look
	// fine yet parse to a truncated subject. Worth saying out loud rather than silently
	// shipping a half-sentence into the changelog.
	if (problems.length === 0 && body.trim()) {
		const usable = body.match(/^[\w\d\s,-]*/)[0].trim();
		if (!usable) {
			problems.push(`The subject must start with a letter or number. "${body}" does not.`);
		}
	}

	return problems.length ? problems.join('\n') : null;
}

module.exports = {
	extends: ['@commitlint/config-conventional'],
	plugins: [
		{
			rules: {
				// Owns all header diagnostics. Registered as a plugin because that is the only
				// way commitlint lets a config supply its own message text - the top-level
				// `messages` key some configs carry is not a commitlint option and does nothing.
				'linchpin-header': (parsed) => {
					const problem = explain(parsed.header || '');
					return [problem === null, problem || ''];
				},
			},
		},
	],
	rules: {
		'linchpin-header': [2, 'always'],
		'type-enum': [2, 'always', TYPES],
		'subject-case': [1, 'always', ['sentence-case']],
		// Silenced because they fire whenever headerPattern fails to match, reporting an empty
		// type and subject regardless of the real cause. linchpin-header covers both cases and
		// says which part is actually wrong.
		'type-empty': [0, 'never'],
		'subject-empty': [0, 'never'],
	},
	parserPreset: {
		parserOpts: {
			headerPattern: new RegExp(
				`^(${TYPES.join('|')})`
				+ `\\(((?:[A-Z]+-\\d+)|(?:NO-TASK)|(?:#\\d+)|(?:${DEP_SCOPES.join('|')}))\\)`
				+ `:\\s?${TAG}([\\w\\d\\s,\\-]*)`
			),
			headerCorrespondence: ['type', 'scope', 'subject'],
		},
	},
	// release-please writes its own release commit and owns its format - the scope is the
	// release branch, not a task key, so it can never satisfy headerPattern. Every Linchpin
	// repo using release-please produces these, so linting them just fails the release PR.
	// Matches `chore(main): release 1.2.3`, and the master / component variants.
	ignores: [(message) => /^chore\(.+\): release v?\d+\.\d+\.\d+/.test(message)],
	helpUrl: 'https://www.conventionalcommits.org',
};

module.exports.explain = explain;
