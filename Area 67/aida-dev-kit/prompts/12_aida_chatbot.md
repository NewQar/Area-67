# 12 — AIDa Chatbot (Streaming, Multilingual, Suggested Replies)

> **Goal**: The AIDa chat tab. Streaming responses from Claude Haiku, RAG over the aid catalog, suggested-reply chips, and a UI that feels familiar (WhatsApp-style without IP risk).
>
> **Time budget**: 90 minutes
> **Use `/plan` mode**: Yes

---

## Pre-flight check

- [ ] Prompt 11 committed
- [ ] Bedrock streaming works (test by adding a quick streaming smoke test if unsure)

---

## ▼▼▼ COPY EVERYTHING BELOW THIS LINE INTO CLAUDE CODE ▼▼▼

```
Read CLAUDE.md, docs/dev/DEVELOPER_GUIDE.md (§4.3 chatbot pattern), docs/design/DESIGN_PRINCIPLES.md (§4 chatbot UI), and lib/ai/bedrock.ts.

Use /plan. Show:
- The system prompt (full text).
- The streaming protocol (SSE? plain ReadableStream?).
- The chat state model (server-persisted vs client-only).
Approve before code.

Goal: Build AIDa, the chatbot. Streaming, multilingual, grounded in the aid catalog, with suggested-reply chips.

Behavioral rules for AIDa:
- Always replies in the user's profile.language. If the user types in a different language, reply in that language but offer to switch.
- Cites aids by name when relevant. Never invents URLs.
- Refuses topics outside scope (legal, tax filing beyond eligibility, medical, financial advice). Redirects to relevant authority.
- Warm, plain language, short paragraphs. Bullet lists OK for steps.
- For unanswered questions, says so honestly + suggests calling the relevant agency.

Tasks:

1. apps/web/lib/ai/prompts/aida.system.ts — full system prompt:

export function buildAidaSystemPrompt(opts: {
  locale: 'en' | 'ms' | 'zh' | 'ta';
  user: { firstName?: string; state?: string; language: string };
  profileSummary: string; // pre-formatted "Your matched aids: STR (RM...), SARA (near miss because...)"
  catalogJson: string; // slim JSON of all active aids
}): string {
  const localeName = LOCALE_NAMES[opts.locale];
  return `You are AIDa, a friendly case worker helping ${opts.user.firstName ?? 'a user'} navigate Malaysian government aid, zakat, and welfare programs.

Always reply in ${localeName}. Use simple, warm language — your user may have low digital literacy and might be stressed about money. Keep paragraphs short. Use bullet lists for steps. Add line breaks for readability on a phone.

YOU CAN HELP WITH:
- Explaining what aids the user qualifies for and why.
- Walking through application steps for any aid in the catalog.
- Explaining what eKasih, asnaf, B40, M40, SARA, STR, MyKad credit, JKM mean.
- Suggesting the next concrete action.

YOU MUST NOT:
- Give legal, tax, or medical advice. Redirect to LHDN, doctors, etc.
- Invent aids, amounts, or URLs not in the catalog.
- Pretend you have access to the user's bank account or live aid status — you don't.
- Respond in a language other than ${localeName} unless explicitly asked.
- Roleplay as another product or break character.

USER CONTEXT:
${opts.profileSummary}

AID CATALOG (the only aids you can reference; cite by name):
${opts.catalogJson}

When unsure or asked about something outside your scope, say so plainly and suggest who to call. End every response with one sentence offering a concrete next step.`;
}

const LOCALE_NAMES = { en: 'English', ms: 'Bahasa Malaysia (mesra dan mudah difahami)', zh: 'Simplified Mandarin', ta: 'Tamil' };

2. apps/web/lib/ai/prompts/aida.suggested-replies.ts:

export function buildSuggestedRepliesPrompt(opts: { locale: string; lastResponse: string }): string {
  return `Given this last reply from AIDa:
"""
${opts.lastResponse}
"""

Suggest 3 short follow-up questions the user might want to tap. Each must be:
- Under 8 words.
- In ${LOCALE_NAMES[opts.locale]}.
- Specific to the last reply (not generic).

Output ONLY a JSON array of 3 strings. No prose, no markdown.`;
}

3. apps/web/lib/ai/aida/profile-summary.ts:
   - serializeProfileForAida(profile, matches): string. Builds the human-readable profile summary used in the system prompt. Includes top 5 matched aids by amount with their verdict.

4. apps/web/lib/ai/aida/catalog.ts:
   - getCatalogForAi(locale): returns a stripped-down JSON string of all active aids — id, name in locale, provider, amount.description, application_url, application.steps[0..2], short_eligibility_summary. Cap total length to ~30k characters.

5. apps/web/app/api/aida/chat/route.ts (POST, streaming):
   - Auth-check.
   - Parse body: { messages: ChatMessage[], lang?: 'en'|'ms'|'zh'|'ta' }.
   - Load profile + matches + catalog.
   - Build system prompt.
   - Call chatStream({ model: 'haiku', system, messages, maxTokens: 800 }).
   - Stream tokens back to the client as SSE (text/event-stream). Use a ReadableStream and write `data: ${JSON.stringify({ type: 'delta', text })}\n\n` per chunk. End with `data: ${JSON.stringify({ type: 'done' })}\n\n`.
   - On error: write `data: ${JSON.stringify({ type: 'error', message })}\n\n` and end.
   - After streaming completes, persist the user message + assistant message to chat_messages table.

6. apps/web/app/api/aida/suggested-replies/route.ts (POST):
   - Body: { lastResponse: string, lang: string }.
   - Calls chatJson with buildSuggestedRepliesPrompt and a Zod schema z.array(z.string()).length(3).
   - Returns { replies: string[] }.
   - Uses model 'haiku' (cheap + fast for this short task).

7. apps/web/app/(app)/aida/page.tsx (server component):
   - Auth + profile.
   - Loads recent chat_messages history (last 20).
   - Renders <ChatScreen initialMessages={history} />.

8. apps/web/components/feature/aida/ChatScreen.tsx (client):
   - Layout: full-height between AppHeader and BottomNav. Three regions: header (AIDa avatar + name + status "online"), messages list (scrollable, bottom-aligned), composer (sticky bottom).
   - State: messages: ChatMessage[], pending boolean, suggestedReplies: string[].
   - On mount, scrolls to bottom.
   - On message send: append user message, POST to /api/aida/chat, read SSE stream, append assistant message progressively. After done, fetch suggested replies via /api/aida/suggested-replies.
   - Show "AIDa is thinking..." typing indicator while pending.

9. apps/web/components/feature/aida/MessageBubble.tsx:
   - Two variants: 'user' (right-aligned, white/cream background, no avatar) and 'aida' (left-aligned, brand-primary tint background, with the AIDa avatar circle).
   - Contains text (use react-markdown for AIDa responses to render bullets/links cleanly — sanitize with rehype-sanitize). Add @tailwindcss/typography for prose styles.
   - Timestamp below each message in muted small text.

10. apps/web/components/feature/aida/SuggestedReplies.tsx:
    - Renders 3 chips above the composer.
    - Tappable; sends as next user message.
    - Disappears once user types something or sends a message.

11. apps/web/components/feature/aida/Composer.tsx:
    - Sticky to bottom (above BottomNav).
    - Textarea (auto-resizing, max 4 rows) + Send button.
    - Mic icon button on the left — for THIS prompt, hooks into native browser SpeechRecognition (webkitSpeechRecognition). When pressed, listens, transcribes to the textarea. If browser doesn't support, hide the icon. Don't send voice audio anywhere (privacy).
    - Send disabled when text is empty or pending.

12. apps/web/components/feature/aida/AidaAvatar.tsx:
    - A simple SVG-rendered illustrated avatar (a friendly stylized circle with some character — generate a small inline SVG, ~16 lines). Two sizes: sm (24px) and md (40px).

13. Initial greeting:
    - If chat history is empty, AIDa starts with a localized greeting from messages/{locale}.json:
      en: "Hi {name}! I'm AIDa, your aid case worker. I can help you find aid, walk you through applications, or just answer questions. What would you like help with?"
      ms: "Hai {name}! Saya AIDa, pembantu anda untuk bantuan kerajaan. Saya boleh tolong cari bantuan, terangkan langkah permohonan, atau jawab soalan. Apa yang anda perlu?"
    - This greeting is stored as a system message in chat_messages with role='system' or rendered client-only without persisting (your call — pick simpler).
    - Add 3 starter suggested replies:
      en: ["What aids do I qualify for?", "How do I register with eKasih?", "When does STR open?"]
      ms: ["Bantuan apa saya layak?", "Bagaimana daftar eKasih?", "Bila STR buka?"]

14. Refusal pattern test:
    - The system prompt should make AIDa decline a question like "How much income tax do I owe?" with: "I'm here to help with aid programs. For tax questions, please contact LHDN at hasil.gov.my or call 03-8911 1000."
    - Include this explicitly in the system prompt as a refusal example.

15. Performance:
    - First token from Bedrock should arrive in < 1.5s (Haiku is fast).
    - The whole reply for a typical question completes in 4–8s.
    - If first token doesn't arrive in 5s, abort and show "Take a deep breath, AIDa is having a slow moment. Try again."

Verify:
- Open /aida.
- See greeting + 3 suggested replies.
- Tap "What aids do I qualify for?" → AIDa replies with a streaming response naming actual matched aids.
- Type "Bila STR buka?" in BM → AIDa replies in BM.
- Type a refusal-test: "How do I file my taxes?" → AIDa redirects to LHDN.
- Reload page → conversation history persists.
- Test on real phone — mic icon works in Chrome, doesn't crash on Safari iOS.

Summarize and give commit message.

Do NOT add image/file upload to the chat. Do NOT add multi-turn tool use. Do NOT persist suggested replies (regenerate each time).
```

## ▲▲▲ END OF CLAUDE CODE PROMPT ▲▲▲

## Verification

Test these prompts manually on the deployed app:

1. *"What aids do I qualify for?"* — names actual matched aids
2. *"Bantuan apa untuk anak sekolah?"* (BM) — replies in BM about education aids
3. *"What is eKasih?"* — clear plain-language explanation
4. *"How much tax do I owe?"* — refuses, redirects to LHDN
5. *"Are you a human?"* — graceful answer

Commit:
```bash
git add .
git commit -m "feat: AIDa streaming chatbot with multilingual support and suggested replies"
git push
```

## Move on to

`prompts/13_tracker.md`
