## Decision: Move the go.mod directive to 1.27.1, tracking the current Go release rather than staying on the 1.26 line

Bump `go.mod`'s `go` directive from `1.26.5` to `1.27.1`, moving the
module off the 1.26 line. Future stdlib-alert bumps track the current
release rather than pinning to the oldest patch that happens to clear
the alerts.

## Context: Eight stdlib govulncheck alerts against go 1.26.5

Eight advisories (GO-2026-6218, -5942, -6091, -6090, -6089, -6088,
-5972, -5026) are filed against go 1.26.5, covering net/url, crypto/tls,
html/template, encoding/xml, encoding/asn1 and net.

None are reachable. govulncheck is reachability-aware and reports 0
called symbols, so the job exits 0 and CI stays green — but the findings
accumulate as 2 `warning` and 6 `note` alerts in the Security tab. Those
SARIF levels are not CVSS severities; nothing here was rated high.

CI installs the exact directive via `go-version-file: go.mod`, so the
directive alone determines which stdlib govulncheck scans. Verifying
locally is therefore misleading unless the toolchain is pinned: a
1.27.x machine reports "No vulnerabilities found" against a `go 1.26.5`
go.mod that CI flags with all eight.

This is the third such bump (`d5c1896` → 1.26.3, `9f24f84` → 1.26.4 for
the same reason, `083ccce` → 1.26.5). It is recurring maintenance, not a
one-off.

## Alternatives considered:

- **1.26.6** — the minimum that clears all eight. Correct today, but
  leaves the module on the oldest patch that happens to work and
  guarantees another bump on the next advisory.
- **1.26.8** — current patch of the existing line. Matches prior
  practice exactly (patch-only moves within a line) and does not raise
  the minimum Go for source builds.
- **1.27.0** — base release of the current line. Verified clean, and a
  query of the Go vulnerability database confirmed no advisory is fixed
  in 1.27.1, so 1.27.0 carries no known exposure. Passed over only
  because it is not the tip.

## Reasoning:

The 1.26 line is no longer the current line, so staying on it accrues
advisories faster than it clears them — each bump buys progressively
less time. Tracking the current release resets that clock.

Between 1.27.0 and 1.27.1 there is no security difference: no Go
vulnerability database entry lists a 1.27.1 fix, making 1.27.1 a
non-security patch release. The tip was chosen anyway so the directive
does not start out one patch behind, which costs nothing here.

1.27.1 was verified clean, not assumed: `GOTOOLCHAIN=go1.26.5`
reproduces the 2 imported plus 6 required vulnerabilities, and
`GOTOOLCHAIN=go1.27.1` reports "No vulnerabilities found". Tests pass
under `-race`, `go vet` is clean, and `task build:all` cross-compiles
all five targets.

## Trade-offs accepted:

- **Source builds now need Go 1.27.1 or newer.** Released binaries are
  unaffected — goreleaser builds them from this same directive — so only
  people building from source are impacted, and pinning the tip narrows
  that window slightly more than 1.27.0 would.
- **Ahead of the conservative choice.** A minor-line move is a larger
  step than the patch bumps this repo had been making, taken knowingly.

## Supersedes: nothing (no prior decision recorded on Go version policy)
