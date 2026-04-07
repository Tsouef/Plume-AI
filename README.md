# Plume AI

A browser extension (Chrome + Firefox) that brings AI-powered grammar checking, rewriting, and translation directly into any text field on the web — no copy-pasting, no context switching.

Works with **Gemini, Claude, OpenAI, Mistral, and Ollama**. Pick the provider and model that fits your setup.

---

## Features

### Grammar check

Click the **✦** trigger button that appears when you focus any text field. The extension analyses your text and highlights every grammar, spelling, and word-choice error inline. Each highlight shows the suggested fix and a short explanation. Hit **Fix all** to apply every correction at once.

Text language support: English (US / UK), French, German, Spanish, Dutch — or **auto-detect**.

### Interface language (i18n)

The extension UI and error explanations adapt to your chosen interface language — independently of the language you are writing in. Set your native language once in the popup; the AI will explain grammar mistakes in that language even if the text you are correcting is in a different one.

Supported interface languages: English, English (UK), French, German, Spanish, Dutch.

### AI rewrite

Hit **✦ Improve** to let the AI rewrite your full text (or just the selected portion) for clarity and natural flow. Review the diff, then accept or dismiss.

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

### Disabled domains

Add domains to a blocklist in the popup so the extension never activates on sites where you don't want it. Domains are saved immediately — no Save click needed.

---

## Setup

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

Each provider exposes a **model dropdown** in the popup. Pick the model, save once, and you're done.

---

## How it works

All AI calls go through the **background script** (`src/background/`), never directly from the content script. This keeps API keys out of the page context and lets providers be swapped without touching the UI.

The config is stored as a single namespaced object in `browser.storage.local` — API keys never leave your browser except in the requests you make to the chosen provider.

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

---

## Tech stack

- **React 19** + TypeScript — panel UI and popup
- **i18next** + react-i18next — runtime i18n with 6 locales
- **Shadow DOM** — the panel is fully isolated from host page styles
- **Vite** + `vite-plugin-web-extension` — MV3 build pipeline for Chrome and Firefox
- **Vitest** + Testing Library — unit and component tests
- **Motion** — panel animations

---

## Project structure

```
src/
  background/         # Background script — handles all AI API calls
    providers/        # AIProvider interface + Gemini, Claude, OpenAI, Mistral, Ollama
  content/            # Content script injected into every tab
    components/       # React UI (GrammarPanel, TriggerButton, ShadowPortal…)
    hooks/            # useFieldDetector, usePanelOrchestration, usePanelState…
    utils/            # Grammar checker, AI rewrite, text apply, field detector
  popup/              # Extension popup (settings)
    components/       # ProviderSection, LanguageSection, DisabledSitesSection…
  shared/
    i18n/             # i18next setup + locale JSON files (en, fr, de, es, nl, en-GB)
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

| Command                 | Description                  |
| ----------------------- | ---------------------------- |
| `npm run dev`           | Watch build for Chrome       |
| `npm run dev:firefox`   | Watch build for Firefox      |
| `npm run build`         | Production build for Chrome  |
| `npm run build:firefox` | Production build for Firefox |
| `npm test`              | Run unit tests               |
| `npm run lint`          | ESLint                       |
| `npm run typecheck`     | TypeScript type check        |

---

## Contributing

Issues and PRs welcome. Run `npm test && npm run lint && npm run typecheck` before submitting.
