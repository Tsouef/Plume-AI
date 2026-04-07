# TODOS

Deferred items from the 2026-04-05 CEO quality review. None of these are blockers for the current release.

## v2 Features

### Real-time inline underlines (as-you-type grammar)

Requires a text-position overlay rendered over the focused field, with a ~1.5s debounce to avoid hammering the AI provider. High priority for v2 — this is the UX that closes the gap with Grammarly.

### Extension icon badge (error count)

Use `chrome.action.setBadgeText` to show the current error count in the toolbar icon. Requires the content script to send the error count to the background service worker after each grammar check.

### Copy corrected text button

One-click copy that applies all grammar corrections in memory and puts the fully corrected text on the clipboard — no mutation of the actual field. Complements the Apply All button for read-only or form contexts.

## Known Gaps

### Subdomain support for disabled domains

`disabledDomains` currently does an exact `hostname` match. Disabling `google.com` does not disable `mail.google.com`. Fix: check if the current hostname ends with `.{domain}` or equals `{domain}` when testing against each entry.

### Wildcard domain patterns (`*.google.com`)

Allow users to enter `*.google.com` in the disabled domains list to match all subdomains at once. Requires replacing the exact string comparison with a simple glob/pattern matcher. Builds on the subdomain support fix above.

## Tech Debt

### Config schema versioning

Add `version: 1` to the `Config` type. This is NOT a standalone change — it requires a coordinated migration step in `storage.ts` (similar to the existing `migrateFromFlatKeys` function). Adding `version` to the type without a migration will silently produce `undefined` for existing users' stored configs on first load after upgrade.
