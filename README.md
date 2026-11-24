# Mandap & Co. wedding invitation site

Created using Anthropic Claude. Keep this note on internal versions until a person has reviewed and verified the site.

## What is in this folder

| Path | What it is |
|---|---|
| `public/` | The live site. Most pages here are generated from `src/`; fonts, icon and `page.css` live here directly |
| `src/` | The editable source: editor, homepage and policy pages, invitation designs (`templates/`), wording per language (`i18n/`), shared invite engine (`engine/`), brand name (`site.json`) |
| `scripts/` | `build.js` rebuilds the pages (Netlify runs it on every deploy), `make-demos.js` refreshes the homepage samples, `check.js` checks everything |
| `netlify/functions/`, `netlify/lib/` | Server functions: hosted invitations, guest pages, Razorpay payments |
| `tests/` | Automatic checks for the server functions (`npm test`) |
| `netlify.toml` | Tells Netlify how to build and where the pages and functions are |
| `CLAUDE.md` | Instructions Claude Code reads so it can change the site safely |

## How it works for customers

1. The customer designs and previews for free (with a PREVIEW mark).
2. "Pay and publish" opens Razorpay's payment window (UPI, cards and more). Payment details never touch this site.
3. The site checks the payment with Razorpay, saves the invitation, and gives the customer:
   - a **guest link** to share on WhatsApp, and
   - a **private edit link** to change anything later, unpublish or delete.
4. Invitations go offline automatically 12 months after the wedding date.

## Put it on Netlify

Menu names on GitHub, Netlify and Razorpay change from time to time; the steps stay the same.

### 1. Razorpay account
1. Open a Razorpay account for the business (an Indian business with KYC is needed).
2. In the Razorpay Dashboard, switch to **Test Mode**, open **Account & Settings → API Keys** and generate a test key. You get a **Key ID** (`rzp_test_...`) and a **Key Secret**.
3. Treat the secret like a password: paste it only into Netlify in step 4, never into chat, email or these files.

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
| `RAZORPAY_KEY_ID` | The Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | The Razorpay Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Any long random text; use the same text in the webhook below |
| `PRICE_AMOUNT` | Price in the smallest unit, for example `49900` for ₹499.00 |
| `PRICE_CURRENCY` | For example `inr` |

Then in the Razorpay Dashboard open **Webhooks → Add new webhook**:
- **URL:** `https://<your-site>/api/razorpay-webhook`
- **Secret:** the same text as `RAZORPAY_WEBHOOK_SECRET`
- **Events:** `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`

Trigger a new deploy so the settings take effect.

### 5. Test it
1. Open the site, design an invite, press "Pay and publish".
2. In Razorpay's test window, use the test card or UPI details shown in the Razorpay docs or dashboard.
3. You should see your guest link and edit link. Open both. No real money moves in test mode.

### 6. Go live
Complete Razorpay's activation, generate live keys (`rzp_live_...`), replace the two key settings in Netlify, create the webhook again in live mode, and redeploy.

## Useful to know

- **Payment methods and international payments** are switched on in the Razorpay Dashboard, not in this code.
- **Changing the name "Mandap & Co."**: change it in `src/site.json` and rebuild.
- **Changing the homepage samples:** edit the samples in `src/engine/samples.js` and run `node scripts/make-demos.js`.
- **Trying it locally:** `npm install`, then `npm run dev` runs the whole site at http://localhost:8888 with pretend payments.

## Making changes later with Claude Code

1. Clone the repository to your computer and open Claude Code in that folder.
2. Ask in plain words, for example "add a fourth colour theme in navy and gold" or "also accept a second price for a premium design".
3. Claude Code reads `CLAUDE.md`, makes the change, rebuilds, and pushes to GitHub when you approve. Netlify publishes the new version by itself.
