# Changelog

All notable changes to Plume AI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-04-08

### Changed

- feat: redesign site permissions, fix provider config, remove disabledDomains
- i18n: add siteNotEnabled and siteEnabled keys to all locales
- feat: add full store publishing kit (release scripts, CI, privacy policy, listing, mockups, MIT license)
- docs: update README for new locales and RTL support
- feat: add zh/ar/fa/ja/pt locales, RTL support, and Firefox fixes
- feat: replace ✦ symbol with extension icon in trigger button and popup header
- fix: PII anonymization with token restore, textarea text reading, keyboard shortcut
- feat: localized prompt examples, Zod response parsing, provider test connection, content script resilience
- feat(a11y): WCAG 2.1 AA compliance — Radix UI, focus management, screen reader support, axe tests
- feat: grammar engine improvements — debounce, caching, abort, PII, manual mode, permissions, floating UI, iframe and shadow DOM support
- feat: add grammar performance constants (debounce, diff threshold, cache size)
- feat: grammar engine overhaul, prompt optimization, UI polish
- feat: quality improvements — a11y, i18n, refactoring, tests, CI
- feat: add Firefox support with dual-browser build pipeline
- feat: fix all tests, add pre-commit hooks and CI pipeline
- feat: add dark/light theme switcher with per-user persistence
- feat: improve error display and grammar correction quality
- feat: add i18n support with 6 locales and per-user UI language setting
- docs: update README for multi-provider support
- feat: add multi-provider support, fix config storage, disabled domains
- feat: initial commit — TranslateAI Chrome extension

## [1.0.0] - 2026-04-07

### Added

- Grammar checking with inline error highlights and one-click "Fix all"
- AI rewrite (Polish) for full text or selection
- Tone presets: Shorter, Formal, Direct, Technical
- Translation to any supported language
- Manual mode (check on demand instead of auto)
- PII anonymization (emails, phone numbers) before AI calls
- Per-site permission grants with runtime host permissions
- Disabled domains blocklist
- Support for Gemini, Claude, OpenAI, Mistral, and Ollama providers
- Model selection per provider
- Test connection button for API key validation
- Interface language support: EN, EN-GB, FR, DE, ES, NL, PT-PT, PT-BR, ZH, AR, FA, JA
- Keyboard shortcut: Ctrl+Shift+G / MacCtrl+Shift+G
- Shadow DOM isolation for content script UI
- Accessible UI (WCAG 2.1 AA): keyboard nav, screen reader, focus indicators, contrast, reduced motion
- Collision-aware panel positioning with @floating-ui/dom
- Cross-browser support: Chrome (MV3) and Firefox (MV3 with Gecko adapter)
