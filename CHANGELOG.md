# Changelog

All notable changes to Plume AI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
