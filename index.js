'use strict';

module.exports = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'type-enum': [2, 'always', ['add', 'improve', 'build', 'chore', 'ci', 'docs', 'feat', 'feature', 'fix', 'perf', 'refactor', 'remove', 'revert', 'style', 'test', 'update']],
		'subject-case': [1, 'always', ['sentence-case']],
	},
	parserPreset: {
		parserOpts: {
			headerPattern: /^(add|update|improve|build|ci|feat|feature|fix|docs|style|remove|revert|perf|refactor|test|chore)\(((?:[A-Z]+-\d+)|(?:NO-TASK)|(?:#\d+))\):\s?([\w\d\s,\-]*)/,
			headerCorrespondence: ['type', 'scope', 'subject'],
		},
	},
	helpUrl: 'https://www.conventionalcommits.org',
	messages: {
		'type-enum': 'Commit type must be one of: add, improve, build, chore, ci, docs, feat, feature, fix, perf, refactor, remove, revert, style, test, update.',
		'subject-case': 'Commit message subject must be in sentence-case.',
		'header-pattern': 'Commit message must match the pattern "<type>(<scope>): <subject>" where scope is a ClickUp-style task key (e.g. PROJ-123), NO-TASK, or a GitHub issue number (e.g. #42).',
	},
};
