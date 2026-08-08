'use strict';

module.exports = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'type-enum': [2, 'always', ['improve', 'build', 'chore', 'ci', 'docs', 'feat', 'feature', 'fix', 'perf', 'refactor', 'revert', 'style', 'test', 'update']],
		'subject-case': [1, 'always', ['sentence-case']],
	},
	parserPreset: {
		parserOpts: {
			headerPattern: /^(update|improve|build|ci|feat|feature|fix|docs|style|revert|perf|refactor|test|chore)\(((?:[A-Z]+-\d+)|(?:NO-JIRA|NO-TASK)|(?:#\d+))\):\s?([\w\d\s,\-]*)/,
			headerCorrespondence: ['type', 'scope', 'subject'],
		},
	},
	helpUrl: 'https://www.conventionalcommits.org',
	messages: {
		'type-enum': 'Commit type must be one of: improve, build, chore, ci, docs, feat, feature, fix, perf, refactor, revert, style, test, update.',
		'subject-case': 'Commit message subject must be in sentence-case.',
		'header-pattern': 'Commit message must match the pattern "<type>(<scope>): <subject>" where scope is a Jira issue key (e.g. PROJ-123), NO-JIRA, NO-TASK, or a GitHub issue number (e.g. #42).',
	},
};
