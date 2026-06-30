# Web vs Mobile Terminology Audit

**Date:** 30 June 2026 (updated with payment, profile, and performance detail screenshots)  
**Scope:** Compare NKOTANYI DRIVING SCHOOL web UI wording (Kinyarwanda screenshots) against the IBYAPA mobile app (`i18n/dictionaries.ts` + screen copy).  
**Status:** Recommendations only — **no code changes made yet.**

---

## Executive summary

The web and mobile apps share the same backend and broad feature set, but they diverge in **brand name**, **bottom-navigation labels**, **home-screen copy**, **reading-section terminology**, **performance/history labels**, and **loading messages**. Several mobile strings appear to be older IBYAPA-era wording or English-first labels that were never aligned with the live web product.

The highest-impact gaps are:

1. **Brand:** Web = `NKOTANYI DRIVING SCHOOL` · Mobile = `IBYAPA`
2. **Navigation tab "Exam":** Web = `Kora Ibizami` · Mobile = `Ikizamini`
3. **Navigation tab "Performance":** Web = `Ibyo wakoze` · Mobile = `Imikorere`
4. **Home welcome body:** Completely different message on web vs mobile
5. **Exam instructions body:** Web mentions **Free Test**; mobile does not
6. **Reading section:** Web uses **IGAZETI / Ibitabo** framing; mobile uses **PDF / inyandiko**
7. **Payment screen:** Web uses **ifatabuguzi** (subscription) terminology; mobile uses **gahunda** (plan)
8. **Profile screen:** Web uses **Imyirondoro/Konti**, **Ifatabuguzi**, **Warishyuye?**; mobile uses different labels throughout

---

## Method

| Source | What was reviewed |
|--------|-------------------|
| **Web** | 10 screenshots: Home, Exam instructions, Read (Soma), Performance (Ibyo wakoze), loading states (Read, Watch, PDF progress), **Payment**, **Profile**, **Performance detail** |
| **Mobile** | `i18n/dictionaries.ts` (keys `rw`, `en`, `fr`), plus hardcoded strings in `SplashScreen.tsx`, `ExamNativeScreen.tsx`, `PdfViewerScreen.tsx` |

Language focus: **Kinyarwanda (rw)** because all web screenshots are in Kinyarwanda. English/French mobile keys are noted where alignment should follow the same pattern.

---

## Global / cross-screen differences

### Branding

| Element | Web | Mobile | Severity |
|---------|-----|--------|----------|
| Product name in header | **NKOTANYI DRIVING SCHOOL** | Not shown in main nav; splash shows **IBYAPA** | High |
| Tagline | (not visible in screenshots) | Splash: **ROAD SAFETY LEARNING** (hardcoded English) | Medium |
| PDF watermark | — | `NKOTANYI` hardcoded in `PdfViewerScreen.tsx` | Medium — inconsistent with IBYAPA branding |
| App config name | — | `app.json` → `"name": "IBYAPA"` | Decision needed |

**Recommendation:** Decide whether mobile should rebrand to **NKOTANYI DRIVING SCHOOL** everywhere users see it, or whether web will migrate to IBYAPA. Until that decision is made, terminology alignment will always feel partial.

---

### Bottom navigation (all main tabs)

| Tab | Web | Mobile key | Mobile (rw) | Match? |
|-----|-----|------------|-------------|--------|
| Home | **Ahabanza** | `nav.home` | Ahabanza | ✅ |
| Exam | **Kora Ibizami** | `nav.exam` | **Ikizamini** | ❌ |
| Read | **Soma** | `nav.read` | ** Gusoma** (note leading space) | ❌ |
| Watch | **Reba** | `nav.watch` | Kureba | ⚠️ Close — web is shorter imperative |
| Performance | **Ibyo wakoze** | `nav.performance` | **Imikorere** | ❌ |

**Suggested mobile changes (rw):**

| Key | Current | Proposed (match web) |
|-----|---------|----------------------|
| `nav.exam` | Ikizamini | **Kora Ibizami** |
| `nav.read` | ` Gusoma` | **Soma** (also fix leading space) |
| `nav.watch` | Kureba | **Reba** |
| `nav.performance` | Imikorere | **Ibyo wakoze** |

**English equivalents to consider for consistency:**

| Key | Current (en) | Proposed |
|-----|--------------|----------|
| `nav.exam` | Exam | **Take exams** (or **Practice exams**) |
| `nav.performance` | Performance | **Your activity** / **History** |

---

### Loading / wait messages

| Context | Web | Mobile key | Mobile (rw) | Match? |
|---------|-----|------------|-------------|--------|
| General page load (Read) | **Mutegereze...** | `common.loading` | Birimo gutegurwa... | ❌ |
| General page load (Watch) | **Mutegereze Mwihanganye akanya gato...** | `video.loading` | Gutegura videwo… | ❌ |
| Splash | — | `splash.wait` | Tegereza gato… | ⚠️ Partial |
| PDF download | **Tegereza... 0%** | `pdf.downloading` | Gukurura inyandiko... {percent}% | ⚠️ Same idea, different verb |

**Suggested mobile changes (rw):**

| Key | Current | Proposed |
|-----|---------|----------|
| `common.loading` | Birimo gutegurwa... | **Mutegereze...** |
| `video.loading` | Gutegura videwo… | **Mutegereze Mwihanganye akanya gato...** |
| `reading.loadingDocuments` | Gupakira inyandiko… | **Mutegereze...** (or web-specific variant) |
| `splash.wait` | Tegereza gato… | **Mutegereze Mwihanganye akanya gato...** (optional — only if splash should match web tone) |
| `pdf.downloading` | Gukurura inyandiko... {percent}% | **Tegereza... {percent}%** |

---

## Screen-by-screen comparison

---

### 1. Home / Ahabanza

#### Welcome banner

| Element | Web | Mobile key | Mobile (rw) |
|---------|-----|------------|-------------|
| Greeting | Murakaza neza, Innocent Dev Techy! | `home.welcome` | Murakaza neza, {name}! ✅ |
| Subtext | Hitamo kimwe muri ibi hepfo. Ushobora gukora ibizami, gusoma amasomo, kureba amavidewo, cyangwa kureba ibyo wakoze. | `home.subwelcome` | Uri ku nzira yo guhabwa uruhushya rwawe. ❌ |

**Suggested change:**

```
home.subwelcome (rw):
  FROM: Uri ku nzira yo guhabwa uruhushya rwawe.
  TO:   Hitamo kimwe muri ibi hepfo. Ushobora gukora ibizami, gusoma amasomo, kureba amavidewo, cyangwa kureba ibyo wakoze.
```

#### Action cards (web 2×2 grid vs mobile learning paths)

| Web card | Web description | Mobile equivalent | Mobile (rw) title | Mobile (rw) subtitle |
|----------|-----------------|-------------------|-------------------|----------------------|
| **Kora Ibizami** | Tangira ibizami n'imyitozo. | `home.action.exams` / `home.action.examsSub` | Ibizamini | Gerageza ubumenyi ❌ |
| **Soma** | Iga ukoresheje Amasomo yanditse. | `home.action.reading` / `readingSub` | Ibikoresho byo gusoma | Amabwiriza ❌ |
| **Reba** | Wige ukoresheje amavidewo. | `video.listTitle` / `nav.watch` | Amasomo ya videwo / Kureba | — ❌ |
| **Ibyo wakoze** | Reba ibizami wamaze gukora. | `home.action.performance` / `performanceSub` | Amateka y'imikorere | Subira amanota ❌ |

**Suggested mobile changes (rw):**

| Key | Proposed |
|-----|----------|
| `home.action.exams` | **Kora Ibizami** |
| `home.action.examsSub` | **Tangira ibizami n'imyitozo.** |
| `home.action.reading` | **Soma** |
| `home.action.readingSub` | **Iga ukoresheje Amasomo yanditse.** |
| `home.action.performance` | **Ibyo wakoze** |
| `home.action.performanceSub` | **Reba ibizami wamaze gukora.** |

For the Watch/Reba card, add or reuse keys so the home card says **Reba** / **Wige ukoresheje amavidewo.** instead of "Amasomo ya videwo".

#### Tip of the day (web only)

| Element | Web | Mobile |
|---------|-----|--------|
| Section title | **Inama y'Umunsi** | Not present |
| Body | Koresha buri munsi ibibazo n'amavidewo byacu kugira ngo wimenyereze, wongere ubumenyi, kandi utsinde ikizami ufite icyizere. | Not present |

**Recommendation:** Add new i18n keys (e.g. `home.tipTitle`, `home.tipBody`) and a home-screen section if parity with web is required.

#### Mobile-only home content (no web equivalent in screenshots)

These exist on mobile but were not seen on the web home screenshot. **No change suggested** unless you want to remove them for parity:

- Readiness card (`home.keepMomentum`, `home.startJourney`, stats pills)
- Metric strip (total exams, avg accuracy, success rate)
- Primary CTA eyebrow (`home.primaryEyebrow`: "Komeza urugendo rwawe")
- Recommended content / recent insight sections

---

### 2. Exam instructions / Kora Ibizami entry

| Element | Web | Mobile key | Mobile (rw) | Match? |
|---------|-----|------------|-------------|--------|
| Card heading | **Ibyo ugomba kuba wujeje kugira ngo utangire** | `examInstructions.webHeroTitle` | Ibyo ugomba kuba **wujuje** kugira ngo utangire | ⚠️ Spelling: wujeje vs wujuje |
| Body | Kugira ngo ubashe gukora ikizamini, ugomba kuba wishyuye kandi ucyemerewe gukora ibizamini waguze. **Cyangwa se ukaba utarakora ikizamini cy'ubuntu (Free Test) tuguha. Murakoze cyane!** | `examInstructions.webHeroBody` | Kugira ngo ubashe gukora ikizamini, ugomba kuba **wirishyuye** kandi ucyemerewe gukora ibizamini **waguzwe**. Amahirwe masa! | ❌ |
| CTA button | **Tangira →** | `examInstructions.webHeroCta` | Tangira | ✅ (arrow is UI) |

**Suggested mobile changes (rw):**

| Key | Proposed |
|-----|----------|
| `examInstructions.webHeroTitle` | **Ibyo ugomba kuba wujeje kugira ngo utangire** |
| `examInstructions.webHeroBody` | **Kugira ngo ubashe gukora ikizamini, ugomba kuba wishyuye kandi ucyemerewe gukora ibizamini waguze. Cyangwa se ukaba utarakora ikizamini cy'ubuntu (Free Test) tuguha. Murakoze cyane!** |

**Important product note:** The web copy explicitly advertises a **free test**. Mobile exam gating currently pushes subscription immediately (`ExamInstructionsNativeScreen`). Aligning copy without aligning behavior would confuse users. Decide whether to restore free-trial gating or soften web-style wording.

#### Guidelines section (mobile only in current UI)

Mobile also shows `examInstructions.guidelinesTitle` ("Amabwiriza ngombwa") and four guide bullets — not visible in the web screenshot. **Keep as-is** unless web has equivalent content elsewhere.

---

### 3. Read / Soma

| Element | Web | Mobile key | Mobile (rw) | Match? |
|---------|-----|------------|-------------|--------|
| Page heading | **IGA IGAZETI N'IBYAPA HANO** | `reading.libraryTitle` | Ububiko bw'amasomo yawe | ❌ |
| Subheading | **Hitamo ibitabo (PDF) cyangwa ibyapa...** | `reading.librarySubtitle` | Iga ibyapa n'inyandiko zemewe ku muvuduko wawe. | ❌ |
| Documents tab | **IGAZETI - Ibitabo** (badge: 8) | `reading.pdfSection` | **PDF zo kwiga** | ❌ |
| Signs tab | **Ibyapa** (badge: 2) | `reading.roadSigns` | **Ibimenyetso** | ❌ |
| Search placeholder | **Shakisha igitabo...** | `reading.searchDocuments` | Shakisha **inyandiko** | ❌ |
| Document count | **ibitabo 8** | `reading.documentCount` | **8 inyandiko bihari** | ❌ |
| Open action | **kanda hano usome** | `reading.tapToOpen` | **Kanda ufungure** | ❌ |

**Suggested mobile changes (rw):**

| Key | Proposed |
|-----|----------|
| `reading.libraryTitle` | **IGA IGAZETI N'IBYAPA HANO** |
| `reading.librarySubtitle` | **Hitamo ibitabo (PDF) cyangwa ibyapa...** |
| `reading.pdfSection` | **IGAZETI - Ibitabo** |
| `reading.roadSigns` | **Ibyapa** |
| `reading.searchDocuments` | **Shakisha igitabo...** |
| `reading.documentCount` | Restructure to **ibitabo {count}** (may need template change) |
| `reading.tapToOpen` | **kanda hano usome** |
| `reading.documentSingular` | **igitabo** |
| `reading.documentPlural` | **ibitabo** |

**Screen title:** `reading.title` is currently **Gusoma**; web nav uses **Soma**. Consider changing to **Soma** for consistency.

---

### 4. Watch / Reba

Web screenshot shows only a loading state. Inferred labels from nav/home:

| Element | Web (from nav/home) | Mobile key | Mobile (rw) |
|---------|---------------------|------------|-------------|
| Tab label | Reba | `nav.watch` | Kureba ❌ |
| Home card | Reba / Wige ukoresheje amavidewo. | `video.listTitle` | Amasomo ya videwo ❌ |
| Loading | Mutegereze Mwihanganye akanya gato... | `video.loading` | Gutegura videwo… ❌ |

**Suggested changes:** See navigation and loading tables above. Also update `video.libraryTitle` from "Iga ureba" to something closer to web tone if a dedicated heading exists on web video list.

---

### 5. Performance / Ibyo wakoze

| Element | Web | Mobile key | Mobile (rw) | Match? |
|---------|-----|------------|-------------|--------|
| Page concept | Activity history | `performance.title` | **Imikorere** | ❌ |
| Banner title | **Incamake y'ibizamini byose umaze gukora** | `performance.yourScore` | **Amanota yawe** | ❌ |
| Banner subtitle | Abantu bose **nuku** batangira, Wowe ugire umwete wo kwiga **bizakunda**! | (none) | — | ❌ Missing |
| Inline stat | Ibizamini Byose hamwe wakoze: 10 | `performance.totalExams` | Ibizamini byose ✅ (casing differs) |
| Inline stat | Watsinze: 0% | `performance.successRate` | Ijanisha ryo gutsinda | ⚠️ Web uses **Watsinze** |
| Stat card | **Ikigereranyo cy'Amanota ( Mwayene)** | `performance.avgAccuracy` | **Ugereranije** | ❌ |
| Stat card | **Watsinze** (count) | `performance.passedExams` | Watsinze ✅ |
| Stat card | **Ibizamini Byose hamwe wakoze** | `performance.totalExams` | Ibizamini byose | ⚠️ Casing |
| Stat card | **Uko amanota azamuka /amanukamo** | `performance.scoreTrend` | Impinduka z'amanota | ⚠️ Similar meaning, different phrasing |
| Progress section | **Amanota Yawe** | `performance.yourScore` | Amanota yawe | ✅ |
| Progress labels | **0% Amake wabonye** · **30% Amenshi wabonye** | `performance.lowestScore` / `highestScore` | Make / Menshi | ❌ |
| Progress center | Ikigereranyo cy'Amanota ( Mwayene) 15% | (shown in banner, not bar center) | — | ⚠️ Layout differs |
| Table title | **Ibizamini Byawe** | `performance.examList` | Ibizamini byawe | ✅ |
| Column: Exam | **IKIZAMINI** | `performance.examColumn` | Ikizamini | ✅ (singular — matches web) |
| Column: Score | **AMANOTA** | `performance.scoreColumn` | Amanota | ✅ |
| Column: Result | **UMWANZURO** | (no dedicated key — status shown inline) | — | ❌ Missing label |
| Pass/Fail | **Watsinzwe** | `performance.failed` | Watsinzwe | ✅ |
| Exam type names | Road Signs Only / Mixed Questions (English) | Hardcoded in `ExamNativeScreen.tsx` | Same English | ⚠️ OK if intentional |

**Suggested mobile changes (rw):**

| Key | Proposed |
|-----|----------|
| `performance.title` | **Ibyo wakoze** |
| `performance.yourScore` (banner context) | Split into two keys — banner: **Incamake y'ibizamini byose umaze gukora**; progress bar title: **Amanota Yawe** |
| NEW `performance.bannerSubtitle` | **Abantu bose nuku batangira, Wowe ugire umwete wo kwiga bizakunda!** |
| `performance.avgAccuracy` | **Ikigereranyo cy'Amanota ( Mwayene)** |
| `performance.successRate` | **Watsinze** (when shown as %) |
| `performance.scoreTrend` | **Uko amanota azamuka /amanukamo** |
| `performance.lowestScore` | **Amake wabonye** (UI should prefix with `0%` like web) |
| `performance.highestScore` | **Amenshi wabonye** (UI should prefix with highest % like web) |
| NEW `performance.resultColumn` | **UMWANZURO** |
| `performance.examColumn` | **IKIZAMINI** |

---

### 6. Exam types & results (inferred from performance table)

Exam names appear in **English** on both platforms:

| Exam type | Web table | Mobile (`ExamNativeScreen.tsx`) |
|-----------|-----------|----------------------------------|
| Signs-only | Road Signs Only | `toExamTitle()` → "Road Signs Only" (hardcoded) |
| Mixed | Mixed Questions | "Mixed Questions" (hardcoded) |

Mobile i18n has localized alternatives that are **not used** in exam results:

- `examType.mixed.title` (rw): Ibibazo bivanzwe
- `examType.signs.title` (rw): Ibyapa gusa

**Recommendation:** Replace hardcoded `toExamTitle()` with `t('examType.mixed.title')` / `t('examType.signs.title')` **only if** web will also localize these in the history table. If web keeps English exam names, mobile can stay English for parity.

---

### 7. Subscription / payment gates (paywall modals)

Mobile gate modals appear before the full payment screen:

| Mobile key | Mobile (rw) | Web equivalent | Match? |
|------------|-------------|----------------|--------|
| `gate.subscription.exam` | Nta mafaranga wishyuye kugira ngo ukore ibizamini. | Exam page mentions payment + free test | ❌ |
| `gate.payNow` | **Ishyura Nonaha** | Payment page CTA: **Ishyura Ubu** | ⚠️ Nonaha vs Ubu |

**Suggested change:** `gate.payNow` (rw) → **Ishyura Ubu** for consistency with the payment checkout button.

---

### 8. Payment / Kwishyura (new screenshot)

Web payment is a single checkout flow with three stacked sections. Mobile splits this across `SubscriptionNative` (plan picker) and `PaymentNative` (method + checkout), with different headings and vocabulary.

#### Page headings & instructions

| Element | Web | Mobile key | Mobile (rw) | Match? |
|---------|-----|------------|-------------|--------|
| Main heading | **Hitamo ifatabuguzi ukeneye n'uburyo bwo kwishyura** | `payment.investTitle` | Shora mu mahoro yawe | ❌ |
| Subheading | **Hitamo uburyo n'amafaranga ushaka kwishyura.** | `payment.investBody` | Hitamo gahunda. Bona ibikoresho no kwiga ibizamini. | ❌ |
| Method instruction | **Kanda kuri MTN Mobile Money, AIRTEL Money cyangwa VISA CARD mu birango biri hano.** | `payment.selectMethodHint` | MTN MoMo, Airtel Money n'ikarita birakora. | ❌ |
| Amount section title | **Hitamo amafaranga ushaka kwishyura** | (no dedicated key — uses `payment.investTitle` on subscription screen) | — | ❌ Missing |
| Phone section title | **Shyiramo Numero ya Telefone iriho amafaranga** | (no equivalent banner) | — | ❌ Missing |

**Suggested mobile changes (rw):**

| Key | Proposed |
|-----|----------|
| `payment.investTitle` | **Hitamo ifatabuguzi ukeneye n'uburyo bwo kwishyura** |
| `payment.investBody` | **Hitamo uburyo n'amafaranga ushaka kwishyura.** |
| `payment.selectMethodHint` | **Kanda kuri MTN Mobile Money, AIRTEL Money cyangwa VISA CARD mu birango biri hano.** |
| NEW `payment.selectAmountTitle` | **Hitamo amafaranga ushaka kwishyura** |
| NEW `payment.phoneSectionTitle` | **Shyiramo Numero ya Telefone iriho amafaranga** |

#### Payment method labels

| Method | Web label | Mobile key | Mobile (rw) | Match? |
|--------|-----------|------------|-------------|--------|
| MTN | **Mobile Money** | `payment.methodMomo` | MoMo | ❌ |
| Airtel | **Airtel Money** | `payment.methodAirtel` | Airtel | ❌ |
| Card | **Ikarita** | `payment.methodCard` | Ikarita | ✅ |

**Suggested changes:**

| Key | Proposed (rw) |
|-----|---------------|
| `payment.methodMomo` | **Mobile Money** |
| `payment.methodAirtel` | **Airtel Money** |

#### Subscription plan names (with RWF amounts)

Web shows plan name + price in one button. Mobile fetches live prices from backend (`backendPricing.ts`) — amounts **match** web for Kinyarwanda tier, but **labels differ**:

| Web plan label | Web price | Mobile key | Mobile (rw) | Price match? |
|----------------|-----------|------------|---------------|--------------|
| **Umunsi Wose** | 2000 RWF | `payment.plan.day` | Umunsi umwe | ✅ 2000 |
| **Ibizamini Bibiri** | 300 RWF | `payment.plan.twoExams` | Ibizamini bibiri gusa | ✅ 300 |
| **Ibizamini Bitanu** | 500 RWF | `payment.plan.fiveExams` | Ibizamini bitanu gusa | ✅ 500 |
| **Icyumweru** | 5000 RWF | `payment.plan.week` | Icyumweru kimwe | ✅ 5000 |
| **Ibyumweru Bibiri** | 8000 RWF | `payment.plan.twoWeeks` | Ibyumweru 2 | ✅ 8000 |
| **Ukwezi** | 10000 RWF | `payment.plan.month` | Ukwezi kumwe | ✅ 10000 |

**Suggested plan label changes (rw):**

| Key | Proposed |
|-----|----------|
| `payment.plan.day` | **Umunsi Wose** |
| `payment.plan.twoExams` | **Ibizamini Bibiri** |
| `payment.plan.fiveExams` | **Ibizamini Bitanu** |
| `payment.plan.week` | **Icyumweru** |
| `payment.plan.twoWeeks` | **Ibyumweru Bibiri** |
| `payment.plan.month` | **Ukwezi** |

**Note:** Plan titles may also come from the API at runtime. If backend returns different strings, mobile should prefer API labels when present and use i18n only as fallback.

#### Phone input & checkout

| Element | Web | Mobile key | Mobile (rw) | Match? |
|---------|-----|------------|-------------|--------|
| Phone label | **Numero ya Telefone** | (uses placeholder only on checkout) | — | ⚠️ |
| Phone placeholder | **Shyiramo numero ya telefone** | `payment.phonePh` | 7XX XXX XXX | ❌ |
| Total label | **Igiciro Cyose** | `payment.totalDue` | Igiciro cyose | ✅ (casing only) |
| Pay button | **Ishyura Ubu →** | `payment.payNow` | Ishyura ubu | ✅ |
| Subscription term | **ifatabuguzi** | `profile.subscriptionPlan` / `payment.planLabel` | **Gahunda** | ❌ |

**Suggested mobile changes (rw):**

| Key | Proposed |
|-----|----------|
| NEW `payment.phoneLabel` | **Numero ya Telefone** |
| `payment.phonePh` | **Shyiramo numero ya telefone** |
| `payment.planLabel` | **Ifatabuguzi** |
| `profile.subscriptionPlan` | **Ifatabuguzi** |

#### Mobile-only payment copy (no web equivalent in screenshot)

These exist on mobile subscription screen but were not on the web payment screenshot. **Keep unless web also drops them:**

- `payment.customTitle` / `payment.customBody` — custom plan for schools
- `payment.bestValue` — badge on plans
- `payment.activePlanRenewHint` — renew banner for subscribed users
- `payment.secure` — encryption notice
- `payment.checkoutTitle` — card WebView modal title

---

### 9. Profile / Imyirondoro (new screenshot)

Web profile uses a two-card layout (account left, payment right). Mobile uses a single scrollable screen with separate sections.

#### Account card

| Element | Web | Mobile key | Mobile (rw) | Match? |
|---------|-----|------------|-------------|--------|
| Section heading | **Imyirondoro/ Konti yawe** | `profile.myAccount` | Konti yanjye | ❌ |
| Screen title | (in page, not header) | `profile.title` | Umwirondoro | ⚠️ Partial |
| Names label | **Amazina:** | `profile.fullName` | Amazina | ✅ |
| Language label | **Ururimi rwa Konti:** | `profile.language` | Ururimi rwa **porogaramu** | ❌ |
| Phone label | **Numero Ya Telefoni :** | `profile.phone` | **Telefoni** | ❌ |
| Edit button | **Hindura Umwirondoro** | `profile.edit` | Hindura umwirondoro | ⚠️ Capitalization |

**Suggested mobile changes (rw):**

| Key | Proposed |
|-----|----------|
| `profile.myAccount` | **Imyirondoro/ Konti yawe** |
| `profile.language` | **Ururimi rwa Konti** |
| `profile.phone` | **Numero Ya Telefoni** |
| `profile.edit` | **Hindura Umwirondoro** |

**UI note:** Mobile profile does not expose a dedicated **Edit profile** button — language is tappable, but name/phone are read-only. Web shows an explicit edit CTA. Consider adding `profile.edit` button if parity is required (behavior, not just strings).

#### Payment / subscription card

| Element | Web | Mobile key | Mobile (rw) | Match? |
|---------|-----|------------|-------------|--------|
| Section heading | **Amakuru Ajyanye n'ubwishyu** | `profile.paymentInfo` | Amakuru yo kwishyura | ❌ |
| Active plan label | **Ifatabuguzi Riheruka** | `profile.planActive` | Gahunda iri gukora | ❌ |
| Plan value example | **Ukwezi Kumwe** | (shows status text, not plan name) | — | ❌ Missing plan name display |
| Expiry label | **Igihe Ifatabuguzi rizarangirira** | `profile.endDate` | Itariki isoza | ❌ |
| Paid label | **Warishyuye?** | `profile.paymentStatus` | Imiterere yo kwishyura | ❌ |
| Paid value | **Yego** | `profile.paid` | Yishyuwe | ❌ |
| Renew button | **Kuvugurura** | `profile.update` | Hindura | ❌ |

**Suggested mobile changes (rw):**

| Key | Proposed |
|-----|----------|
| `profile.paymentInfo` | **Amakuru Ajyanye n'ubwishyu** |
| `profile.planActive` | **Ifatabuguzi Riheruka** (when showing current plan name context) |
| NEW `profile.planActiveFallback` | **Gahunda iri gukora** (when no plan name available) |
| `profile.endDate` | **Igihe Ifatabuguzi rizarangirira** |
| `profile.paymentStatus` | **Warishyuye?** |
| `profile.paid` | **Yego** |
| `profile.update` | **Kuvugurura** |
| `profile.noPlan` | Confirm web wording for unpaid state (not visible in screenshot) |

**Data gap:** Mobile profile screen does not currently show subscription end date (`profile.endDate` key exists but is **not rendered** in `ProfileNativeScreen.tsx`). Web shows "July 3, 2026 at 5:00 PM". Adding this field is a UI + data change, not just i18n.

#### Terminology shift: gahunda → ifatabuguzi

Web consistently uses **ifatabuguzi** (subscription) in payment and profile. Mobile uses **gahunda** (plan) in multiple keys. Aligning with web means updating:

- `payment.planLabel`
- `payment.planDefault`
- `profile.subscriptionPlan`
- `profile.planActive` / related status strings

---

## Hardcoded strings outside i18n (should be migrated)

| File | Hardcoded text | Recommendation |
|------|----------------|----------------|
| `SplashScreen.tsx` | `IBYAPA`, `ROAD SAFETY LEARNING` | Move to i18n; align brand with NKOTANYI if rebranding |
| `ExamNativeScreen.tsx` | `Road Signs Only`, `Mixed Questions` | Use `examType.*.title` or new result keys |
| `PdfViewerScreen.tsx` | `NKOTANYI` watermark | Align with chosen brand |
| `VideoCoursePlayerScreen.tsx` | `IBYAPA` placeholder | Align with chosen brand |
| `AppHeader.tsx` | `Back` accessibility label | Add `common.back` i18n key |

---

## Typo / formatting issues found in mobile only

| Location | Issue |
|----------|-------|
| `nav.read` (rw) | Leading space: `' Gusoma'` |
| `examInstructions.webHeroTitle` (rw) | **wujuje** vs web **wujeje** |
| `examInstructions.webHeroBody` (rw) | **wirishyuye / waguzwe** vs web **wishyuye / waguze** |

---

## Recommended implementation plan (when approved)

### Phase 1 — High impact, low risk (i18n only)

1. Update `nav.*` rw strings to match web tab labels.
2. Update `home.subwelcome` and home action card titles/subtitles.
3. Update `examInstructions.webHeroTitle` and `webHeroBody` (including free-test sentence).
4. Update `reading.*` section titles, tabs, search, and tap-to-open copy.
5. Update `performance.*` banner, stat labels, and table headers.
6. Update loading messages (`common.loading`, `video.loading`, `reading.loadingDocuments`).
7. Update `payment.*` headings, method labels, plan names, phone placeholder, and **ifatabuguzi** terminology.
8. Update `profile.*` account and payment card labels; align `gate.payNow` with **Ishyura Ubu**.

### Phase 2 — Structure / UI parity

1. Add **Inama y'Umunsi** (tip of the day) to home screen.
2. Add `performance.bannerSubtitle` and `performance.resultColumn` to performance table UI.
3. Adjust `reading.documentCount` template to say "ibitabo 8" format.
4. Add payment **phone section banner** (`payment.phoneSectionTitle`) and **amount section title** on subscription screen.
5. Show **subscription end date** and **plan name** on profile (web shows "Ukwezi Kumwe" + expiry).
6. Add **Hindura Umwirondoro** edit affordance on profile if web parity is required.

### Phase 3 — Brand & behavior decisions

1. Resolve **IBYAPA vs NKOTANYI DRIVING SCHOOL** across splash, config, and watermarks.
2. Resolve **free test** messaging vs subscription-only gating in exam flow.
3. Localize or keep English exam type names consistently on both platforms.
4. Confirm whether plan labels come from API or i18n fallback when backend returns different strings.

---

## Summary table: priority changes

| Priority | Area | Change |
|----------|------|--------|
| P0 | Brand | Decide IBYAPA vs NKOTANYI before mass string updates |
| P0 | `nav.exam` | Ikizamini → **Kora Ibizami** |
| P0 | `nav.performance` | Imikorere → **Ibyo wakoze** |
| P0 | `home.subwelcome` | Replace with web paragraph |
| P1 | Home action cards | Match web titles + descriptions |
| P1 | `examInstructions.webHeroBody` | Add free-test sentence; fix verb forms |
| P1 | Reading section | IGAZETI / Ibitabo / Ibyapa terminology |
| P1 | Performance labels | Match web stat names, banner, score bar labels |
| P1 | Payment headings | **Hitamo ifatabuguzi…** / **Hitamo amafaranga…** |
| P1 | Plan names | Umunsi Wose, Ibizamini Bibiri, Icyumweru, etc. |
| P1 | Profile labels | Imyirondoro/Konti, Ifatabuguzi, Warishyuye?, Kuvugurura |
| P1 | Terminology | **gahunda** → **ifatabuguzi** across payment/profile |
| P2 | Loading messages | Mutegereze / Tegereza alignment |
| P2 | Payment methods | MoMo → **Mobile Money**, Airtel → **Airtel Money** |
| P2 | `gate.payNow` | Ishyura Nonaha → **Ishyura Ubu** |
| P2 | Tip of the day | New home section |
| P2 | Profile expiry date | Show end date on profile screen |
| P2 | Hardcoded exam titles | Route through i18n |
| P3 | Free trial behavior | Align gating logic with web copy |
| P3 | Plan label source | API vs i18n fallback for live pricing |

---

## What was intentionally not changed

Per your request, **no code or dictionary files were modified**. This document is the full recommendation set for your review.

When you are ready, tell me which phases or items to implement and I will apply the updates to `i18n/dictionaries.ts` and any affected screens.
