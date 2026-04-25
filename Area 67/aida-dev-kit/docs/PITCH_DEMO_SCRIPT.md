# Pitch Demo Script

> The live walkthrough during the pitch. **Memorize this. Practice 3 times before pitch day.**
>
> **Total time on app**: 3:30 — 4:00. Leave room for the deck before and Q&A after.

---

## Pre-pitch checklist (T-30 minutes)

- [ ] Demo phone fully charged + plugged in
- [ ] Production URL bookmarked on demo phone home screen
- [ ] `pnpm seed:demo` run against prod ≤ 1 hour ago (refreshes Aminah's data)
- [ ] Test the magic-login button on the demo phone — confirm it lands on home
- [ ] Backup laptop with the same URL open in Chrome, signed in to Aminah's account
- [ ] Recorded video of the demo loaded and ready in another browser tab (last-resort fallback)
- [ ] Phone on Do Not Disturb — no notifications mid-demo
- [ ] Wifi tested at venue. If sketchy, switch to phone hotspot.
- [ ] PM has the deck open, BA has the printed mini-poster of Aminah's persona for the room

---

## The opening (deck, ~30 seconds — PM does this)

> "1 in 5 Malaysian households eligible for aid never claim it. Not because the aid doesn't exist — but because they can't navigate it. Today we'll show you how AIDa solves this."
>
> *(Hands the demo phone to the demo-driver — that's you.)*

---

## The demo (you, ~3:30)

### Beat 1: First impression (15 seconds)

**Action**: Show the login screen. Tap **"Demo as Mak Cik Aminah"**.

**Say**:
> "This is Mak Cik Aminah. Single mother, 58, Klang. Earns RM 1,800 a month selling kuih. There are 8 aid programs she might qualify for — let's see what she does next."

*(App loads to home screen. Animated count-up plays.)*

---

### Beat 2: The headline number (20 seconds)

**Action**: Pause on home screen. Let the headline land.

**Say**:
> "Up to RM 6,400 a year. We found that for her in 4 seconds. AIDa cross-checked her profile against every active federal, state, and zakat program in Malaysia."

**Action**: Scroll down to show eligible aids carousel. Tap one — STR.

**Say**:
> "STR — Sumbangan Tunai Rahmah. RM 1,200 a year, paid in tranches. AIDa explains exactly why she qualifies and walks her through the next step."

**Action**: Quickly back out to home.

---

### Beat 3: The "near miss" (45 seconds — THE MONEY MOMENT)

**Action**: Scroll to the **You're close to qualifying** section. Tap "Show me how" on **SARA**.

**Say**:
> "Here's where AIDa is different. Aminah is RM 200 a month away from qualifying for SARA — that's RM 2,400 a year she's leaving on the table. Why? She's not registered with eKasih."

**Action**: Drawer opens explaining the gap. Tap **"Open chat with AIDa"**.

**Say**:
> "Most apps would just dump a link to a government website. AIDa does this:"

**Action**: Chat tab opens. Aminah's pre-existing conversation visible. Type: *"Macam mana saya boleh daftar eKasih?"*

*(Wait for AIDa to stream a response in BM.)*

**Say**:
> "She's getting a response in her language, in plain words, with concrete next steps. This is Claude Haiku 4.5, grounded in the actual aid catalog — no hallucinated URLs, no made-up amounts."

---

### Beat 4: The OCR moment (45 seconds — THE WOW MOMENT)

**Action**: Switch tabs to **Profile**. Tap "Update my IC" (or back to onboarding step 2 — wherever the upload lives).

**Say**:
> "AIDa is built for low-literacy users. So we made forms disappear."

**Action**: Tap "Take photo". Hold up a printed mock MyKad. Snap. *(Pause for the loading state.)*

*(After ~3 seconds, fields populate.)*

**Say**:
> "Name. IC number. Date of birth. State. Address — all extracted in under 4 seconds. AWS Textract for character recognition, Claude Haiku to clean up the noise into structured JSON."

---

### Beat 5: The tracker (30 seconds)

**Action**: Tap the **Tracker** tab.

**Say**:
> "Once Aminah applies, AIDa tracks it. STR — applied last week. LZS Bantuan Bulanan — approved. SARA — waiting on her eKasih registration. JKM — eligible, ready to apply."

**Action**: Expand one tracker item to show the document checklist.

**Say**:
> "Per aid, AIDa tells her exactly which documents she needs. Each can be ticked off when she has them ready. No more 'I went to the office and they sent me back for a missing payslip.'"

---

### Beat 6: The B2G story (35 seconds — THE BUSINESS MOMENT)

**Action**: Profile → "View insights".

**Say**:
> "Now flip the camera around. Every interaction generates anonymized data on aid uptake gaps. State by state. Category by category."

**Action**: Pause on the bar chart of state uptake.

**Say**:
> "Selangor has 65% uptake of cash aids. Sabah has 31%. That's not a Sabah problem — that's a discoverability problem. Policy teams pay tens of millions a year trying to figure this out via surveys."

**Action**: Tap on the "Top reasons users miss aid" panel.

**Say**:
> "AIDa knows. In real time. Anonymized. This is our B2G play — selling these insights as a subscription to ministries and NGOs."

---

### Beat 7: The close (20 seconds — back to PM)

**Action**: Hand the phone back to PM with the home screen visible.

**PM says**:
> "Aminah found RM 6,400 a year in 4 minutes. She also found RM 2,400 more if she takes one small step. We get there because of three things judges care about: AWS Bedrock for the AI brain, Alibaba RDS for data residency in Malaysia, and TNG eWallet as the disbursement rail. AIDa: aid that finds you, not the other way around."

---

## Things to NOT do during the demo

- Don't apologize. Even if something glitches, *narrate forward*: "And here's where the real one would show X — let me show you the next bit."
- Don't say "this is just a hackathon prototype." It's a product.
- Don't read from notes. Use the app as the cue card.
- Don't tap rapid-fire — pause at each beat so the visual lands.
- Don't switch languages mid-demo. The pre-seed is in BM. Stay in BM.

---

## Failure recovery moves

| What goes wrong | What you say + do |
|---|---|
| Magic login fails | "Let me sign in normally —" *(swap to PM's laptop where you're already signed in. Continue from home.)* |
| Match results don't load | "AIDa's brain is on the cloud, give her a second —" *(refresh once. If still broken, switch to laptop.)* |
| Chatbot doesn't respond | "Here's the response when it lands —" *(show the recorded video tab, or read out a typical response.)* |
| OCR doesn't trigger | "On a real phone with a real MyKad this takes 4 seconds — let me skip ahead." *(Move to next beat. Don't dwell.)* |
| App is completely broken | "Let me show you the recorded version of the flow." *(Play the video. Don't apologize. Frame it as 'so we can focus on what matters'.)* |

The video backup is mandatory. Record it the night before. Update if anything significant changes.

---

## Q&A prep — the 10 questions you'll get

### 1. "How do you handle data privacy / PII?"
> "Data residency in Malaysia via Alibaba RDS in `ap-southeast-3`. PII is encrypted at rest with PostgreSQL pgcrypto. We use AWS Comprehend to scrub IC numbers from any text we send to AI models. We never store unmasked OCR text — only the structured fields."

### 2. "Why both AWS and Alibaba?"
> "Best tool for each job. AWS Bedrock has Claude — best multilingual reasoning for our use case. Alibaba RDS keeps Malaysian user data on Malaysian soil. PDPA compliance + AI quality, no compromise."

### 3. "Won't users tell you the wrong income to qualify for more?"
> "We surface the answer of what they qualify for, but the actual application is still verified by each agency. We're a discovery and walkthrough layer, not a fraud-enabler. We also flag inconsistencies — if someone says income RM 1,000 but uploads a payslip showing RM 5,000, we ask them to reconcile."

### 4. "How is this different from JKM's existing portal?"
> "JKM lists JKM aids. eKasih is one registry. LZS sites are state-by-state. Aminah doesn't know to visit 7 sites. AIDa is the cross-cutting interface — federal, state, zakat, all in her language, in her hand."

### 5. "What about Bahasa Sarawak / Sabah dialects?"
> "Phase 2. Today: BM, English, Mandarin, Tamil. Adding Iban, Kadazan, Hokkien is data work, not engineering work — the architecture supports it."

### 6. "How do you make money?"
> "Three rails. (1) MDR on disbursement when aid lands in TNG eWallet and is spent at SME merchants. (2) B2G subscription to ministries for the insights dashboard. (3) Premium features for upper-B40 households — automated reminders, family accounts."

### 7. "What stops the government from building this themselves?"
> "Nothing. We'd love them to. But ministries move on year-long procurement cycles, and we're 36 hours in with a working app. Speed of execution. We're also language-neutral and politically-neutral — government has structural reasons to be slower at both."

### 8. "What's your accuracy on matching?"
> "Two layers. Deterministic rules catch citizenship, age, income band, state — those are 100% accurate. Claude Sonnet handles the ambiguous cases — 'is the household composition like asnaf?' — with confidence levels we surface in the UI. Where we're unsure, we say 'near miss' rather than 'eligible'."

### 9. "How does this scale beyond Malaysia?"
> "Aid systems are deeply local. We wouldn't lift-and-shift to Indonesia. But the *pattern* — onboarding wizard + matching engine + chatbot + tracker — is portable. Phase 3."

### 10. "Why TNG eWallet for disbursement?"
> "30 million users, of whom millions are unbanked or underbanked. SARA already runs on this rail. We're not creating a new payment system — we're creating the demand-side that funnels into one that already works."

---

## After the demo

- Hand business card / QR code to deck.
- Don't pack up immediately if the judges want a side conversation — they often do.
- Take note of follow-up questions for the iteration if we make next round.
