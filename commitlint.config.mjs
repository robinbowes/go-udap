export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // `deps` is not a config-conventional type. Dependabot is configured
    // to use it so release-please can route those commits to a
    // Dependencies changelog section -- sections are keyed by type, and
    // the default `chore(deps)` lands under the hidden `chore` type.
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'deps',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
      ],
    ],
  },
};
