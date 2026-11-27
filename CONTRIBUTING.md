# Contributing to Chore Champs

Thanks for helping! Bugs and ideas are tracked as [GitHub Issues](https://github.com/lance6x5/chore-board/issues).

## Triage flow

1. **New issue** - filed via the in-app *Feedback* menu or the issue forms
   ([bug report](https://github.com/lance6x5/chore-board/issues/new?template=bug_report.yml),
   [feature request](https://github.com/lance6x5/chore-board/issues/new?template=feature_request.yml)).
   Every new issue automatically gets the `triage` label plus `bug` or `enhancement`.
2. **Triage** - the maintainer reviews it, asks questions if needed, removes `triage`
   and relabels (or closes it as a duplicate / won't fix).
3. **Work** - happens on a branch (e.g. `fix/123-streak-reset`), opened as a pull request
   whose description includes `Fixes #123` so the issue closes automatically when merged.
4. **Release** - changes are recorded under *Unreleased* in [CHANGELOG.md](CHANGELOG.md),
   then moved to a versioned section when a release is tagged.

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

Please keep the app 100% client-side, never commit secrets, and don't include personal data in issues.
