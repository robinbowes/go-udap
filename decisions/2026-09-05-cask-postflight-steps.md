## Decision: Emit the cask's quarantine step as `postflight_steps` via GoReleaser's `custom_block`, and let the tap's `brew style --fix` place it

Replace `homebrew_casks[0].hooks.post.install` with a `custom_block` that
carries the whole stanza verbatim:

```ruby
postflight_steps do
  on_macos do
    run "/usr/bin/xattr", args: ["-dr", "com.apple.quarantine", "{{staged_path}}/go-udap"]
  end
end
```

GoReleaser writes `custom_block` immediately after the `cask ... do` line, which
is the wrong slot for this stanza. That is left to the tap's existing
`brew style --fix` normalisation step, which moves it below the completions —
verified end to end against a snapshot render.

## Context

Homebrew deprecated the imperative `preflight`/`postflight` stanzas in favour of
the declarative `*_steps` DSL. Every `brew` command that loads the cask now
prints:

```
Warning: Calling `postflight` is deprecated! Use `postflight_steps` instead.
```

and `Cask/InstallSteps` fails `brew style`, so the tap's daily sweep went red
on 2026-09-05 and would have ambushed the next release bump. That sweep was set
up for exactly this drift; see yo61/homebrew-tap
`decisions/2026-08-12-scheduled-tap-style-autofix.md`.

GoReleaser's `hooks.post.install` renders `postflight do` and nothing else; the
wrapper is hardcoded in its cask template, and v2.18.0 (current) has no
`postflight_steps` support. So the stanza cannot come from `hooks`.

`brew style --fix` autocorrects `Cask/StanzaOrder` — it relocates whole blocks —
but not `Cask/InstallSteps`, which only reports. The tap's normalisation step
could therefore never have converted the deprecated form on its own; it can only
move a correctly written one.

## Alternatives considered

- **Wait for GoReleaser to support `postflight_steps`.** Rejected: no upstream
  support in the current release, and the tap is red now.
- **Keep `hooks.post.install` and convert downstream.** Rejected: `brew style
  --fix` provably does not autocorrect this cop (`1 file inspected, 1 offense
  detected`, empty diff), so there is nothing to convert with.
- **Pass the path as `"#{staged_path}/go-udap"`.** Rejected: steps are
  serialised to JSON and executed in a sandbox, so they cannot evaluate Ruby.
  Homebrew's own cop only allows `{{...}}` template tokens here.
- **`chdir` to the staged path and name the binary relatively.** Rejected: the
  relative form hides which file is being modified from anyone reading the cask
  in the tap, to save one escape in a config file nobody reads at install time.
- **Drop the quarantine step.** Rejected: the binaries are unsigned, and
  Gatekeeper blocks a quarantined unsigned executable.

## Reasoning

- **`{{staged_path}}` over a relative path.** The cask is the artefact humans
  read; naming the full path there is worth the escaping cost in
  `.goreleaser.yaml`.
- **The token is escaped as `{{ `{{staged_path}}` }}`.** GoReleaser runs
  `custom_block` through Go's `text/template`, where a bare `{{staged_path}}`
  fails the release with `function "staged_path" not defined`. The backticked
  raw string emits the braces literally.
- **Lean on the tap's existing normalisation rather than fighting placement.**
  That step already exists for exactly this class of mismatch, and it is the
  same command `tests.yaml` gates on, so a green `--fix` is a green gate.
- **Fix the tap's checked-in cask in the same change.** Regenerating on the next
  release would leave the warning and the red daily sweep standing until then;
  the hand-applied stanza is byte-identical to the generated one.

## Trade-offs accepted

- The rendered `dist/homebrew/Casks/go-udap.rb` is not style-clean on its own —
  it depends on the tap normalising it. That coupling already existed (see the
  cited tap decision) and is now load-bearing for a second reason.
- One more Go-template escape in `.goreleaser.yaml`, which reads badly. The
  comment above it carries the explanation.

## Supersedes

Nothing. Extends the migration recorded in yo61/homebrew-tap
`decisions/2026-07-21-cask-signed-release-flow.md`, splitting cask generation
here from landing in the tap.

Both cross-repo references above name files in the tap, not this repo — neither
exists under `decisions/` here.
