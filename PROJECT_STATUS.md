# Project status

Created using Anthropic Claude. Keep this on internal versions until a person has reviewed it.

Last updated: 23 November 2026. The plan and its reasons are in `PROJECT_AUDIT.md`.

## Done
- **Phase 1, audit:** `PROJECT_AUDIT.md` written. Portuguese added, so the MVP now has 10 languages.
- **Hindu sample:** now Aastha & Aakash at The Oberoi, Mumbai, with the Oberoi & Shah families. Live.
- **Step 0, quick fixes** (on your Mac only; not committed or live yet):
  - The guest reply form now opens WhatsApp with a ready message to the couple's number. It's hidden if no number is given.
  - Fonts are served from our own site instead of Google, for privacy and speed.
  - Added a site icon, `robots.txt` and basic link-preview text on the homepage.
  - Added draft Contact, Privacy, Terms and Refund pages, linked from the homepage footer and the editor.
  - Added "Payments are non-refundable" next to the pay button.

## Next
1. You review Step 0 in a browser, then approve the commit and push.
2. **Step 1, foundations:** split the invitation into an engine plus templates, add the phrase-file language system, and move the brand name into one settings file.
3. **Step 2:** homepage and brand (Phase 2).

## Waiting on you
- Fill in the `[bracketed]` details on the policy pages, and have them reviewed (`docs/legal-review-notes.md`).
- A contact email.
- Make the GitHub repository private.
- Install Node.js (LTS, from nodejs.org).
- Song choices from the shortlist.
- Native-speaker review of `docs/translations-phase1-draft.md`.
- Razorpay account and KYC (Indian business details).

## Known issues
- The paywall can be bypassed by someone technical. This gets fixed by hosted invitations (Step 3).
- Purchases are remembered only in the buyer's browser, and there are no payment webhooks yet (Step 3).
- Only 14 time zones are offered in the editor.
- The homepage has no link-preview image yet. It needs the permanent web address (Phase 8).
- The Hindu sample's wedding date (31 Dec 2026) will soon be in the past. Refresh the sample after that.
- The policy pages contain placeholders and must not go live until they're filled in and reviewed.
