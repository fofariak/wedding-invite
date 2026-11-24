# Opening library: content review checklist

Created using Anthropic Claude. Keep this internal until each tradition's content has been checked by someone knowledgeable in that tradition.

**Where the texts live:** `src/openings/<tradition>.json`, one entry per opening, found by its `id`. To correct a text, edit the entry and rebuild. Invitations that use it update automatically.

**What every reviewer checks:**
- the original-script text, letter by letter;
- the title, the reference and the meaning (if any);
- whether it is suitable for a wedding invitation.

Please list corrections by `id`.

## Checked against sources on 24 November 2026
- **Quran:** all six Quranic passages match the simple (imlaei) text on quran.com exactly. "(portion)" marks partial verses. Meanings marked "Sahih International" are that translation.
- **Bible:** every verse and blessing uses the exact King James Version (KJV) and World English Bible (WEB) wording, taken from Bible Gateway, with WEB cross-checked on ebible.org.
  - Both are public domain.
  - In the UK the KJV is under Crown letters patent, so check before selling to UK customers.
  - "World English Bible" is a trademark of eBible.org; we name it only to identify the text.
  - Partial verses are marked "(portion)". Quotation marks belonging to the surrounding passage are left out.
- **Wedding dua** (`mu-dua-barakallah`): its wording matches Sunan Abi Dawud 2130 and Jami' at-Tirmidhi 1091 in a secondary dataset. **Please confirm on sunnah.com**, which blocked automated access.

## Changes made to the supplied texts (please confirm)

| id | Change |
|---|---|
| `si-satgur-prasad`, `si-waheguru-ji`, `si-satnam-waheguru`, `si-fateh`, `si-mool-mantar` | Supplied in Devanagari. Now stored in **Gurmukhi** as the main text, with the supplied Devanagari kept as an optional transliteration |
| `si-satnam` | "ੴ एक ओंकार सतनाम" is not a standard form. Replaced with **ੴ ਸਤਿ ਨਾਮੁ** (the opening words of the Mool Mantar) |
| `si-mool-mantar` | Gurmukhi as written in Sri Guru Granth Sahib, Ang 1, split over two lines |
| `hi-shi-uma-maheshwar` | Third line: "वृषकेतनोभ्यां" → **वृषकेतनाभ्यां** |
| `hi-vis-shriman-narayan` | "श्रीमन नारायणाय" → **श्रीमन्नारायणाय** |
| `hi-dev-om-shrim` | "Mahalakshmi Mantra" was listed twice (as a phrase and as a shloka); kept once |
| Jain list | "॥ णमोकार मंत्र ॥" is the name of the mantra rather than an opening line, so it was left out. The full Navkar Mantra is `ja-navkar` |
| `ch-bi-1cor-13-4` | "Love is patient, love is kind" comes from modern copyrighted translations. Replaced with KJV "Charity suffereth long, and is kind" or WEB "Love is patient and is kind." |
| Other Bible entries | Exact KJV/WEB wording replaces the supplied paraphrases where they differed. The verse references are unchanged |

## Added by us, not in the supplied file (please confirm or remove)
- **Transliterations and meanings** for the common Arabic phrases (`mu-bismillah`, `mu-bismillah-short`, `mu-alhamdulillah`, `mu-mashallah`, `mu-inshallah`, `mu-salam`).
- **English meanings** for the Urdu openings (`mu-ur-*`).
- **"Without Scripture" English options:** `mu-pl-grace` "By the Grace of Allah" and `mu-pl-blessings` "With the Blessings of Allah".
- **Latin meanings:** "Deo Gratias" = "Thanks be to God" and "Soli Deo Gloria" = "Glory to God alone".
- **References:**
  - Rigveda 2.23.1 for `hi-gan-gananam-tva`;
  - Rigveda 10.85.42 for `hi-bls-ihaiva-stam`;
  - Rigveda 10.85.46 for `hi-bls-samrajni`;
  - "Sri Guru Granth Sahib, Ang 1" for the Mool Mantar.
- **Motifs** for the "Motif above" design (simple line drawings in `src/openings/meta.json` → `motifs`):
  - Hindu: diya
  - Muslim: eight-point star
  - Christian: plain cross
  - Jain: lotus
  - Sikh and Universal: a floral sprig. **A Sikh reviewer should say whether a Khanda or another symbol is appropriate**; we chose not to draw it ourselves.

## Questions for reviewers
1. **Sikh:** are the Gurmukhi forms correct? Should "ਸਤਿਨਾਮ ਵਾਹਿਗੁਰੂ" be "ਸਤਿਨਾਮੁ ਵਾਹਿਗੁਰੂ"? Is it appropriate to show the Mool Mantar on a wedding invitation in this way?
2. **Jain:** are णमो forms right for your customers, or should a नमो version also be offered? Should the Navkar Mantra include the closing lines (एसो पंच णमोक्कारो…)?
3. **Hindu:**
   - Check the shlokas, especially the long ones: Gajananam, Ya Kundendu, Swasti Mantra, and the Vedic blessings and their Rigveda references.
   - "॥ मंगलं भगवान् विष्णुः ॥" (short phrase) and "मङ्गलं भगवान् विष्णुः…" (full shloka) use different spellings of मंगल/मङ्गल, as supplied. Is that acceptable?
4. **Gujarati script option:** Hindu and Jain texts can be shown in Gujarati letters by a direct letter-for-letter conversion, for example ॥ श्री गणेशाय नमः ॥ → ॥ શ્રી ગણેશાય નમઃ ॥. Please check a few long shlokas in Gujarati for natural spelling.
5. **Muslim:**
   - Is the second dua (`mu-dua-allahumma`, no source given) suitable, and what is its source?
   - Are the Urdu meanings accurate?
   - Should Quranic verses use the Uthmani script instead? quran.com offers both; we use the simple script supplied.
6. **Christian:** are the denomination groupings right (Catholic; Protestant/CSI/Pentecostal)?
7. **Buddhist:** the MVP plan lists Buddhist weddings, but this library has no Buddhist openings yet. They can be added as a new file in the same format.

## Known display rules
- **Placement:** one-line phrases appear under the emblem on the names page. Longer texts (shlokas, verses, duas, multi-line) get their own first page.
- **Right-to-left:** Arabic and Urdu are set right to left with their own fonts (Amiri, Noto Nastaliq Urdu).
- **Fonts:** Gurmukhi, Devanagari and Gujarati use Noto Serif fonts. All fonts are self-hosted under the SIL Open Font License.
- **Separate from the original:** meanings, transliterations and references always appear in smaller type below the original, and can be switched off.
