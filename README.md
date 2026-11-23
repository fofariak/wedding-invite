# Mandap & Co. wedding invitation site

Created using Anthropic Claude. Keep this note on internal versions until a person has reviewed and verified the site.

## What is in this folder

| Path | What it is |
|---|---|
| `public/` | The live site. Most pages here are generated from `src/`; fonts, icon and `page.css` live here directly |
| `src/` | The editable source: editor, homepage and policy pages, invitation designs (`templates/`), wording per language (`i18n/`), shared invite engine (`engine/`), brand name (`site.json`) |
| `scripts/` | `build.js` rebuilds the pages (Netlify runs it on every deploy), `make-demos.js` refreshes the homepage samples, `check.js` checks everything |
| `netlify/functions/` | Three small server functions that talk to Stripe |
| `netlify.toml` | Tells Netlify how to build and where the pages and functions are |
| `CLAUDE.md` | Instructions Claude Code reads so it can change the site safely |

## How payment works

1. The customer designs and previews for free.
2. "Pay and download" sends them to Stripe's own checkout page. Card details never touch this site.
3. Stripe sends them back, the site confirms the payment with Stripe, and the download unlocks.
4. One payment covers one couple and wedding date. Photos, wording, venue and design can be edited and downloaded again. Changing the names or date needs a new payment.

## Put it on Netlify

Menu names on GitHub, Netlify and Stripe change from time to time; the steps stay the same.

### 1. Stripe account (your finance or tech team)
1. Open a Stripe account in the company's name.
2. Stay in test mode for now and copy the **secret key** that starts with `sk_test_`.
3. Treat that key like a password: paste it only into Netlify in step 4, never into chat, email or these files.

### 2. Put the folder on GitHub
1. Create a GitHub account and a new **private** repository.
2. Choose "upload an existing file" and drag in everything inside this folder, keeping the folders as they are. `.gitignore` is a hidden file; if it does not upload, the site still works.
3. Commit.

### 3. Connect Netlify
1. Sign in to Netlify and choose to add a new project by importing an existing one from GitHub.
2. Pick the repository. Leave the build settings as Netlify fills them in; `netlify.toml` sets them.
3. Deploy. You get an address ending in `netlify.app`.

### 4. Add the settings
In the Netlify project, open the environment variables page and add:

| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | The Stripe secret key |
| `LICENSE_SECRET` | Any long random text (40 or more characters). Never change it later, or past purchases stop unlocking |
| `PRICE_AMOUNT` | Price in the smallest unit, for example `1900` for $19.00 |
| `PRICE_CURRENCY` | For example `usd`, `eur`, `gbp`, `inr`, `aed` |
| `PRODUCT_NAME` | Optional. The name shown on Stripe's page |

Then trigger a new deploy so the settings take effect.

### 5. Test it
1. Open the site, design an invite, press "Pay and download".
2. On Stripe's page use the test card `4242 4242 4242 4242`, any future expiry, any security code.
3. You should return to the editor with the download unlocked. No real money moves in test mode.

### 6. Go live
Replace `STRIPE_SECRET_KEY` with the live key (`sk_live_...`) and deploy again.

## Useful to know

- **Payment methods and countries** are switched on in the Stripe dashboard, not in this code.
- **Free or discounted use for your own teams:** create promotion codes in Stripe (for example 100% off, limited to a number of uses per person). The checkout page has a box for them.
- **Changing the name "Mandap & Co."**: change it in `src/site.json` and rebuild.
- **Changing the homepage samples:** edit the samples in `src/engine/samples.js` and run `node scripts/make-demos.js`.
- **Limits:** the paywall stops ordinary customers. A developer who studies the page code could get around it, because the invite is assembled in the browser.

## Making changes later with Claude Code

1. Clone the repository to your computer and open Claude Code in that folder.
2. Ask in plain words, for example "add a fourth colour theme in navy and gold" or "also accept a second price for a premium design".
3. Claude Code reads `CLAUDE.md`, makes the change, rebuilds, and pushes to GitHub when you approve. Netlify publishes the new version by itself.
