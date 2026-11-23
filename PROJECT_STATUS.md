# Project status

Created using Anthropic Claude. Keep this on internal versions until a person has reviewed it.

Last updated: 23 November 2026. The plan and its reasons are in `PROJECT_AUDIT.md`.

## Done
- **Phase 1, audit:** `PROJECT_AUDIT.md` written. Portuguese added, so the MVP now has 10 languages.
- **Hindu sample:** now Aastha & Aakash at The Oberoi, Mumbai, with the Oberoi & Shah families. Live.
- **Step 0, quick fixes** (pushed 23 November 2026; still needs checking in a browser and on a phone):
  - The guest reply form now opens WhatsApp with a ready message to the couple's number. It's hidden if no number is given.
  - Fonts are served from our own site instead of Google, for privacy and speed.
  - Added a site icon, `robots.txt` and basic link-preview text on the homepage.
  - Added draft Contact, Privacy, Terms and Refund pages, linked from the homepage footer and the editor.
  - Added "Payments are non-refundable" next to the pay button.
- **Step 1, foundations** (pushed 23 November 2026). No visible change for visitors:
  - **Shared invite engine:** `src/engine/engine.js` now builds every invitation. The editor and the sample script use it, and the server will in Step 3.
  - **Templates as folders:** today's design is `src/templates/classic/`. A new design is a new folder.
  - **Phrase files:** all fixed invite wording is in `src/i18n/en.json`. A new language is a new file with the same phrases. Invites now declare their language and text direction, ready for Arabic and Urdu.
  - **Brand in one place:** `src/site.json`. The homepage and policy pages are now built from `src/pages/`.
  - **New tools:** `node scripts/make-demos.js` regenerates the homepage samples (no more paid downloads). `node scripts/check.js` checks every combination after a change.
  - **Verified:** output identical to before the change, apart from the deliberate language/direction tag. Tested in Chrome with no errors.

- **Step 2, homepage** (on your Mac; not committed yet):
  - New premium homepage in the ivory and wine style, built for phones first:
    - the hero, with the live phone sample and reassurance points;
    - design cards with real cover images and pop-up live previews;
    - what's inside, how it works, privacy by design, pricing, a 9-question FAQ, and a closing call to action;
    - a fuller footer.
  - The price comes from Netlify settings and shows only once `PRICE_AMOUNT` and `PRICE_CURRENCY` are set.
  - New tool: `node scripts/make-previews.js` makes the card images from the samples (needs Chrome).
  - Tested in Chrome at laptop and phone sizes: no errors, no sideways scrolling, and the pop-up preview and tabs work.

## Decisions (23 November 2026)
- **Order:** keep the original order: Step 1 foundations, then the homepage, then hosted links.
- **Old buttons:** "Save project / Open project" stays until the hosted edit link replaces it.
- **Homepage (Step 2):** ivory and wine editorial style. The wording describes today's product and gets updated when hosted links launch. Only existing designs are shown, plus one "more coming" line. The price is ₹499.
- **Payments:** hosted-link checkout is built on Razorpay (test mode first). Stripe isn't set up on the live site, which is why it shows "Download unavailable", and won't be.
- **Editing after publishing:** everything can be changed. Invitations go offline automatically some months after the wedding (6 suggested; to confirm).

## Next
1. You check Step 0 on the live site and on a phone (WhatsApp reply button, fonts, policy pages).
2. You review the new homepage, then approve committing and pushing Step 2.
3. **Step 3:** hosted invitation links with Razorpay test mode (needs approval for Netlify Blobs and a `package.json`).

## Waiting on you
- Set `PRICE_AMOUNT` = `49900` and `PRICE_CURRENCY` = `inr` in Netlify, so ₹499 shows on the homepage.
- Fill in the `[bracketed]` details on the policy pages, and have them reviewed (`docs/legal-review-notes.md`).
- A contact email.
- Make the GitHub repository private.
- Song choices from the shortlist.
- Native-speaker review of `docs/translations-phase1-draft.md`.
- Razorpay account and KYC (Indian business details).

## Known issues
- The paywall can be bypassed by someone technical. This gets fixed by hosted invitations (Step 3).
- Purchases are remembered only in the buyer's browser, and there are no payment webhooks yet (Step 3).
- Only 14 time zones are offered in the editor.
- The homepage has no link-preview image yet. It needs the permanent web address (Phase 8).
- The Hindu sample's wedding date (31 Dec 2026) will soon be in the past. Refresh the sample after that.
- The policy pages are live with placeholders (your choice, since the address isn't public yet). Fill them in and have them reviewed before launch or Razorpay activation.
