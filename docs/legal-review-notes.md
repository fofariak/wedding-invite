# Notes for the reviewer of the policy pages

Created using Anthropic Claude. These notes are not legal advice. They list questions for a qualified professional to decide.

Pages: `public/contact.html`, `public/privacy.html`, `public/terms.html`, `public/refunds.html`. Each describes only what the site does today. Anything that needs a business fact or a professional's decision is written in `[square brackets]`.

## Facts about the service, for the reviewer
- **No accounts.** Customers don't register. After paying they get a private edit link; we store only a hash of it.
- **While designing,** everything stays in the customer's browser. Nothing is sent to us before payment, except creating an empty draft record at checkout.
- **Payment** is through Razorpay Checkout, a window on our page loaded from Razorpay. Razorpay collects the contact and payment details. We store the order and payment reference, amount and currency.
- **Publishing** stores on Netlify (Netlify Blobs) the invitation's details, which can include family names, venue and a WhatsApp number, plus its photos and song. They are shown at an unlisted link (`/i/<random id>`) marked "noindex". Anyone with the link can view it; it is not password-protected.
- **Retention:**
  - Invitations go offline automatically 12 months after the wedding date, and owners can delete them at any time; deletion removes details and files immediately.
  - Expired records are not yet erased automatically, and a clean-up job is planned.
  - Payment records stay in Razorpay.
- **Guest replies** are optional and go through WhatsApp; nothing reaches our servers. We don't record who opens an invitation.
- **Hosting** is Netlify, which keeps technical logs including IP addresses. Fonts are self-hosted. There are no tracking cookies and no analytics at present. Please confirm Netlify Analytics is off.
- **Refunds:** none once published, except duplicate charges and failed publishing. A full refund of the main payment takes the invitation offline.

## Questions for the professional
1. **Refunds for EU customers** (Spain, Germany, France, Portugal and others): EU consumer rules normally give a 14-day right to cancel online purchases, with special conditions for digital content delivered straight away. Does the no-refund policy need an explicit consent step at checkout, and if so, what wording?
2. **India:** do the Consumer Protection (E-Commerce) Rules 2020 and the Digital Personal Data Protection Act 2023 require anything more on these pages, such as a grievance officer's name and contact details?
3. **Razorpay:** the business must be registered in India with KYC, and Razorpay's activation review checks the website's policy pages (terms, privacy, refund/cancellation, contact, and sometimes shipping/delivery). Are the pages enough for that, and is a delivery page needed for a digital product?
4. **Tax:** whether prices should be shown including or excluding tax (GST, VAT), and the wording.
5. **Data:** how long payment records should be kept, and which data-protection rights to list.
6. **Liability and governing law:** wording for the bracketed placeholders in the Terms.
7. **Expired invitations:** how long after going offline should their details and photos be permanently erased?
8. **Guests' personal data:** couples put names, photos, venue and phone numbers into invitations they share. Should the Terms or Privacy page say more about the couple's responsibility for that?
