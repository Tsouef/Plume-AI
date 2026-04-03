# Grammar Assistant

A Chrome extension that brings AI-powered grammar checking, rewriting, and translation directly into any text field on the web — no copy-pasting, no context switching.

Powered by the **Gemini API** (free tier works).

---

## Features

### Grammar check
Click the **✦** trigger button that appears when you focus any text field. The extension analyses your text and highlights every grammar, spelling, and word-choice error inline. Each highlight shows the suggested fix and a short explanation. Hit **Fix all** to apply every correction at once.

Language support: English (US / UK), French, German, Spanish, Dutch — or **auto-detect**.

### AI rewrite
Hit **✦ Improve** to let the AI rewrite your full text (or just the selected portion) for clarity and natural flow. Review the diff, then accept or dismiss.

### Tone presets
Four one-click tone pills let you reshape your writing without prompting:

| Pill | What it does |
|------|-------------|
| **Shorter** | Cuts filler, keeps the meaning |
| **Formal** | Professional tone |
| **Direct** | Removes hedging and filler phrases |
| **Technical** | Precise, domain-appropriate language |

### Translation
Translate the field's content into any supported language in one click — right from the panel, without leaving the page.

### Disabled domains
Add domains to a blocklist in the popup so the extension never activates on sites where you don't want it.

---

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Build the extension:
   ```bash
   npm run build
   ```

3. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and point it at the `dist/` folder.

4. Open the extension popup and paste your **Gemini API key** (get one free at [aistudio.google.com](https://aistudio.google.com)).

### Development mode (watch)
```bash
npm run dev
```

---

## How it works

All AI calls go through the **background service worker** (`src/background/`), never directly from the content script. This keeps API keys out of the page context and lets providers be swapped without touching the UI.

### Provider architecture

Every provider implements the `AIProvider` interface (`src/background/providers/types.ts`):

```ts
interface AIProvider {
  checkGrammar(text: string, language: string): Promise<GrammarError[]>
  rewrite(text: string, selection: string | undefined, language: string, tone?: TonePreset): Promise<string>
  translate(text: string, targetLanguage: string): Promise<string>
}
```

The active provider is resolved at request time in `provider-factory.ts` based on the stored config. Adding a new provider means:

1. Create `src/background/providers/my-provider.ts` implementing `AIProvider`
2. Register it in `provider-factory.ts`
3. Add its `id` to the `ProviderId` union in `src/shared/types.ts`
4. Add a UI entry in the popup's `ApiKeySection`

### Current providers

| Provider | Model | Notes |
|----------|-------|-------|
| **Gemini** | `gemini-2.5-flash-lite` | Default. Free tier available at [aistudio.google.com](https://aistudio.google.com) |

### Adding your Gemini API key

1. Go to [aistudio.google.com](https://aistudio.google.com) → **Get API key**
2. Click the extension icon in the Chrome toolbar
3. Paste the key in the **API Key** field and save

The key is stored in `chrome.storage.local` — it never leaves your browser except in the requests you make to Gemini.

---

## Tech stack

- **React 19** + TypeScript — panel UI and popup
- **Shadow DOM** — the panel is fully isolated from host page styles
- **Vite** + `vite-plugin-web-extension` — MV3 build pipeline
- **Vitest** + Testing Library — unit and component tests
- **Motion** — panel animations
- **Gemini API** — grammar, rewrite, and translation inference

---

## Project structure

```
src/
  background/         # Service worker — handles Gemini API calls
    providers/        # AIProvider interface + Gemini implementation
  content/            # Content script injected into every tab
    components/       # React UI (GrammarPanel, TriggerButton, ShadowPortal…)
    hooks/            # useFieldDetector, usePanelOrchestration, usePanelState…
    utils/            # Grammar checker, AI rewrite, text apply, field detector
  popup/              # Extension popup (settings)
    components/       # ApiKeySection, LanguageSection, DisabledSitesSection…
  shared/             # Types, constants, storage, config defaults
```

---

## Roadmap

The core AI pipeline (grammar / rewrite / translate) is intentionally decoupled from the Chrome extension shell. The goal is to make the same functionality available across platforms:

- **Firefox** — MV3 support arrived in Firefox 109; a Firefox build should require only manifest adjustments and a few Web Extension API polyfills.
- **Slack app** — expose the AI pipeline as a Bolt app. Grammar check and rewrite could run on message compose via a slash command or a message action, using the same prompt layer.
- **Web app / bookmarklet** — a standalone page that accepts pasted text and runs the full pipeline, no install required.
- **Additional providers** — the `AIProvider` interface in `src/background/providers/types.ts` is designed to be extended. OpenAI, Claude, and Mistral could be added as drop-in providers.
- **More languages** — the language list in `src/shared/languages.ts` is a short array; adding entries is the only change needed on the frontend side.
- **Custom tone presets** — let users define their own tone instructions in the popup.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Watch build (reload extension after each change) |
| `npm run build` | Production build |
| `npm test` | Run unit tests |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |

---

## Contributing

Issues and PRs welcome. Run `npm test && npm run lint && npm run typecheck` before submitting.
