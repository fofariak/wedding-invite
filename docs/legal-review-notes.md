# Notes for the reviewer of the policy pages

Created using Anthropic Claude. These notes are not legal advice. They list questions for a qualified professional to decide.

Pages: `public/contact.html`, `public/privacy.html`, `public/terms.html`, `public/refunds.html`. Each describes only what the site does today. Anything that needs a business fact or a professional's decision is written in `[square brackets]`.

## Facts about the service, for the reviewer
- **No accounts:** customers don't register.
- **Editing stays on the device:** the editor works entirely in the customer's browser. Drafts are kept in the browser's own storage, not on our servers.
- **Data sent at payment:** the couple's names (shown on the payment page and receipt) and a one-way code made from the names and wedding date. Card details go directly to the payment provider.
- **Payment providers:** Stripe today. Razorpay is planned for India and international payments.
- **What the buyer gets:** a single HTML file that they share themselves. Hosted invitation links are planned, and will need the privacy policy updated: what is stored, for how long, and how to delete it.
- **Guest replies:** optional. The couple's WhatsApp number appears inside the invitation, and replies go through WhatsApp; nothing reaches our servers.
- **Hosting:** Netlify, which keeps technical logs including IP addresses.
- **Fonts:** self-hosted.
- **Tracking:** no tracking cookies or analytics at present. Please also confirm that Netlify Analytics isn't switched on in the Netlify dashboard.
- **Refund decision:** no refunds once the invitation is unlocked, except for duplicate charges and payments where the invitation failed to unlock.

## Questions for the professional
1. **Refunds for EU customers** (Spain, Germany, France, Portugal and others): EU consumer rules normally give a 14-day right to cancel online purchases, with special conditions for digital content delivered straight away. Does the no-refund policy need an explicit consent step at checkout, and if so, what wording?
2. **India:** do the Consumer Protection (E-Commerce) Rules 2020 and the Digital Personal Data Protection Act 2023 require anything more on these pages, such as a grievance officer's name and contact details?
3. **Razorpay:** its activation review checks the website's policy pages (terms, privacy, refund/cancellation, contact, and sometimes shipping/delivery). Are the pages enough for that, and is a delivery page needed for a digital product?
4. **Tax:** whether prices should be shown including or excluding tax (GST, VAT), and the wording.
5. **Data:** how long payment records should be kept, and which data-protection rights to list.
6. **Liability and governing law:** wording for the bracketed placeholders in the Terms.
7. **Guests' personal data:** couples put names, photos, venue and phone numbers into invitations they share. Should the Terms or Privacy page say more about the couple's responsibility for that?
