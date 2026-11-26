# Project status

Created using Anthropic Claude. Keep this on internal versions until a person has reviewed it.

Last updated: 24 November 2026. The plan and its reasons are in `PROJECT_AUDIT.md`.

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

- **Step 2, homepage** (pushed 23 November 2026):
  - New premium homepage in the ivory and wine style, built for phones first:
    - the hero, with the live phone sample and reassurance points;
    - design cards with real cover images and pop-up live previews;
    - what's inside, how it works, privacy by design, pricing, a 9-question FAQ, and a closing call to action;
    - a fuller footer.
  - The price comes from Netlify settings and shows only once `PRICE_AMOUNT` and `PRICE_CURRENCY` are set.
  - New tool: `node scripts/make-previews.js` makes the card images from the samples (needs Chrome).
  - Tested in Chrome at laptop and phone sizes: no errors, no sideways scrolling, and the pop-up preview and tabs work.

- **Step 3, hosted invitations with Razorpay** (pushed 24 November 2026):
  - **Publishing:** customers press "Pay ₹499 and publish", pay in Razorpay's window, and get a guest link (`/i/<id>`) and a private edit link. Photos and song are uploaded after payment.
  - **Edit link:** opens the invitation on any device to change anything, unpublish, publish again or delete. This browser remembers it too.
  - **Guest pages:** built on the server with WhatsApp preview tags (names, date, venue, cover photo), not listed by search engines, and offline 12 months after the wedding.
  - **Payments:** checked on the server with Razorpay (signature and order status), plus a webhook so payment completes even if the tab closes. Double payments are recorded for refund, and a full refund takes the invitation offline.
  - **Storage:** Netlify Blobs (approved), via `package.json` with one package, `@netlify/blobs`.
  - **Removed:** Stripe, the licence system, Download, and Save/Open project.
  - **Wording updated:** homepage, privacy, terms, refunds and contact pages, `CLAUDE.md`, `README.md` and the reviewer notes.
  - **Tests:** 13 automatic server tests (`npm test`), and the full journey tested in Chrome with the local test server (`npm run dev`). The functions were also bundled the way Netlify does and run successfully.

- **Opening library** (local checkpoint, not pushed):
  - **155 openings** from your `WEDDING_OPENING_LIBRARY_PROMPT.md`: Hindu 68, Christian 40, Muslim 23, Jain 9, Universal 9, Sikh 6.
  - **Picker:** a visual picker in the editor (tradition → theme → opening cards in the real script), plus "Write my own" and "No opening".
  - **Designs:** 4 (classic ornament, framed, motif above, minimal), 3 sizes and 3 colours. Optional meaning, transliteration and reference. KJV/WEB Bible choice. Gujarati-script option for Hindu and Jain texts.
  - **Placement:** one-line openings sit under the emblem. Long ones get their own first page; the book opens onto it and the names animate when guests scroll down.
  - **Scripts:** self-hosted fonts for Devanagari, Gujarati, Gurmukhi, Arabic (Amiri) and Urdu (Nastaliq), loaded only when needed. Arabic and Urdu are right-to-left.
  - **Accuracy:** Quranic and Bible texts were checked against quran.com, Bible Gateway and ebible.org. Sikh texts are now in Gurmukhi, and typos are fixed. Everything is listed for expert review in `docs/opening-library-review.md`.
  - **Samples:** the Hindu sample now starts with ॥ श्री गणेशाय नमः ॥ and the Nikah sample with Bismillah.
  - **Tests:** `npm run check` builds 360 invitations including every opening; `npm test` has 14 server tests. The picker was tested end to end in Chrome, including publishing and reopening.

- **Step 4, templates, first batch** (local checkpoints, not pushed):
  - **Research** into popular styles (Indian and global) led to an 8-design line-up: Classic Book, Rajwada, Bagh, Noor, Mangal, Monogram, Deco, Kolam.
  - **Shared toolkit** for new templates (`src/templates/_shared/`). Classic is verified unchanged.
  - **Rajwada (royal palace):** carved doors swing open onto layered gold arches. Maroon, Royal Blue and Peacock & Gold.
  - **Bagh (watercolour garden):** a painted wreath blooms open, and flowers bloom as you scroll. Blush, Lilac and Peach & Sage.
  - **Noor (Islamic geometric):** lanterns glow and light pours through a jaali arch. Emerald, Midnight and Sand & Gold.
  - **Homepage:** design cards are generated automatically from the templates (picture, live preview, "Use this design"). The editor has a template choice.
  - **Tests:** `npm run check` builds 468 invitations across every template, colour story, tradition, language and opening; 14 server tests pass. Every template was checked visually on a phone screen in Chrome.

- **Step 6, part 1: translations** (local checkpoint, not pushed):
  - 10 draft languages added as phrase files, all marked not reviewed: Hindi, Gujarati, Marathi, **Punjabi**, Urdu, Arabic, Spanish, Portuguese, German, French.
  - Natural time-of-day wording, for example शाम 7:00 बजे.
  - The review document is generated automatically.
  - The server accepts only reviewed languages.
  - Still to do: the language picker, right-to-left layout for Arabic and Urdu, and homepage language chips.

- **Translations reviewed by the owner (26 November 2026):** 52 corrections applied to the phrase files across all 10 languages. Two new phrases for the hashtag ("Share your photos with", "Hashtag copied") still need a review.
- **Wedding hashtag:** optional field in the editor; shown under the photos in all 4 templates, and guests tap to copy.

- **Language picker (live):**
  - 9 approved languages: Hindi, Gujarati, Marathi, Punjabi, English, Spanish, Portuguese, German, French.
  - Each tradition's likely languages are listed first, with a note about typing names in that script.
  - Script fonts load for the invitation's language.
  - A gentle check before paying flags names in English letters on a non-English invitation.
  - Homepage: "Your invitation in 9 languages" chips, each opening the editor in that language.
  - Arabic and Urdu are reviewed but hidden until the right-to-left layout is built.
  - **Sample wording per language:**
    - Hindi and Gujarati: Hindu and Nikah samples.
    - Marathi and Punjabi: Hindu sample.
    - Spanish, Portuguese, German and French: Nikah and Western samples.
    - Picking a language (homepage chip or editor) switches the sample wording automatically if it is untouched, and asks first if the couple has typed their own.
    - Other combinations use the English sample with the fixed words translated.
  - Not yet done: the multi-language toggle (+₹200).

## Decisions (23 to 24 November 2026)
- **Order:** keep the original order: Step 1 foundations, then the homepage, then hosted links.
- **Old buttons:** "Save project / Open project" was replaced by the edit link in Step 3.
- **Homepage (Step 2):** ivory and wine editorial style. The wording describes today's product and gets updated when hosted links launch. Only existing designs are shown, plus one "more coming" line. The price is ₹499.
- **Payments:** hosted-link checkout is built on Razorpay (test mode first). Stripe has been removed.
- **Editing after publishing:** everything can be changed. Invitations go offline automatically **12 months** after the wedding.
- **Storage:** Netlify Blobs. **Edit link:** copy it or send it to your own WhatsApp; no email is collected. **Delivery:** link only, no download.
- **Multi-language invitations (26 November 2026):**
  - **Price:** ₹499 includes 1 language; each extra language is +₹200 (₹699 for 2, ₹899 for 3). Prices stay in Netlify settings.
  - **Editor:** language tabs. Extra languages only need the text that differs (names, parents, invitation line), and empty fields reuse the main language. Dates and fixed words translate automatically; photos, design, music and opening are shared.
  - **Guests:** one link with an EN | हिं style switch at the top.
  - **Upgrades:** adding a language after publishing costs just the difference.
  - **When:** built together with the language picker and right-to-left layout, once at least one translation is reviewed.

## Next
1. You check Step 0 on the live site and on a phone (WhatsApp reply button, fonts, policy pages).
2. You check the new homepage on the live site, on a phone and a laptop.
3. Check the Netlify deploy of Step 3 (first deploy with server storage and packages).
4. Add the Razorpay test keys and webhook in Netlify and Razorpay (see `README.md` step 4), then do a test payment on the live site.
5. **Step 4, second batch (later, by your choice):** Mangal, Monogram, Deco, Kolam.
6. **Step 5 (lean):** phone Edit / Preview bar done; visual template choice and before-you-pay checklist left for later.

## Waiting on you
- Expert review of the opening library, one reviewer per tradition (`docs/opening-library-review.md`).
- Set `PRICE_AMOUNT` = `49900` and `PRICE_CURRENCY` = `inr` in Netlify, so ₹499 shows on the homepage.
- Fill in the `[bracketed]` details on the policy pages, and have them reviewed (`docs/legal-review-notes.md`).
- A contact email.
- Make the GitHub repository private.
- Song choices from the shortlist.
- Native-speaker review of each language in `docs/translations-review.md` (11 languages, Punjabi included).
- Razorpay account and KYC (Indian business details). Then add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` in Netlify, and create the webhook in Razorpay.

## Known issues
- **Preview copying:** the editor preview is still built in the browser, so someone technical could copy an unpaid, watermarked design. Only paid invitations get a guest link, though, so this matters much less now.
- **Expired invitations:** they go offline but aren't yet erased from storage. A scheduled clean-up is still to do.
- **Unpaid drafts:** these tiny records (no photos) are created when someone opens checkout without paying, and aren't cleaned up yet.
- **Lost edit links:** recovering one needs manual help (find the invitation via its Razorpay payment). There's no self-service yet.
- **Deleted photos:** after deleting, photos can stay in the delivery network's cache for up to a day.
- Only 14 time zones are offered in the editor.
- The homepage has no link-preview image yet. It needs the permanent web address (Phase 8).
- The Hindu sample's wedding date (31 Dec 2026) will soon be in the past. Refresh the sample after that.
- The policy pages are live with placeholders (your choice, since the address isn't public yet). Fill them in and have them reviewed before launch or Razorpay activation.
