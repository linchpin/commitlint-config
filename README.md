# @linchpinagency/commitlint-config

A standardized commitlint configuration for Linchpin projects. Centralizes commit message rules so every project can install and extend the same config.

## Installation

```sh
npm install --save-dev @linchpinagency/commitlint-config @commitlint/cli @commitlint/config-conventional
```

## Usage

In your project root, create or update `commitlint.config.js`:

```js
module.exports = {
  extends: ['@linchpinagency/commitlint-config'],
};
```

## Rules

| Rule | Level | Description |
|---|---|---|
| `type-enum` | error | Type must be one of: `improve`, `build`, `chore`, `ci`, `docs`, `feat`, `feature`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`, `update` |
| `subject-case` | warning | Subject must be in sentence-case |

## Commit Message Format

```
<type>(<scope>): <subject>
```

- **type**: one of the allowed types listed above
- **scope**: a ClickUp-style task key (e.g. `PROJ-123`), `NO-TASK`, or a GitHub issue number (e.g. `#42`)
- **subject**: short description in sentence case

### Examples

```
feat(PROJ-123): Add new feature
fix(NO-TASK): Fix a bug
docs(#42): Update readme
```

## Help

See [Conventional Commits](https://www.conventionalcommits.org) for more information.
