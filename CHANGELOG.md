# Changelog

All notable changes to Chore Champs are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-11-27

### Added
- Kid profiles with emoji avatars and colors.
- Parent mode protected by a 4-6 digit PIN (stored only as a salted SHA-256 hash).
- Chores with point values, assigned kids, and daily / specific weekdays / weekly / one-time schedules.
- Kid board with big tap-to-complete chore cards; completions wait for parent approval.
- Parent approvals queue with approve, reject, optional bonus points and "approve all".
- Rewards with point costs; kids can request a reward or redeem it on the spot with the parent PIN.
- Optional allowance conversion (points per currency unit) with running balance and cash-out.
- Daily streaks (current and best), confetti celebration on approval, and weekly summary per kid.
- JSON export / import, reset-all-data with confirmation, IndexedDB storage with localStorage fallback.
- Installable offline PWA, light and dark themes, hash routing.
- In-app feedback: "Report a bug" / "Request a feature" links that open pre-filled GitHub issue forms.
- GitHub issue templates (bug report, feature request) and a contributing / triage guide.

### Changed
- Nothing yet (first release).

### Fixed
- Nothing yet (first release).

[Unreleased]: https://github.com/lance6x5/chore-board/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/lance6x5/chore-board/releases/tag/v1.0.0
