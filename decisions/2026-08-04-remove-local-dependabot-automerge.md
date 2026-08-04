## Decision: Remove go-udap's local Dependabot auto-merge workflow

Delete `.github/workflows/dependabot-automerge.yaml`. Last Light's
`dependabot-pr-merge` workflow is the single owner of the classify → label →
auto-merge decision for dependency PRs on managed repos, and the local
workflow has never once performed that job.

## Context

Investigating why PR #185 would not merge surfaced two facts about the local
workflow, added 2026-07-23 in `59d0c70`.

First, it has never enabled auto-merge on any PR. Its guard tests
`steps.meta.outputs.package-ecosystem == 'npm'`, but `dependabot/fetch-metadata`
emits Dependabot's internal resolver name, `npm_and_yarn`. The two strings name
the same ecosystem: `dependabot.yml` accepts `npm` as *input*, while the action
reports `npm_and_yarn` as *output*. Run `30897608171` on PR #187 shows the other
two conditions matching and only the ecosystem comparison failing:

```
outputs.update-type:       version-update:semver-minor   passes
outputs.directory:         /docs/site                    passes
outputs.package-ecosystem: npm_and_yarn                  != 'npm'
```

Timeline events for PRs #173, #178, #180, #184, #186 and #187 confirm no
auto-merge was ever enabled by this workflow.

Second, the failure is invisible. The `dependabot-automerge` check reports
SUCCESS on every PR because the *job* succeeds — only the step inside is skipped
by its own `if:`. From the check badge, a skipped step and a step that ran and
did its work are indistinguishable. The bug survived three weeks for this
reason.

Separately, Last Light already enables auto-merge on this repo's Dependabot PRs
— it did so on #185 at 2026-08-01T15:04:38Z — and
`lastlight/apps/server/spec/07-phases-and-prompts.md` designates its
`dependabot-pr-merge` workflow "the single owner of the classify → label →
auto-merge decision".

## Alternatives considered

- **Fix the comparison** (`'npm'` → `'npm_and_yarn'`). Rejected: it would switch
  on auto-merge behaviour that has never actually run, making it a live
  behaviour change rather than a bug fix, and it would then race Last Light for
  the same decision on the same PRs. Two owners of one decision is worse than
  one owner plus a silent no-op.
- **Keep it as a fallback** for when Last Light is unavailable. Rejected: a
  fallback that has never executed is untested by definition, and its
  permanently-green check actively misleads anyone reading the PR page.
- **Fix it and remove Last Light's auto-merge for this repo.** Rejected on the
  same grounds as the 2026-07-25 decision — the concern is fleet-wide, and
  per-repo copies of fleet-wide machinery are what that decision set out to
  avoid.

## Reasoning

The workflow provides no behaviour today, so removing it changes nothing
operationally — the only observable difference is one fewer green check that
means nothing. Auto-merge continues to work because Last Light performs it.
Keeping a broken duplicate of a working fleet-wide capability contradicts the
2026-07-25 decision, and the misleading SUCCESS badge is worse than absence.

`dependabot-automerge` is not among the branch ruleset's required contexts
(`lint`, `test (ubuntu-latest)`, `test (macos-latest)`,
`test (windows-2025-vs2026)`, `sbom-scan`, `completion-smoke`, `govulncheck`,
`Conventional Commits`), so deleting the workflow cannot wedge the ruleset by
leaving a required check permanently unreported.

## Trade-offs accepted

- Dependency-PR auto-merge for this repo now depends entirely on Last Light
  being deployed and holding `pull-requests: write`. If Last Light is down,
  Dependabot PRs wait for a human rather than falling back to a local path.
- The repo loses a self-contained record of its own auto-merge policy; the
  policy now lives in Last Light's configuration. See
  `decisions/2026-08-04-require-signed-lastlight-branch-updates.md` for the
  other half of the Last Light coupling.

## Supersedes

None. Retires the mechanism introduced in `59d0c70` without replacing it
in-repo.
