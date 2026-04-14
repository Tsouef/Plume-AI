<p align="center">
  <img src="public/icons/icon-128.png" alt="Plume AI" width="96" />
</p>

# 🪶 Plume AI

> **Stop copy-pasting into ChatGPT. Bring your own AI models directly into any text field on the web.**

[![GitHub stars](https://img.shields.io/github/stars/Tsouef/Plume-AI?style=flat-square&color=ffd700)](https://github.com/Tsouef/Plume-AI/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Privacy: Local First](https://img.shields.io/badge/Privacy-Local--First-green?style=flat-square)](#privacy)
[![A11y: WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-orange?style=flat-square)](#accessibility)

I built Plume AI because I was tired of the "context switch" — opening a new tab, pasting text, asking for a grammar check, and pasting it back. I wanted something that stays out of the way until I need it.

---

## ✨ Why Plume AI?

- **🔌 You own the brain:** No monthly subscriptions. Connect your own API key (Gemini, Claude, OpenAI, Mistral) or run it **100% locally with Ollama**.
- **🛡️ Privacy isn't an afterthought:** Your text is anonymized (emails/phones stripped) before it ever hits an API. The original text is restored after the check.
- **🌍 Native explanations:** It explains grammar mistakes in _your_ native language, even if you're writing in another one. 12 UI languages supported.
- **♿ Built for everyone:** Fully accessible (WCAG 2.1 AA) and keyboard-friendly. No mouse needed.
- **⚡ Zero style-clash:** Injected via Shadow DOM to ensure it never breaks the layout of the website you are visiting.

---

## Features

### Grammar check

Click the **✦** trigger button that appears when you focus any text field — or press **`⌃+Shift+G`** (Ctrl+Shift+G on Mac and Windows/Linux) to open the panel instantly. The extension analyses your text and highlights every grammar, spelling, and word-choice error inline. Each highlight shows the suggested fix and a short explanation. Hit **Fix all** to apply every correction at once.

Text language support: English (US / UK), French, German, Spanish, Dutch — or **auto-detect**.

### Interface language (i18n)

The extension UI and error explanations adapt to your chosen interface language — independently of the language you are writing in. Set your native language once in the popup; the AI will explain grammar mistakes in that language even if the text you are correcting is in a different one.

Supported interface languages: English, English (UK), French, German, Spanish, Dutch, Portuguese (PT), Portuguese (BR), Chinese Simplified, Arabic, Persian, Japanese.

### AI rewrite

Hit **✦ Polish** to let the AI rewrite your full text (or just the selected portion) for clarity and natural flow. Review the suggestion, then accept or dismiss.

### Tone presets

Four one-click tone pills let you reshape your writing without prompting:

| Pill          | What it does                         |
| ------------- | ------------------------------------ |
| **Shorter**   | Cuts filler, keeps the meaning       |
| **Formal**    | Professional tone                    |
| **Direct**    | Removes hedging and filler phrases   |
| **Technical** | Precise, domain-appropriate language |

### Translation

Translate the field's content into any supported language in one click — right from the panel, without leaving the page.

### Manual mode

By default, the extension re-checks your text automatically as you type (debounced). Enable **manual mode** in the popup to check only when you explicitly open the panel — useful for long-form writing or slow connections.

### Privacy

Emails and phone numbers in your text are anonymized before being sent to the AI provider. The original text is restored after the check.

### Per-site permissions

The extension uses `activeTab` and per-domain optional permissions — it never requests blanket access to all URLs. Grant access to a specific site from the popup's **Trusted sites** section; the extension activates on that domain immediately without a page reload. Revoke access at any time.

### Disabled domains

Add domains to a blocklist in the popup so the extension never activates on sites where you don't want it. Domains are saved immediately — no Save click needed.

### Accessibility

Built to WCAG 2.1 AA:

- Full keyboard navigation — Tab through panel, arrow keys on tone pills, Escape to close
- Screen reader support — `aria-live` announcements for all state changes, proper labels throughout
- Focus-visible indicators on all interactive elements
- 4.5:1 minimum contrast ratio on all text
- Respects OS-level reduced motion preference

---

## Setup

### Install from store

- **Chrome**: https://chromewebstore.google.com/detail/plume-ai/bdhogmeklpmmjogifgbkkblkbacdjaco
- **Firefox**: https://addons.mozilla.org/en-US/firefox/addon/plume-ai/

### Chrome

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Build the extension:

   ```bash
   npm run build
   ```

3. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and point it at the `dist/` folder.

4. Open the extension popup, choose your **provider**, enter your API key (or configure the Ollama URL), and set your **interface language**.

### Firefox

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Build the Firefox version:

   ```bash
   npm run build:firefox
   ```

3. Open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on**, and select `dist/manifest.json`.

4. Open the extension popup to configure your provider and language.

### Development mode (watch)

```bash
npm run dev           # Chrome
npm run dev:firefox   # Firefox
```

---

## Providers

Choose any provider in the popup. Each one requires its own API key or local setup.

| Provider             | Where to get a key                                     | Notes                                                                       |
| -------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| **Gemini**           | [aistudio.google.com](https://aistudio.google.com)     | Free tier available                                                         |
| **Claude**           | [console.anthropic.com](https://console.anthropic.com) | Requires billing. Enable "Allow direct browser access" in your org settings |
| **ChatGPT (OpenAI)** | [platform.openai.com](https://platform.openai.com)     |                                                                             |
| **Mistral**          | [console.mistral.ai](https://console.mistral.ai)       |                                                                             |
| **Ollama**           | —                                                      | Run locally. Launch with `OLLAMA_ORIGINS=chrome-extension://* ollama serve` |

Each provider exposes a **model dropdown** in the popup. Pick the model, save once, and you're done. Use the **Test connection** button to verify your key before saving.

---

## How it works

All AI calls go through the **background script** (`src/background/`), never directly from the content script. This keeps API keys out of the page context and lets providers be swapped without touching the UI.

The config is stored as a single namespaced object in `browser.storage.local` — API keys never leave your browser except in the requests you make to the chosen provider.

### Grammar engine

The grammar pipeline includes several reliability layers:

- **Debounce** (1500 ms) — waits for a pause in typing before triggering a check
- **Diff threshold** — skips re-checks when fewer than 3 characters changed
- **LRU cache** (5 entries) — returns cached results instantly for recently-checked text
- **AbortSignal** — cancels in-flight requests when newer input arrives
- **Stale response discarding** — ignores responses from superseded requests
- **Zod schema validation** — parses AI responses against a strict schema; malformed replies are rejected cleanly

### Provider architecture

Every provider implements the `AIProvider` interface (`src/background/providers/types.ts`):

```ts
interface AIProvider {
  checkGrammar(text: string, language: string, uiLanguage: UiLocale): Promise<GrammarError[]>
  rewrite(
    text: string,
    selection: string | undefined,
    language: string,
    tone?: TonePreset
  ): Promise<string>
  translate(text: string, targetLanguage: string): Promise<string>
}
```

The active provider is resolved at request time in `provider-factory.ts` based on the stored config. Adding a new provider means:

1. Create `src/background/providers/my-provider.ts` implementing `AIProvider`
2. Register it in `provider-factory.ts`
3. Add its `id` to the `ProviderId` union in `src/shared/types.ts`
4. Add its models to `PROVIDER_MODELS` in `src/shared/models.ts`

### Current providers

| Provider    | Default model                       |
| ----------- | ----------------------------------- |
| **Gemini**  | `gemini-2.5-flash-lite`             |
| **Claude**  | `claude-haiku-4-5-20251001`         |
| **OpenAI**  | `gpt-4o-mini`                       |
| **Mistral** | `mistral-small-latest`              |
| **Ollama**  | user-selected from running instance |

### Permissions model

The extension uses `activeTab` + `scripting` for baseline access, and `optional_host_permissions: ["<all_urls>"]` for per-domain trust grants. When a user trusts a domain from the popup, the extension requests that specific origin at runtime and injects the content script immediately.

---

## Tech stack

- **React 19** + TypeScript — panel UI and popup
- **Radix UI** — accessible primitives (Dialog, ToggleGroup, Toast) with built-in ARIA
- **i18next** + react-i18next — runtime i18n with 12 locales (RTL support for Arabic and Persian)
- **@floating-ui/dom** — collision-aware panel positioning (flip + shift)
- **Shadow DOM** — the panel is fully isolated from host page styles
- **Zod** — runtime schema validation for AI grammar responses
- **Vite** + `vite-plugin-web-extension` — MV3 build pipeline for Chrome and Firefox
- **Vitest** + Testing Library — unit and component tests
- **vitest-axe** + **eslint-plugin-jsx-a11y** — automated accessibility regression testing
- **Motion** — panel animations with reduced-motion support

---

## Project structure

```
src/
  background/         # Background script — handles all AI API calls
    providers/        # AIProvider interface + Gemini, Claude, OpenAI, Mistral, Ollama
  content/            # Content script injected into trusted tabs
    components/       # React UI (GrammarPanel, TriggerButton, ShadowPortal…)
    hooks/            # useFieldDetector, usePanelOrchestration, useFloatingPosition,
                      # useFocusOnOpen, useRestoreFocus, usePanelState…
    utils/            # Grammar checker, AI rewrite, text apply, field detector
  popup/              # Extension popup (settings)
    components/       # ProviderSection, LanguageSection, ManualModeSection,
                      # ThemeSection, DisabledSitesSection, SitePermissionSection…
  shared/
    components/       # VisuallyHidden (a11y sr-only utility)
    i18n/             # i18next setup + locale JSON files (en, en-GB, fr, de, es, nl, zh, ar, fa, ja, pt-PT, pt-BR)
    pii.ts            # PII anonymization (email, phone) before AI calls
                      # Types, constants, storage, config defaults, provider models
```

---

## Roadmap

- **Slack app** — expose the AI pipeline as a Bolt app. Grammar check and rewrite could run on message compose via a slash command or a message action, using the same prompt layer.
- **Web app / bookmarklet** — a standalone page that accepts pasted text and runs the full pipeline, no install required.
- **More languages** — adding a new interface language means adding a locale JSON file in `src/shared/i18n/locales/` and registering it in `i18n.ts`.
- **Custom tone presets** — let users define their own tone instructions in the popup.

---

## Scripts

| Command                 | Description                      |
| ----------------------- | -------------------------------- |
| `npm run dev`           | Watch build for Chrome           |
| `npm run dev:firefox`   | Watch build for Firefox          |
| `npm run build`         | Production build for Chrome      |
| `npm run build:firefox` | Production build for Firefox     |
| `npm test`              | Run unit tests                   |
| `npm run test:coverage` | Run unit tests with coverage     |
| `npm run lint`          | ESLint (includes jsx-a11y rules) |
| `npm run typecheck`     | TypeScript type check            |

---

## Privacy

See the [Privacy Policy](PRIVACY.md) for full details. In brief: zero data collection — API keys stay in your browser, text goes directly to your chosen AI provider, and built-in PII anonymization strips emails and phone numbers before any AI call.

---

## Contributing

Issues and PRs welcome. Run `npm test && npm run lint && npm run typecheck` before submitting.
