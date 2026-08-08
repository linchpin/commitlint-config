<table width="100%">
	<tr>
		<td align="left" width="70%">
			<strong>Linchpin Commitlint Config</strong><br />
			A standardized commitlint configuration that can be used across all Linchpin projects. One source of truth for commit types, scopes and subject formatting so every repo lints commit messages the same way.
		</td>
		<td align="center" width="30%">
			<a href="https://commitlint.js.org"><img src="https://img.shields.io/badge/commitlint-config-EA4AAA?logo=commitlint&logoColor=fff" alt="commitlint config" /></a>
			<a href="https://github.com/linchpin/commitlint-config"><img src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" alt="Maintained: yes" /></a>
			<a href="https://github.com/linchpin/commitlint-config/blob/main/LICENSE"><img src="https://img.shields.io/github/license/linchpin/commitlint-config" alt="License: MIT" /></a>
		</td>
	</tr>
	<tr>
		<td>
			A <strong><a href="https://linchpin.com">Linchpin</a></strong> project · <em>Actively maintained</em>
		</td>
		<td align="center" width="30%">
			<img src="https://assets.linchpin.com/linchpin-logo-primary.svg" width="100" alt="Linchpin" />
		</td>
	</tr>
</table>

## What is this config?

`@linchpinagency/commitlint-config` is a shareable [commitlint](https://commitlint.js.org) config that extends [`@commitlint/config-conventional`](https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional) and layers Linchpin's own conventions on top of it: an expanded set of commit types, a required task-key scope, and sentence-case subjects.

Because commit messages drive [release-please](https://github.com/googleapis/release-please) versioning and changelog generation across Linchpin repos, keeping the rules in one package means a change to the convention ships everywhere instead of drifting per project.

## Installation

```sh
npm install --save-dev @linchpinagency/commitlint-config @commitlint/cli @commitlint/config-conventional
```

`@commitlint/cli` and `@commitlint/config-conventional` are peer dependencies (`>=17.0.0`), so they are installed alongside this package rather than bundled with it.

## Usage

In your project root, create or update `commitlint.config.js`:

```js
module.exports = {
	extends: ['@linchpinagency/commitlint-config'],
};
```

To lint the most recent commit:

```sh
npx commitlint --from HEAD~1 --to HEAD --verbose
```

To lint every commit as it is written, add a [Husky](https://typicode.github.io/husky/) `commit-msg` hook at `.husky/commit-msg`:

```sh
npx --no -- commitlint --edit "$1"
```

## Commit message format

```
<type>(<scope>): <subject>
```

- **type** — one of the allowed types listed below.
- **scope** — a ClickUp-style task key (e.g. `PROJ-123`), `NO-TASK`, or a GitHub issue number (e.g. `#42`).
- **subject** — short description in sentence case.

### Examples

```
feat(PROJ-123): Add new feature
fix(NO-TASK): Fix a bug
docs(#42): Update readme
```

## Rules

| Rule | Level | Description |
| --- | --- | --- |
| `type-enum` | error | Type must be one of: `add`, `improve`, `build`, `chore`, `ci`, `docs`, `feat`, `feature`, `fix`, `perf`, `refactor`, `remove`, `revert`, `style`, `test`, `update` |
| `subject-case` | warning | Subject must be in sentence-case |

The config also sets a custom `parserPreset.parserOpts.headerPattern` that enforces the scope format.

### Failure messages

commitlint on its own reports a malformed header badly. When `headerPattern` fails to match, the parser extracts nothing, so a misspelled type comes back as *"type may not be empty"* and *"subject may not be empty"* — neither of which is the actual problem.

The `linchpin-header` rule replaces that with a description of the part that failed:

```
✖   "nope" is not a valid type.
      Valid types: add, improve, build, chore, ci, docs, feat, ...

✖   "proj-123" is not a valid scope. Task keys are uppercase - try "PROJ-123".
      Use a task key such as PROJ-123, NO-TASK, or a GitHub issue number such as #42.
```

It also catches the common near-misses: a lowercase task key, `NOTASK` for `NO-TASK`, and a missing scope or subject.

### Ignored commits

[release-please](https://github.com/googleapis/release-please) writes its own release commit and owns its format — the scope is the release branch (`main`, `master`, or a component), never a task key, so it can never satisfy `headerPattern`. Linting it would fail the release PR in every repo, so it is ignored:

```
chore(main): release 1.2.3
```

The exemption is deliberately narrow — it matches only a `release` subject followed by a version number. `chore(main): Update something else` is still rejected.

## Extending in a project

Project-level rules are merged on top of this config, so a repo can tighten or relax a rule without forking:

```js
module.exports = {
	extends: ['@linchpinagency/commitlint-config'],
	rules: {
		// Promote sentence-case from a warning to an error.
		'subject-case': [2, 'always', ['sentence-case']],
	},
};
```

## Development

```sh
npm install
npm test
```

Tests run with [Jest](https://jestjs.io) against `index.js` and cover the rule levels, the allowed type list and the header pattern.

This repo lints its own commits with the config it publishes (`commitlint.config.js` requires `./index.js` directly), so a change that breaks the rules fails CI before it reaches the projects that extend it.

## Releases

Versioning and publishing are automated with [release-please](https://github.com/googleapis/release-please):

- Pushes to `main` run `.github/workflows/release-please.yml`.
- `release-please` opens and updates a release PR from the conventional commits on `main`.
- Merging that PR bumps `package.json`, writes `CHANGELOG.md`, and creates the GitHub release and tag.
- When a release is created, the workflow publishes `@linchpinagency/commitlint-config` to npm.

Publishing authenticates with [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC), so there is no `NPM_TOKEN` to store or rotate. Provenance is generated automatically.

## Status

This project is **actively maintained** by Linchpin. For bugs or feature requests, open an issue in ClickUp.

![Linchpin an award winning digital agency building immersive, high performing web experiences](https://assets.linchpin.com/github/linchpin-github-repo-banner.jpg)
