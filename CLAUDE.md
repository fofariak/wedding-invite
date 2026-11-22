
## What this is

A small website that sells animated wedding invitations. Visitors design an invite for free in the editor, see a watermarked live preview, pay once through Stripe Checkout, and download the finished invite as one self-contained HTML file. Hosted on Netlify, deployed from this GitHub repository. No framework, no npm dependencies.

## Layout

| Path | Role | Edit it? |
|---|---|---|
| `src/studio.src.html` | The editor page: form, preview, paywall, autosave. Has three slots: `__TEMPLATE__`, `__THEMES__`, `__EMBLEMS__` | Yes |
| `src/invite-template.html` | The invitation itself, with `%%TOKEN%%` placeholders filled by `build()` in the editor | Yes |
| `src/themes.json` | Colour themes: a colour-replacement `map` plus flower colours per theme | Yes |
| `src/emblems.json` | SVG emblem per tradition (`ganesha`, `star`, `monogram`) | Yes |
| `scripts/build.js` | Combines the four files above into `public/studio.html` | Rarely |
| `public/studio.html` | Build output | Never by hand |
| `public/index.html` | Homepage | Yes |
| `public/demo-*.html` | Sample invites shown on the homepage. To refresh one, download an invite from the editor and save it over the file | Replace only |
| `netlify/functions/config.js` | Returns price, currency, and whether payments are configured | Yes |
| `netlify/functions/create-checkout.js` | Creates a Stripe Checkout Session | Yes |
| `netlify/functions/verify.js` | Confirms a paid session and issues or checks a licence token | Yes |
| `netlify.toml` | Netlify build settings | Rarely |

## Working rules

1. After any change in `src/`, run `node scripts/build.js` and commit the rebuilt `public/studio.html` along with the source.
2. Never put a Stripe key, the licence secret, or any other credential in a file, a commit, or the chat. Secrets live only in Netlify environment variables. If the user offers a key, ask them to add it in the Netlify dashboard instead.
3. The charged price must stay server-side (`PRICE_AMOUNT`, `PRICE_CURRENCY`). The browser only displays what `config` returns.
4. Never change how the licence token is computed or rename `LICENSE_SECRET` without telling the user that existing purchases will stop unlocking.
5. Everything typed by a visitor goes through `esc()` (HTML) or `js()` (inside scripts) in `build()`. Keep it that way for any new field.
6. Keep the functions dependency-free (Node built-ins and `fetch` only) unless the user agrees to add a `package.json`.
7. Deploying is `git push` to the main branch; Netlify builds and publishes on its own. Describe the change and ask before pushing.

## How payment works

1. The editor hashes `name1|name2|date` (lower-cased, trimmed) with SHA-256. That hash is the invite key.
2. `create-checkout` creates a Stripe Checkout Session with `metadata.invite_key` set to the key and returns Stripe's URL. The draft is saved to IndexedDB before redirecting.
3. Stripe returns the buyer to `/studio.html?paid=<session id>`. `verify` (GET) fetches the session from Stripe and, if it is complete and paid (or free through a promotion code), returns `HMAC-SHA256(LICENSE_SECRET, key)` as the licence token.
4. The token is stored in `localStorage` (`inviteLicences`) and inside saved project files. Before each download, `verify` (POST) re-checks it.
5. A licence removes the preview watermark and enables download for that key only. Changing names or date produces a new key and needs a new payment.

Known limit: the invite is assembled in the browser, so the paywall deters ordinary customers but not someone who reads the page code. Closing that gap means rendering or hosting invites on the server.

## Environment variables (set in Netlify)

| Name | Meaning |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` for test mode, `sk_live_...` for real payments |
| `LICENSE_SECRET` | Long random string used to sign licences |
| `PRICE_AMOUNT` | Price in the currency's smallest unit (default `1900`) |
| `PRICE_CURRENCY` | ISO code, lower case (default `usd`) |
| `PRODUCT_NAME` | Optional name shown on Stripe's page |

## Common requests

- **Change the price or currency:** Netlify environment variables, then redeploy. No code change.
- **Rename the brand:** replace "Mandap & Co." in `public/index.html` and `src/studio.src.html`, rebuild.
- **Add a form field:** add a default in `defaults()`, an input in `render()`, a token in `src/invite-template.html`, and its value in the `V` map inside `build()`.
- **Add a colour theme:** add an entry to `src/themes.json` shaped like the existing ones.
- **Add a tradition:** add to `TRAD` and `sample()` in `src/studio.src.html`, and an emblem in `src/emblems.json`.
- **Add function artwork:** add an icon `<symbol>` and an `SC.<name>` scene in `src/invite-template.html`, then a line in `STYLES`.

## Checking a change

1. `node scripts/build.js` finishes without error.
2. `node --check netlify/functions/*.js` passes.
3. For payment changes, use `netlify dev` if the Netlify CLI is available, with a Stripe test key supplied by the user through their own environment, and pay with card `4242 4242 4242 4242`.
4. In the browser: the preview shows the PREVIEW mark before paying, the button reads "Pay ... and download", and after a test payment the mark is gone and the download works.
