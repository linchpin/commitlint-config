'use strict';

const TYPES = ['add', 'improve', 'build', 'chore', 'ci', 'docs', 'feat', 'feature', 'fix', 'perf', 'refactor', 'remove', 'revert', 'style', 'test', 'update'];

// A ClickUp-style task key, NO-TASK, or a GitHub issue number.
const SCOPE = /^(?:[A-Z]+-\d+|NO-TASK|#\d+)$/;

// Deliberately loose: this is what splits a header up so we can say which part is wrong.
// headerPattern below is the strict one, and it matching is the actual pass condition.
const LOOSE_HEADER = /^([^\s(!:]+)(?:\(([^)]*)\))?(!)?:[ \t]*(.*)$/;

const FORMAT = '<type>(<scope>): <Subject>';
const SCOPE_HELP = 'a task key such as PROJ-123, NO-TASK, or a GitHub issue number such as #42';
const EXAMPLE = 'Example: feat(PROJ-123): Add new feature';

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

	if (!subject.trim()) {
		problems.push('The subject is missing. Describe the change after the colon.');
	}

	// The strict pattern stops at the first character it cannot take, so a header can look
	// fine yet parse to a truncated subject. Worth saying out loud rather than silently
	// shipping a half-sentence into the changelog.
	if (problems.length === 0 && subject.trim()) {
		const usable = subject.match(/^[\w\d\s,-]*/)[0].trim();
		if (!usable) {
			problems.push(`The subject must start with a letter or number. "${subject}" does not.`);
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
			headerPattern: /^(add|update|improve|build|ci|feat|feature|fix|docs|style|remove|revert|perf|refactor|test|chore)\(((?:[A-Z]+-\d+)|(?:NO-TASK)|(?:#\d+))\):\s?([\w\d\s,\-]*)/,
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
