# Mandap.co — MVP Development Master Prompt

## 1. Your Role

Act as my senior product designer, full-stack developer, UI/UX expert and technical advisor.

I am the founder of Mandap.co. I am not a technical person, so explain technical decisions in simple language.

Your responsibility is to help me build a premium digital wedding invitation platform that can compete with existing wedding invitation websites.

Do not overcomplicate the product. Focus on quality, user experience, reliability and getting the MVP launched.

**Important:** Do not make major architectural or destructive changes without explaining them and getting my approval.

---

## 2. Product Vision

Mandap.co allows couples to create beautiful digital wedding invitations and share them through a unique website link.

Customers should be able to:

1. Choose a wedding invitation design.
2. Customise it with their wedding details.
3. Preview the invitation.
4. Purchase it.
5. Get a unique invitation website link.
6. Share that link through WhatsApp and other platforms.

The experience should be simple enough for someone with no technical knowledge.

Our goal is to make Mandap.co feel premium, modern, trustworthy and easy to use.

---

## 3. First: Audit the Existing Project

Before writing or modifying code:

1. Read `CLAUDE.md` and `README.md`.
2. Inspect the entire existing project structure.
3. Understand the current website, templates, editor, payment system and deployment setup.
4. Identify reusable code and existing functionality.
5. Identify bugs, security issues and technical limitations.
6. Check how the existing Stripe checkout and licence verification work.

Create a `PROJECT_AUDIT.md` containing:

- Existing features.
- Existing technology and architecture.
- What can be reused.
- What needs improvement.
- Potential problems.
- Recommended MVP development plan.

**Do not delete, rewrite or replace existing functionality during the audit.**

Wait for my approval before starting implementation.

---

## 4. Design and User Experience

This is one of the most important parts of the product.

The website must look like a premium wedding technology brand, not a generic invitation builder.

Design direction:

- Elegant and luxurious.
- Modern and minimal.
- Excellent typography.
- Beautiful colours and spacing.
- Smooth but subtle animations.
- Mobile-first and fully responsive.
- Fast loading.
- Simple navigation.

Take inspiration from premium design websites and leading wedding invitation platforms, but do not copy their designs.

The user should immediately understand what Mandap.co does and why it is worth paying for.

### Homepage

Build a homepage with:

- Attractive hero section.
- Clear headline and value proposition.
- Beautiful invitation previews.
- Browse templates section.
- Cultural and language categories.
- How it works section.
- Pricing.
- Frequently asked questions.
- Customer trust elements.
- Clear calls to action.

Avoid clutter and unnecessary sections.

---

## 5. Invitation Templates

Launch with approximately 6–8 excellent templates.

Quality is more important than quantity.

Every template should look professionally designed.

Include a variety of styles:

- Traditional Indian.
- Royal and luxurious.
- Floral.
- Minimal and modern.
- Elegant and contemporary.
- Muslim wedding designs.
- South Asian cultural designs.
- Simple and non-religious designs.

Each template should have a live preview.

Templates should be responsive and look excellent on mobile devices.

The architecture should allow us to add more templates later without rebuilding the platform.

---

## 6. Invitation Editor

Create an easy-to-use editor.

Customers should be able to customise:

- Bride's name.
- Groom's name.
- Wedding date.
- Wedding time.
- Venue and address.
- Wedding functions.
- Family names.
- Personal invitation message.
- Photos, where supported by the template.
- Background and selected design options.

Allow multiple wedding functions, such as:

- Haldi.
- Mehendi.
- Sangeet.
- Engagement.
- Wedding ceremony.
- Reception.

Customers should be able to add, edit, remove and reorder functions.

Include a live preview so changes are visible immediately.

The editor must be simple. Avoid overwhelming customers with too many settings.

---

## 7. Hosted Invitation Websites

This is a core feature.

After purchasing, every customer should receive a unique invitation URL.

Example:

`mandap.co/i/unique-random-id`

Requirements:

- Every invitation must have a unique, secure ID.
- Invitation data must be stored persistently.
- Invitations must work across devices.
- Customers should be able to edit their invitation using a secure editing link or credential.
- Customers should be able to unpublish or delete their invitation.
- Public invitation pages should not be indexed by search engines.
- Do not use browser localStorage as the permanent database.
- Do not expose private editing credentials in public URLs or page source.

Choose a reliable storage solution that works with the existing project and Netlify deployment.

Explain the cost and maintenance implications before choosing a new external service.

---

## 8. Privacy-First Product

Privacy should be a selling point.

Avoid forcing customers to create accounts.

For the MVP:

- No mandatory customer registration.
- No unnecessary email or phone collection.
- No mandatory guest list.
- No collection of unnecessary personal information.
- Use secure invitation editing access.
- Provide a way to delete or unpublish invitations.
- Avoid invasive tracking.
- Collect only information required to provide the service and process payments.

Explain clearly what data is collected and why.

Remember: an unlisted invitation link is not the same as a password-protected invitation. Do not claim an invitation is private if anyone with the link can access it.

---

## 9. Languages

The platform should support these nine languages:

1. Hindi.
2. Gujarati.
3. Marathi.
4. English.
5. Urdu.
6. Arabic.
7. Spanish.
8. German.
9. French.

Important:

- Build the language system so additional languages can be added easily.
- Do not hardcode all text directly into individual templates.
- Support right-to-left layouts for Urdu and Arabic.
- Ensure fonts display correctly.
- Ensure names, dates and other user-entered information display correctly.
- Allow customers to choose the language of their invitation.

Do not rely on automatic translation for important wedding wording without allowing it to be reviewed and edited.

---

## 10. Cultural and Religious Categories

Language and culture should be independent settings.

Create categories for:

- Hindu weddings.
- Muslim weddings.
- Sikh weddings.
- Christian weddings.
- Jain weddings.
- Buddhist weddings.
- Interfaith weddings.
- Modern and non-religious weddings.

These categories should help customers discover relevant designs.

Do not assume that every person from a particular culture wants a traditional design.

Keep the templates respectful, flexible and customisable.

---

## 11. WhatsApp Sharing

WhatsApp is a major distribution channel for wedding invitations.

Include:

- Share on WhatsApp button.
- Copy invitation link button.
- Native mobile share option where supported.
- Attractive link preview with the correct title, description and image.

Use server-generated Open Graph metadata where required so invitation links display correctly when shared.

Test sharing on mobile and desktop.

---

## 12. Payments

Build a reliable one-time payment system.

Payment requirements:

- Indian customers should be able to pay using supported Indian payment methods, including UPI and cards.
- International payment methods should be supported when merchant eligibility and gateway approval allow.
- Do not promise international payment support before it has been tested and approved.

Use a modular payment architecture so payment providers can be changed or added later.

Evaluate Razorpay for Indian payments and Stripe or another suitable provider for international payments, based on actual account eligibility.

Important security requirements:

- Verify payments on the server.
- Never trust payment success based only on the browser.
- Use payment webhooks where supported.
- Handle duplicate payment notifications safely.
- Handle refunds and failed payments.
- Do not expose secret API keys in frontend code.

Keep the existing payment and licence system working unless a change is necessary and approved.

Do not change existing licence algorithms, secrets or purchase compatibility without explaining the migration plan and obtaining my approval.

Keep pricing configurable so we can experiment with different prices and currencies later.

---

## 13. Pricing

Start with a simple one-time purchase model.

Possible starting experiments:

- India: ₹499 or ₹999.
- International: $9 or $19.

These are initial pricing experiments, not fixed decisions.

Avoid subscriptions for the MVP unless there is a strong business reason.

Customers should understand exactly what they are purchasing before payment.

---

## 14. SEO and Organic Growth

SEO is important for long-term customer acquisition.

Create SEO-friendly public pages for relevant searches.

Examples:

- Digital Wedding Invitations.
- Online Wedding Invitations.
- Hindu Wedding Invitations.
- Muslim Wedding Invitations.
- Gujarati Wedding Invitations.
- Hindi Wedding Invitations.
- Marathi Wedding Invitations.
- Christian Wedding Invitations.
- Sikh Wedding Invitations.
- Modern Wedding Invitations.

Create language and cultural landing pages where they provide genuinely useful content.

Requirements:

- Unique page titles and descriptions.
- Clean URLs.
- Proper heading structure.
- Sitemap.
- Robots.txt.
- Canonical URLs.
- Fast loading.
- Mobile-friendly design.
- Structured data where appropriate.

Do not create hundreds of low-quality duplicate pages just for SEO.

Customer invitation pages should generally be noindex.

---

## 15. Features to Postpone

Do not build these features in the first MVP:

- Automated partner or affiliate programme.
- Partner dashboards.
- Automated commission tracking.
- Guest management system.
- Advanced RSVP analytics.
- Complex customer accounts.
- Subscription billing.
- Advanced AI features.
- Complicated invitation customisation tools.
- Large template libraries before demand is validated.

I will manage any designer, photographer or wedding planner referral relationships manually.

We can add a partner programme after we see real demand and revenue.

Do not spend development time on features that are not essential to launching and selling the product.

---

## 16. Analytics

Implement basic, privacy-conscious analytics.

We need to understand:

- How many people visit the website.
- Which templates are viewed.
- How many people start creating an invitation.
- How many reach checkout.
- How many successfully purchase.

Use the minimum data necessary.

Do not introduce invasive tracking or unnecessary customer profiling.

---

## 17. Trust and Legal Pages

Create simple, professional pages for:

- About Us.
- Contact.
- Privacy Policy.
- Terms and Conditions.
- Refund Policy.
- Frequently Asked Questions.

Make sure payment, privacy and refund information is easy to find.

Do not invent legal guarantees. Flag anything that requires review by a qualified professional.

---

## 18. Technical Quality

The product must be reliable, secure and fast.

Requirements:

- Responsive design.
- Good mobile performance.
- Secure server-side validation.
- Secure storage.
- Error handling.
- Input validation.
- Protection against common web vulnerabilities.
- No exposed API keys.
- No broken links.
- No unnecessary dependencies.
- Maintainable code.
- Proper documentation.

Do not introduce a complicated technology stack without a clear benefit.

Prefer reusing the existing architecture when it is suitable.

---

## 19. Testing Before Launch

Test the complete customer journey.

### Homepage
- Does it load correctly?
- Does it look good on mobile?
- Do all buttons and links work?

### Templates
- Do all templates load?
- Are previews accurate?
- Do designs work on mobile?

### Editor
- Can customers edit all required fields?
- Does the live preview update?
- Can customers add multiple functions?
- Are special characters and different languages supported?

### Invitations
- Is a unique URL generated?
- Does the invitation remain available after refreshing?
- Does it work on another device?
- Can the customer securely edit it?
- Can the customer unpublish or delete it?

### Payments
- Does checkout work?
- Is payment verified on the server?
- Does a successful purchase unlock the correct product?
- Are failed and duplicate payments handled correctly?

### Sharing
- Does WhatsApp sharing work?
- Does the correct invitation preview appear?

Fix critical issues before launch.

---

## 20. Development Roadmap

Build in the following order.

### Phase 1 — Existing Project Audit
Inspect the existing project and prepare `PROJECT_AUDIT.md`.

Wait for my approval.

### Phase 2 — Brand and Homepage
Improve the overall branding, homepage and user experience.

### Phase 3 — Premium Templates
Build and polish the first 6–8 templates.

### Phase 4 — Invitation Editor
Build the customisation experience and live preview.

### Phase 5 — Hosted Invitations
Implement secure invitation storage and unique shareable URLs.

### Phase 6 — Languages and Cultural Categories
Implement the language system and cultural template categories.

### Phase 7 — Payments
Integrate and test the payment system.

### Phase 8 — Sharing and SEO
Implement WhatsApp sharing, metadata and SEO landing pages.

### Phase 9 — Testing and Launch
Test the entire product, fix bugs and prepare for launch.

Do not jump between phases without a reason.

---

## 21. How I Want You to Work

Follow these rules throughout development:

1. Explain technical decisions in simple language.
2. Work in small, manageable phases.
3. Do not overwhelm me with unnecessary technical details.
4. Do not assume I understand programming.
5. Before major changes, explain what you intend to change and why.
6. Never delete existing working functionality without approval.
7. Never push code or deploy to production without my permission.
8. Never expose API keys, passwords or payment secrets.
9. Test features before telling me they are complete.
10. Maintain a `PROJECT_STATUS.md` with completed work, remaining tasks and known issues.
11. Update documentation when important functionality changes.
12. If an external account, API key, payment approval or manual action is needed from me, explain exactly what I need to do.

If something is not essential for the MVP, recommend postponing it.

---

## 22. Definition of a Successful MVP

The MVP is ready when:

- The homepage looks premium and trustworthy.
- Customers can browse 6–8 beautiful invitation templates.
- Customers can customise invitations without technical knowledge.
- Customers can preview their invitations.
- Customers can purchase securely.
- Customers receive unique hosted invitation links.
- Invitations work on mobile and desktop.
- WhatsApp sharing works correctly.
- The nine requested languages are supported.
- Cultural categories are available.
- Customers do not need to create accounts.
- The website is fast, secure and tested.
- The product is ready for real customers.

**Our first objective is not to build the biggest wedding invitation platform. It is to build a small, excellent product that customers genuinely want to pay for.**

Start with Phase 1 only. Audit the existing project and create `PROJECT_AUDIT.md`. Do not start modifying the application until I review and approve the audit.
