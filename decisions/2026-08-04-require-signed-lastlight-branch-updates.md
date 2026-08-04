## Decision: Last Light must not push locally-created commits to go-udap

go-udap's `main` ruleset enforces `required_signatures`, so any commit Last
Light creates with `git` in a sandbox and pushes will block the PR it was
meant to unblock. Last Light must instead update branches through a mechanism
that produces a signed commit — GitHub's `PUT /repos/{owner}/{repo}/pulls/
{number}/update-branch`, which merges server-side — or avoid creating a commit
at all by re-running the failed jobs.

## Context

PR #185 (a docs/site npm group bump) sat at `mergeStateStatus: BLOCKED` with all
eight required checks green, zero required approvals and `mergeable: MERGEABLE`.
The blocker was commit `747b1c08`, a merge commit with
`verification.reason: "unsigned"`, authored and committed as
`yo61-lastlight[bot] <yo61-lastlight[bot]@users.noreply.github.com>` and pushed
by `yo61-lastlight[bot]` at 2026-08-01T15:02:49Z. Dependabot's own commit on the
same branch, `505b88ae`, was `verified: true` — everything Dependabot pushes goes
through GitHub's API and is signed with the `web-flow` key automatically.

Ruleset `16775143` applies `required_signatures` to `main`. The rule is
evaluated against every commit reachable in the PR, not just the head commit, so
a single unsigned commit anywhere in the branch blocks the merge.

The mechanism is in `lastlight/apps/server/workflows/prompts/dependabot-ci-fix.md`,
which instructs the agent to run `git fetch origin <base>` then
`git merge --no-edit FETCH_HEAD` and push. A commit built by `git` in a runner
arrives unsigned regardless of how privileged the token is: the token
authenticates the *push*, it does not sign the *commit*. Last Light configures
no commit signing anywhere — the only `gpgsign` settings in that repo are
`tag.gpgsign` for releases.

The merge itself is deliberate and not the problem. Last Light merges the base
branch to make a `behind` or `dirty` PR current, and to regenerate lockfiles on
conflict. For go-udap specifically the merge is also unnecessary, because the
ruleset sets `strict_required_status_checks_policy: false` — a branch does not
need to be current with `main` to merge here.

Recovering #185 required `@dependabot recreate`, which discarded the branch and
opened #187 in its place. That threw away a fully green CI run and produced a
red one, because regenerating the lockfile pulled in transitive dependencies
published within pnpm's 24h `minimumReleaseAge` window.

## Alternatives considered

- **Provision a signing key for Last Light** (GPG or SSH private key as a
  secret, `commit.gpgsign` in the sandbox). Rejected as the first choice: it
  adds a key to mint, store and rotate for every managed repo, to solve a
  problem GitHub already solves server-side. Worth revisiting only if Last Light
  needs to author commits whose content GitHub cannot produce.
- **Relax `required_signatures` on go-udap.** Rejected: the rule is doing
  exactly its job — it caught an unattributable commit from an automated actor.
  Weakening repo security to accommodate a tool is the wrong direction.
- **Have Last Light always `@dependabot recreate` instead of merging.**
  Rejected: recreate discards the PR's CI history and regenerates the lockfile,
  which re-rolls the dice on pnpm's release-age window. #185 → #187
  demonstrated this turning a green PR red.

## Reasoning

`update-branch` performs the merge on GitHub's servers, so the resulting commit
is committed by `GitHub <noreply@github.com>` and signed with the `web-flow`
key — the same path as the UI's "Update branch" button. It keeps Last Light's
intended behaviour (base branch merged into a stale PR) while satisfying the
signature rule, and needs no key management.

Where the goal is only to re-run CI after a transient failure — the
`minimumReleaseAge` case from the 2026-07-25 decision — the correct action
creates no commit at all: `POST /repos/{owner}/{repo}/actions/runs/{run_id}/
rerun-failed-jobs`, which that decision already anticipated needing
`actions: write`.

## Trade-offs accepted

- `update-branch` cannot resolve conflicts; it fails on a `dirty` PR. Last Light
  still needs a sandbox path for lockfile regeneration, and any commit produced
  that way remains unsigned. Repos enforcing `required_signatures` will need
  those PRs recreated or handed to a human.
- GitHub's REST reference for `update-branch` does not explicitly document the
  signing behaviour of the commit it creates, so this was verified directly
  rather than assumed. Running it against PRs #189 and #190 on 2026-08-04
  produced:

  ```
  cbe3309c committer=GitHub <noreply@github.com> verified=true reason=valid
  f64c7c62 committer=GitHub <noreply@github.com> verified=true reason=valid
  ```

  Both are `Merge branch 'main' into <branch>` — note the message differs from
  a sandbox merge's `Merge remote-tracking branch 'origin/main' into <branch>`,
  which makes the two mechanisms distinguishable in history after the fact.

## Supersedes

None. Builds on
`decisions/2026-07-25-defer-dependabot-pnpm-retry-to-lastlight.md`, which
deferred dependency-PR retry automation to Last Light; this records a constraint
that automation must satisfy on this repo. See
`decisions/2026-08-04-remove-local-dependabot-automerge.md` for the other half
of the Last Light coupling.
