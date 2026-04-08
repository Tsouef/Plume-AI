# Plume AI — Privacy Policy

**Last updated: 2026-04-07**

## Overview

Plume AI is a browser extension that helps you check grammar, rewrite text, and translate content using AI. This privacy policy explains how the extension handles your data.

The extension works by connecting to AI providers you configure yourself (Gemini, Claude, OpenAI, Mistral, or Ollama). You provide your own API keys. All configuration and preferences are stored locally on your device. We do not operate any server that receives, stores, or processes your data.

## Data We Don't Collect

We collect **zero data**. Specifically:

- **No analytics or telemetry** — we don't track how you use the extension, which features you use, or any usage statistics
- **No cookies** — the extension does not use cookies or other tracking technologies
- **No tracking pixels or scripts** — the extension does not load external tracking resources
- **No server logs** — we don't operate a server that logs your activity
- **No telemetry to Anthropic** — we don't send usage data anywhere

The extension is entirely self-contained. It runs on your device and communicates only with the AI provider you choose.

## Local Storage Only

All data is stored locally on your device using `chrome.storage.local`:

- Your API keys for each provider (Gemini, Claude, OpenAI, Mistral, Ollama)
- Your preference settings (which providers are enabled, model selections, disabled domains)
- Your interface language preference
- Keyboard shortcut preferences

This data **never leaves your device** except when you explicitly send text for AI processing (see the next section).

## AI Provider Requests

When you use the extension to check grammar, rewrite, or translate text:

1. The text is sent directly from the extension to the AI provider you configured
2. We do **not proxy, relay, log, or store** these requests
3. You have a direct connection from your device to the provider's API
4. The provider (Gemini, Claude, OpenAI, Mistral, or Ollama) is responsible for handling that request according to their own privacy policy

Your API key is stored locally and used only to authenticate your requests to the provider.

## PII Anonymization

The extension includes a built-in **PII anonymization feature** that:

1. Detects email addresses and phone numbers in the text you're sending to the AI
2. Replaces them with placeholder tokens (e.g., `[EMAIL]`, `[PHONE]`) before sending to the AI provider
3. Restores the original values locally after receiving the AI's response

This happens entirely on your device. The original email/phone data is never sent to the AI provider, and the placeholders are not logged anywhere.

You can enable or disable this feature in the extension settings.

## Permissions

The extension requests these permissions:

- **`storage`** — to save your API keys and preferences in `chrome.storage.local`
- **`scripting`** — to inject the extension's content script into web pages so you can use grammar/rewrite/translate features on any text field
- **`activeTab`** — to access the currently active tab when you click the extension button in the toolbar
- **`tabs`** — to communicate between the background script and content script on different tabs

**Host permissions** (e.g., `*://*.example.com/*`) are **optional**. They are granted explicitly by you at runtime when you click the "Grant access" button in the popup for a specific site. These permissions allow the extension to detect text fields on that site.

No permissions are sent to us. All permission grants stay on your device.

## Third-Party AI Providers

The text you send to AI providers is subject to their privacy policies:

- **Gemini** (Google) — [google.com/policies/privacy](https://google.com/policies/privacy)
- **Claude** (Anthropic) — [anthropic.com/privacy](https://anthropic.com/privacy)
- **ChatGPT** (OpenAI) — [openai.com/privacy](https://openai.com/privacy)
- **Mistral** (Mistral AI) — [mistral.ai/privacy](https://mistral.ai/privacy)
- **Ollama** — If self-hosted, your own terms apply

Please review the privacy policy of whichever provider you choose before using the extension.

## Open Source

Plume AI is open source. You can review the source code at: [GitHub repository](https://github.com/tsouef/plume-ai).

## Contact

If you have privacy questions about the extension, contact:

**souef.thibault@gmail.com**
