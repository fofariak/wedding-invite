# Mandap.co: project audit (Phase 1)

Created using Anthropic Claude. Keep this on internal versions until a person has reviewed and verified it.

Date: 23 November 2026
Scope: everything in this repository (code, setup files, documentation), compared against `MVP_BUILD_PROMPT.md`. Nothing has been changed as part of this audit.

**What this audit could not check:** the live website in a browser, your Netlify settings, your Stripe account, and real phones. Those checks are listed in section 7.

---

## 1. Summary

The current site is a small, well-built **"design, pay, download a file"** product. It has one high-quality animated invitation design (three colour themes, three traditions), a good editor with a live phone preview, and a safe Stripe checkout. The code is careful: customer text is cleaned before it is shown, the price is decided by the server, and no secrets are stored in the files.

The MVP plan asks for a different kind of product: **"design, pay, get a hosted link to share."** That is the biggest change. The editor, the invitation design and much of the payment code can be reused. Hosted invitations, storage, more templates, languages, Indian payments and the trust and legal pages are new work.

| Area | Today | MVP needs | Gap |
|---|---|---|---|
| Invitation design | 1 design × 3 colour themes | 6–8 distinct templates | Large |
| Editor | Good; live preview; functions can be added, removed and reordered | Same, plus template choice and language | Small–medium |
| Delivery | Customer downloads one HTML file | Unique hosted link, editable, can be deleted | Large (new) |
| Storage | Customer's own browser only | Permanent storage on a server | Large (new) |
| Payments | Stripe Checkout, checked by the server | UPI and cards for India, Stripe abroad, webhooks, refunds | Medium |
| Languages | English wording only | 10 languages, including right-to-left | Large |
| Cultures | Hindu, Muslim, Western | 8 categories, separate from language | Medium |
| Homepage | One page, already elegant | Templates, categories, FAQ, trust, pricing | Medium |
| Legal/trust pages | None | About, Contact, Privacy, Terms, Refunds, FAQ | Medium (needs a professional's review) |
| SEO | Title and description only | Sitemap, robots, link previews, landing pages | Medium |
| Sharing | None | WhatsApp, copy link, link preview image | Medium (depends on hosting) |
| Analytics | None | Privacy-friendly visit and sales counts | Small |

---

## 2. What exists today

### 2.1 Pages
- **Homepage** (`public/index.html`): hero, a live phone showing three sample invites (Hindu, Nikah, Western), "how it works" in three steps, "everything a guest needs", and one price.
- **Editor** (`public/studio.html`, built from `src/studio.src.html`): a form on the left and a phone preview on the right that updates as you type.
- **Sample invites** (`public/demo-hindu.html`, `demo-muslim.html`, `demo-western.html`).

### 2.2 What the invitation does (`src/invite-template.html`)
An animated, scrolling, phone-first invitation:
- A book cover that opens.
- The couple's names, parents and an emblem (Ganesha, star and crescent, or the couple's initials).
- A date banner that guests pull down (or that drops by itself), with a countdown and an "add to calendar" button.
- A swipeable carousel of functions, each with its own artwork and dress-code colours.
- A photo carousel, a reception card, and an illustrated map with Maps, Directions and Copy address buttons.
- A reply form, background music, falling petals and sparkle effects.

This is a strong, reusable "invitation engine". Its weakness is that everything (layout, colours, animations, English wording) lives in one large file, so new designs or languages can't be added without editing that file.

### 2.3 What the editor does
- **Design:** three colour themes (Wine & Blush, Emerald & Champagne, Rani Pink & Marigold) and three traditions (Hindu, Muslim/Nikah, Western).
- **Content:** names, parents, invitation wording, date, time and time zone (14 zones), and how the date is revealed.
- **Functions:** add, remove, reorder, set artwork and dress-code colours, with a minimum of 3.
- **Photos:** upload, reorder, crop position, and pick a cover photo. Photos are shrunk automatically.
- **Reception card, venue and map labels, song upload, closing lines.**
- **Saving:** drafts save automatically in the customer's browser. A "Save project" / "Open project" file lets them move to another computer.

### 2.4 How payment works today
1. The editor makes a code from "name 1 | name 2 | date".
2. The server function `create-checkout` sends the customer to Stripe's own payment page. The price comes from Netlify settings, not the browser.
3. Stripe sends the customer back. The server function `verify` asks Stripe whether the payment really went through, then gives the browser a signed "licence" for that couple and date.
4. Before each download the server checks the licence again.
5. Stripe promotion codes work, including 100%-off codes.

This is a sound, simple design. Secret keys stay in Netlify settings.

### 2.5 Technology and hosting
- Plain HTML, CSS and JavaScript. No framework and no add-on packages.
- A small build step (`scripts/build.js`) joins the source files into the editor page.
- Netlify hosts the pages and three small server functions (`config`, `create-checkout`, `verify`).
- GitHub stores the code. Netlify republishes automatically when GitHub's main branch changes.

---

## 3. What can be reused

| Reuse | How |
|---|---|
| Invitation engine (book opening, date reveal, countdown, carousels, map, music, petals) | Becomes the shared engine behind every template, with each template supplying its own look |
| Colour theme system | Keep it: one template can offer several colour stories |
| Editor form, live phone preview, photo shrinking, function add/reorder/remove | Keep, adding a template picker and a language picker |
| Safety helpers that clean customer text | Keep for every new field and language |
| Stripe checkout and server-side payment check | Keep as the "international" payment provider, and extend it with webhooks |
| Licence system | Keep working for anyone who already bought a download (see 5.3) |
| Netlify + GitHub deployment | Keep. It also offers storage (see 6.2) |
| Draft autosave in the browser | Keep as a convenience while editing, but not as the permanent store |

---

## 4. Problems found

### 4.1 Should be fixed soon, whatever the plan
1. **The reply form doesn't send replies anywhere.** Guests type their name and press "Attending", see a thank-you message, but the couple never receives anything. Customers will assume it works. Suggested fix: replace it with a "Reply on WhatsApp" button that opens a prepared message to the couple's number, or hide it. A full guest list is postponed in the MVP plan.
2. **The GitHub repository is public.** Anyone can read and copy the code and designs. No secrets are exposed. Fix: GitHub → Settings → Danger Zone → Change visibility → Private.
3. **No contact details, refund policy, terms or privacy policy.** Stripe and customers both expect these before real payments.
4. **A buyer who closes the tab right after paying loses the unlock.** The site only finds out about a payment when the buyer comes back to the page; there is no Stripe "webhook". Support would have to fix it by hand.
5. **Purchases live only in the customer's browser.** Changing phone or clearing browser data loses the unlock, unless the customer saved a project file. There's no "recover my purchase" option.

### 4.2 Limits of the current download model
6. **A downloaded HTML file is awkward to share on WhatsApp.** Many phones open `.html` attachments as a download or as raw text, not as an animated page. This is the strongest argument for hosted links.
7. **The paywall can be bypassed** by anyone who knows how to read page code, because the whole invitation is assembled in the browser. Hosted invitations fix this: the finished page only exists on the server after payment.
8. **Invite files are large** (about 0.1 MB, plus 0.2–0.4 MB per photo, plus the song).

### 4.3 Smaller issues
9. **Fonts load from Google's servers.** That shares every visitor's address with Google, which conflicts with "privacy as a selling point" and has led to fines in Germany. Fix: host the fonts on our own site, which is also faster.
10. **No link-preview tags, favicon, robots.txt or sitemap.** Links shared on WhatsApp show no image or proper title.
11. **A mistyped price setting** in Netlify (for example "19.00" instead of "1900") causes a confusing checkout error rather than a clear message.
12. **Only 14 time zones** in the editor. Australia, Sri Lanka, Nepal and parts of Canada and Europe are missing.
13. **Sample invites go out of date.** The Hindu sample is dated 31 Dec 2026, so after that its countdown shows the date has passed.
14. **No security policy header** that limits what the pages may load. It's low risk today, and worth adding once invites are hosted.

### 4.4 Housekeeping on your computer
15. Node.js (needed to run the official build step locally) is not installed. I've been using a verified copy of the build step instead. Fix: install the LTS version from nodejs.org.
16. Your whole home folder (`/Users/karanfofaria`) is set up as an empty git repository, separate from this project. It isn't used, but it risks uploading personal files by mistake. Removing it is a one-line change, which I'd only make with your approval.

---

## 5. Decisions only you can make

These shape the rest of the plan.

**Decisions recorded on 23 November 2026:**
- **Payments:** Razorpay for India, with its international payments to be activated. Stripe stays in place until Razorpay is working.
- **Existing buyers:** none, so the licence system can be redesigned without a migration.
- **Refunds:** no refunds (with exceptions for duplicate charges and failed unlocks). To be checked by a professional; see `docs/legal-review-notes.md`.
- **Contact email:** a placeholder for now.
- **Languages:** any language for any wedding, with each tradition's likely languages listed first.

### 5.1 Where is the business registered?
This decides how Indian customers can pay.
- **Razorpay** (UPI, Indian cards, net banking) needs an Indian business with Indian KYC: PAN, a bank account, and GST where applicable.
- **Stripe** works well for international cards. Its availability for Indian businesses has been restricted in recent years, so check what your account allows. Stripe accounts outside India generally can't accept UPI.
- If you have only a non-Indian business at first, Indian customers can still pay by card through Stripe, but UPI would have to wait.

### 5.2 Domain and brand name
**Decided:** "Mandap.co" is a working name and will change after the MVP.

**Approach:** keep the brand name, domain and contact details in one settings file that every page reads, so a rename is a quick, single change. The code currently has "Mandap & Co." written into each page separately. During the MVP, hosted links can use the free Netlify address (`yoursite.netlify.app/i/abc123`); a custom domain can be added at any time without breaking existing links, as long as the old address keeps redirecting.

### 5.3 Are there paying customers already?
If anyone has bought a download, the current licence system must keep working for them. That's easy to do alongside the new system. If there are none, the switch is simpler.

### 5.4 Download, link, or both?
Recommendation: **the hosted link is the product**, with an optional "download a copy" kept as a bonus. This fits the plan and removes most of the problems in 4.2.

### 5.5 Languages and cultures
**Decided:** 10 languages: Hindi, Gujarati, Marathi, English, Urdu, Arabic, Spanish, German, French and Portuguese.

**Still open:** the MVP plan says language and culture are independent (any language for any wedding). Earlier you chose languages tied to tradition. Which applies? The draft translations in `docs/translations-phase1-draft.md` work either way.

---

## 6. Recommended technical approach

### 6.1 Templates
Split the current single file into:
- **a shared engine**: the animations and behaviour, written once;
- **one folder per template**: its look, colour options and artwork.

Adding a template then means adding a folder, with no rebuild of the platform. The existing design becomes template 1. Each further premium template is real design work, so start with 6 and polish them rather than rushing 8.

### 6.2 Hosted invitations and storage
**Recommendation: Netlify Blobs**, the storage built into Netlify.
- **Why:** no new company or account, it sits next to the existing functions, and it fits small "one invitation = one record" data.
- **Cost:** Netlify includes storage on its plans, with limits on storage and traffic. A few thousand invites with photos fit comfortably, but please check Netlify's current pricing page for your plan. Higher traffic later may need a paid Netlify plan.
- **Maintenance:** low. No database server to look after.
- **One trade-off:** it needs Netlify's official helper package. That means adding a `package.json` file, which `CLAUDE.md` says needs your agreement.
- **Alternative:** Supabase, a database plus file storage. It's more powerful but adds a second company, another account and dashboard, and a paid plan for reliability (the free plan pauses inactive projects).

**How a hosted invitation would work:**
1. The customer designs and previews (watermarked) as today.
2. They pay. A Stripe (and later Razorpay) webhook confirms the payment on the server, even if they close the tab.
3. The server saves the invitation and creates two random codes:
   - a **public link** for guests (`mandap.co/i/k7f3q9x2`);
   - a **private edit link**, shown once to the customer and never placed in the public page.
4. The public page is built on the server, with link-preview tags for WhatsApp and a "do not index" signal for search engines.
5. With the edit link the customer can change details, unpublish or delete.
6. **Lost edit link:** the customer contacts support, and the owner is matched through the Stripe receipt email. No customer accounts are needed.

**Honest privacy wording:** "Anyone with the link can view your invitation; it is not listed or searchable." An optional guest password could come later.

**Photo and song size:** server functions accept roughly 6 MB per request. Photos and the song need to be uploaded one at a time (they are already shrunk).

### 6.3 Payments
- Keep the Stripe code, and move it behind one common "payment provider" layer so Razorpay can be added next to it.
- Add **webhooks**, so the server learns about payments, refunds and failures directly from Stripe. Each webhook is processed only once, even if it arrives twice. This needs one more secret in Netlify, `STRIPE_WEBHOOK_SECRET`.
- Prices per region (₹ for India, $ elsewhere) stay as Netlify settings, so you can experiment without code changes.
- **Refunds:** decide the policy, for example "refund within 7 days, invitation unpublished".

### 6.4 Languages
- **Phrase files:** each language gets one file of fixed phrases (about 40 phrases, plus dates and times). Templates use phrase names instead of English text, so adding a language means adding one file.
- **Right-to-left:** Arabic and Urdu need right-to-left layout and testing of every swipe and animation. This is the riskiest part, so build it once the template engine is split.
- **Fonts:** fonts for Devanagari, Gujarati, Arabic and Nastaliq (Urdu) scripts, hosted on our own site.
- **Review:** all translated wording must be checked by native speakers before launch. Customers can always edit their own wording.

### 6.5 Cultural categories
Hindu, Muslim, Sikh, Christian, Jain, Buddhist, Interfaith and Modern become tags used to help people find templates, separate from language. Each needs:
- a respectful emblem (or none);
- sample wording;
- suitable function names (for example Anand Karaj for Sikh weddings).

Ask someone from each community to check these before launch.

### 6.6 Analytics
Count visits, template views, editor starts, checkouts and purchases. Options:
- **Plausible or Fathom:** about US$9–15 a month, with no cookies and no personal data.
- **Netlify Analytics:** a paid add-on.
- **A simple counter of our own, stored in Netlify Blobs:** free, but basic.

Recommendation: Plausible, for its simplicity and privacy.

### 6.7 What not to build yet
Agree with the MVP plan's postpone list: partner programme, guest management, RSVP analytics, accounts, subscriptions, AI features, large template libraries.

---

## 7. Checks I could not do here
- View the live site and the editor on real phones (iPhone and Android) and in WhatsApp.
- See your Netlify settings, such as whether `LICENSE_SECRET` is set and which Stripe key (test or live) is in use.
- Confirm whether any real purchases have been made.
- Run the official build step (Node.js is not installed). A verified copy of the build step was used instead, and it produces identical output.

---

## 8. Recommended development plan

This follows the order in `MVP_BUILD_PROMPT.md`, with one change: hosting is moved earlier, because the homepage, pricing, sharing and payments all depend on "you get a link".

| Step | What | Why first | Needs from you |
|---|---|---|---|
| **0. Quick fixes** (small) | Replace the broken reply form with "Reply on WhatsApp". Host fonts ourselves. Add robots.txt, favicon and basic link-preview tags. Add first drafts of the Contact, Privacy, Terms and Refund pages, marked for professional review | Removes real customer-facing problems now, with little risk | Make the repository private. A contact email. Refund policy choice |
| **1. Foundations** | Split the invitation into an engine plus template folders (no visible change). Add the phrase-file language system, with English only to start. Move the brand name into one settings file so a later rename is quick | Every later phase builds on this; doing it first avoids rework | Nothing |
| **2. Brand and homepage** (Phase 2) | Premium homepage: hero, templates, categories, how it works, pricing, FAQ, trust | First impression and conversion | Brand name and domain decision. Any brand assets |
| **3. Hosted invitations** (Phase 5, moved earlier) | Storage, public and edit links, unpublish and delete, webhooks, server-built pages with link previews | The core of the product | Approval for Netlify Blobs and a `package.json`. A webhook secret added in Netlify |
| **4. Templates** (Phase 3) | Polish template 1, then add 5–7 more | Choice for customers | Feedback on each design |
| **5. Editor** (Phase 4) | Template picker, language picker, simplified form | Ease of use | Feedback |
| **6. Languages and cultures** (Phase 6) | 10 languages including right-to-left, 8 categories | Market reach | Native-speaker reviewers |
| **7. Payments** (Phase 7) | Razorpay for India (UPI), Stripe internationally, refunds | Indian customers | Razorpay account if eligible. Price decisions |
| **8. Sharing and SEO** (Phase 8) | WhatsApp, copy and native share buttons. Landing pages, sitemap | Growth | Nothing |
| **9. Testing and launch** (Phase 9) | Full journey tests on real phones | Quality | Test devices, a test payment |

A `PROJECT_STATUS.md` will track completed work, remaining tasks and known issues from Step 0 onwards.

**Recommended first build: Step 0, quick fixes.** It's small, safe, fixes problems customers would notice today, and changes nothing about how payment works.
