# Plume AI — Store Submission Guide

A step-by-step guide to submit Plume AI to the Chrome Web Store and Firefox Add-ons (AMO).

## Prerequisites

- **Chrome Web Store**: Create a Chrome Developer account at [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole). One-time $5 registration fee.
- **Firefox Add-ons (AMO)**: Create a Mozilla Developer account at [addons.mozilla.org/developers](https://addons.mozilla.org/developers). Free.
- **GitHub**: The repository must be public so store reviewers can verify the open-source code.

## Before Submitting

Build the release zips:

```bash
npm run build:zip
npm run build:zip:firefox
```

This creates:

- `releases/plume-ai-<version>-chrome.zip`
- `releases/plume-ai-<version>-firefox.zip`

Replace `<version>` with the actual version number (e.g., `1.0.0`).

## Chrome Web Store Submission

### Step-by-step

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **"New Item"**
3. Upload `releases/plume-ai-<version>-chrome.zip`
4. Fill in the **Store Listing** tab:
   - **Name**: Copy from `store/listing.md` → Chrome Web Store → Name
   - **Short description**: Copy from `store/listing.md` → Chrome Web Store → Short description
   - **Detailed description**: Copy from `store/listing.md` → Long Description section
5. Upload **Screenshots** (minimum 1 required):
   - Recommended size: 1280x800 or 640x400
   - Capture from `store/mockups/` HTML files if available
   - Show the grammar checker panel, settings popup, and translation features
6. Upload **Promotional images**:
   - **Tile image** (440x280): generated from `store/mockups/promo-tile.html`
   - **Marquee image** (1400x560): generated from `store/mockups/promo-marquee.html`
7. Go to the **Privacy** tab:
   - Set the privacy policy URL to: `https://github.com/<YOUR_USERNAME>/<YOUR_REPO>/blob/main/PRIVACY.md`
   - Replace `<YOUR_USERNAME>` and `<YOUR_REPO>` with actual values
8. Complete the **Privacy Practices Questionnaire**:
   - "Does this extension remotely install and execute code?": **No**
   - "Does this extension collect user data?": **No**
9. In the **Reviewer Notes** field, paste the reviewer notes (see section below)
10. Click **"Submit for Review"**

**Typical review time**: 1–3 business days.

## Firefox Add-ons (AMO) Submission

### Step-by-step

1. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers)
2. Click **"Submit a New Add-on"**
3. Choose **"On this site"** (not "Sign in with GitHub")
4. Upload `releases/plume-ai-<version>-firefox.zip`
5. Fill in the **Listing** form:
   - **Name**: Copy from `store/listing.md` → Firefox Add-ons (AMO) → Name
   - **Summary**: Copy from `store/listing.md` → Firefox Add-ons (AMO) → Summary
   - **Description**: Copy from `store/listing.md` → Long Description section
6. Upload at least 1 **Screenshot** (recommended 1280x800 or 640x400)
7. Set the **Privacy Policy URL**: `https://github.com/<YOUR_USERNAME>/<YOUR_REPO>/blob/main/PRIVACY.md`
8. In the **Reviewer Notes** field, paste the reviewer notes (see section below)
9. Submit

**Typical review time**: hours to a few days.

## Reviewer Notes Template

Copy and paste this into the reviewer notes field on both stores (adjust as needed):

---

### How It Works

- **Direct AI calls**: All text is sent directly from the extension to the user's configured AI provider (Gemini, Claude, OpenAI, Mistral, Ollama). No proxy or server of ours is involved.
- **No data collection**: The extension does not collect, log, or store any user data or usage metrics.
- **Local storage only**: API keys and preferences are stored in `chrome.storage.local` and never transmitted to our servers.
- **Host permissions**: Host permissions (e.g., `*://*.example.com/*`) are optional and granted explicitly by the user in the popup per-site. They are not collected or shared with us.
- **Scripting permission**: Used to inject the content script into user-trusted domains only to enable the grammar/rewrite/translate features on text fields. No external scripts are loaded.
- **PII anonymization**: The extension includes a built-in feature that replaces email addresses and phone numbers with placeholders before sending text to the AI provider. Original values are restored locally after.
- **Open source**: Full source code is available on GitHub for verification: `https://github.com/<YOUR_USERNAME>/<YOUR_REPO>`

---

## After Publication

Once the extension is published on both stores:

1. Update `README.md` with links to the published extensions:
   - Chrome Web Store link
   - Firefox Add-ons link
2. Uncomment or add store badges (if any placeholders exist in the README)
3. Update the project documentation to reference the official store links
4. Run `npm run release [patch|minor|major]` to bump the version, update the changelog, and create the tag. Then push: `git push && git push --tags`
   - This will automatically trigger the `.github/workflows/release.yml` workflow to create a GitHub Release

## Troubleshooting

### Chrome Web Store

- **"Invalid package"**: Ensure the ZIP file was created by `npm run build:zip` and contains all necessary files
- **"Missing permissions justification"**: Complete the "Reviewer Notes" field explaining what each permission does
- **"Privacy policy required"**: The privacy policy URL must be valid and publicly accessible

### Firefox Add-ons

- **ZIP upload fails**: Verify the ZIP is valid with `unzip -t releases/plume-ai-<version>-firefox.zip`
- **"Manifest version not supported"**: Firefox MV3 requires Gecko API adapter in the manifest (should be auto-handled by build)
- **"Privacy policy missing"**: URL must be publicly accessible and reference the extension

## Store Listings Reference

Full store copy is available in `store/listing.md` for copy-pasting into each store dashboard.
