## Decision: Defer the Dependabot pnpm-release-age retry automation to a lastlight skill

Do not build a go-udap-local fix for docs Dependabot PRs that fail on pnpm 11's
`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`. Capture the requirement as a planned
Last Light skill instead. Requirement recorded at
`lastlight/docs/plans/dependabot-pnpm-release-age-retry.md`.

## Context

go-udap PR #176 (docs/site npm group bump) failed only the `build` check. Root
cause: pnpm 11 defaults `minimumReleaseAge` to 1440 min (24h) and enforces it on
`pnpm install --frozen-lockfile`, rejecting every lockfile entry — including
transitive deps — published within the last 24h. Dependabot regenerated the
lockfile and pulled in a fresh coordinated `@radix-ui/*` release (~31 packages
published ~3h earlier). The direct deps Dependabot bumped were 8-10 days old and
correctly gated by Dependabot's 7-day `cooldown`; the breakage came entirely from
transitively re-resolved deps, which `cooldown` does not govern. The same
lockfile passes once the packages cross 24h. A one-off cloud routine was
scheduled to re-run #176's build after the window clears
(2026-07-26T00:30Z). Robin then asked for a durable fix, and noted it must work
across all repos, not just go-udap.

## Alternatives considered

- **Increase Dependabot `cooldown` (7 → 14/30 days).** Rejected: gates only the
  direct bump targets, never transitive resolution — cannot reach the `@radix-ui`
  deps that fail CI.
- **In-repo scheduled GitHub Actions workflow** that scans open Dependabot PRs and
  re-runs failed builds. Rejected once scope went org-wide: a per-repo workflow
  copied into every repo, or a central watcher needing an org-scoped
  `actions: write` token — both are machinery the shared control plane should own.
- **Opt out in CI** (`minimumReleaseAge: 0`). Rejected: discards pnpm 11's
  supply-chain protection; against the project's security standards.
- **lastlight skill** (chosen). Last Light already ingests GitHub webhooks, routes
  events → skills, runs across all managed repos via one GitHub App, and has
  scheduling — the natural cross-repo home.

## Reasoning

The concern is org-wide and event-driven, which matches lastlight's model exactly
and avoids duplicating a workflow into every repo or minting a broad token for a
central cron. Keeping the fix out of go-udap keeps this repo free of machinery
that serves a fleet-wide need.

## Trade-offs accepted

- Until the lastlight skill exists, these failures need a manual (or one-off
  scheduled) re-run when they occur. They are infrequent — only when a transitive
  dep publishes within 24h of a Dependabot run.
- The fix now depends on lastlight being deployed and holding `actions: write` on
  managed repos.

## Supersedes

None.
