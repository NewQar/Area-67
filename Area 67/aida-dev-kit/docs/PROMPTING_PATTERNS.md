# Prompting Patterns

> When the canned prompts in `prompts/` don't cover what you need.
>
> The hackathon will throw curveballs — a feature request from PM, a bug to fix, a refactor. This is how you write good prompts in the moment.

---

## The 5 ingredients of a good Claude Code prompt

1. **Context first** — tell it what to read.
2. **Goal** — one sentence, plain English.
3. **Constraints** — what's NOT allowed (the easy way to mess things up).
4. **Tasks** — numbered, specific, in order.
5. **Verification** — how Claude (and you) will know it worked.

---

## Templates

### Template A: Feature addition

```
Read CLAUDE.md, <relevant existing files>.

Use /plan first. Show me the plan, get approval before code.

Goal: <one sentence>.

Constraints:
- <thing not to do #1>
- <thing not to do #2>

Tasks:
1. <step 1>
2. <step 2>
3. <step 3>

Verify:
- <how I'll know it works>

Summarize and give the commit message.

Do NOT <thing not to do that's important enough to repeat>.
```

### Template B: Bug fix

```
Read CLAUDE.md, <files involved in the bug>.

There is a bug: <one-sentence description>.

Repro:
1. <step>
2. <step>
3. Expected: <X>. Actual: <Y>.

Error message (if any):
<paste full error>

Tasks:
1. Diagnose the root cause. Tell me before fixing.
2. Once I confirm the diagnosis, fix it.
3. Add a comment near the fix explaining why.

Don't refactor unrelated code. Don't change the public API.
```

### Template C: Refactor / cleanup

```
Read CLAUDE.md, <files in scope>.

Use /plan. Goal: <what to clean up>.

Constraints:
- No behavioral changes — only structure.
- Run pnpm typecheck and pnpm lint after each step.
- Stop after each file so I can review the diff.

Tasks:
1. <specific structural change>
2. <next>

If you hit something where the cleanup would change behavior, stop and ask me.
```

### Template D: "I have no idea, help me think"

```
Read CLAUDE.md and <relevant files>.

I'm trying to <high-level goal>. I'm not sure how to approach it.

Don't write any code. Don't even use /plan. Just:
1. Lay out the 2-3 most reasonable approaches.
2. For each, name the trade-offs.
3. Recommend one.

Then I'll come back with which to pick.
```

### Template E: Quick edit (no plan needed)

```
In <file path>, <small change>. Show me the diff before applying.
```

---

## Patterns that work

### "Read X before doing anything"
Always start with this. Claude Code's context isn't unlimited and it doesn't auto-load every file. Naming the files you want it to read pulls them into context first.

```
Read CLAUDE.md and lib/ai/bedrock.ts before doing anything else.
```

### "Stop after each file so I can review"
Limits blast radius. If Claude writes something dumb on file 3, you stop it before files 4–10.

```
Stop after each file change so I can confirm before you continue.
```

### "Don't write any code yet"
Forces Claude into planning mode without using `/plan`. Useful for short brainstorms.

```
Don't write code. Just outline the approach.
```

### "Quote the source"
Anti-hallucination. If Claude makes a claim about the codebase, demand evidence.

```
Which file is the auth middleware in? Quote the line where it checks for the cookie.
```

### "Use existing patterns"
Prevents Claude from inventing a new abstraction when one already exists.

```
We already have a Card component in components/ui/card. Use it. Don't write a new one.
```

### "Reject the path of least surprise"
When Claude wants to take a tempting shortcut, name it.

```
Don't add a new dependency for this. Use what we have.
```

```
Don't refactor lib/db/schema.ts as part of this. That's a separate concern.
```

---

## Patterns that fail

### Vague goals
❌ "Make the home page better."
✅ "On the home page, when there are zero matches, replace the empty card with a friendly empty state showing the AIDa avatar and a 'Complete your profile' CTA linking to /onboarding/1."

### "Just make it work"
❌ "Just make the chatbot work."
✅ "The chatbot is returning 500. Here's the error: <paste>. Diagnose, then fix."

### Asking for too much at once
❌ A 30-step prompt that touches 15 files.
✅ Break it into 3 prompts of 10 steps each. Commit between them.

### Open-ended creativity
❌ "Add some animations to make it feel premium."
✅ "Add a 1.5s count-up animation on the home headline number. Use a small useEffect with requestAnimationFrame, no library."

### Trusting Claude on facts
❌ "What does the SARA aid amount cap out at?"
✅ Check `packages/aid-catalog/aids.json` directly. If you must ask Claude, demand a citation: "Based on what's in `aids.json`, what's the SARA cap? Quote the line."

---

## Specific patterns we use a lot in AIDa

### Adding an i18n string
```
Add a new translation key `home.zero_matches_cta` with values:
- en: "Complete your profile to find aid"
- ms: "Lengkapkan profil anda untuk dapatkan bantuan"
- zh: "完成您的资料以查找援助"
- ta: "உதவி கண்டுபிடிக்க உங்கள் சுயவிவரத்தை முடிக்கவும்"

Use it in `components/feature/home/EmptyMatches.tsx` via useTranslations('home').
```

### Adding a new aid to the catalog
```
Read packages/aid-catalog/aids.json and the schema in BA_RESEARCH_GUIDE.md §2.

Add an entry for "<aid name>" with this raw research:
<paste BA's research>

Convert to our JSON schema. last_verified_at: today's date. Don't run the seed — I'll run pnpm seed:aids manually after.
```

### Tweaking the AIDa system prompt
```
Read lib/ai/prompts/aida.system.ts.

Right now AIDa sometimes <undesired behavior>. Update the system prompt to address this. Show me the diff before applying.

Don't change any other behavior. Don't make the prompt longer than necessary.
```

### Adding a new shadcn component
```
We need a Tooltip from shadcn/ui. Run pnpm dlx shadcn@latest add tooltip. Then use it in <file>.
```

### Quick accessibility fix
```
In <file>, the icon-only button has no aria-label. Add one with the same text as the visible label would be in en.json. Read messages/en.json for the right key.
```

---

## When to start a fresh Claude Code session

- Switching from one feature to an unrelated one.
- Conversation has gotten over ~50 turns.
- You ran `/clear` and Claude is still confused.
- Trying to fix something it broke (the broken state is in its head).

Don't be precious about session continuity. Fresh session + good context-loading prompt is faster than fighting a confused one.

---

## When NOT to use Claude Code

- **Reading a file**: just open it in VS Code. Faster.
- **Running a single command**: just run it. You don't need approval.
- **Searching for a string in the codebase**: ripgrep or VS Code search is faster.
- **Git operations**: just do them yourself. Don't let Claude push.
- **Anything destructive**: deleting files, dropping DB tables, force-pushing. Always do these yourself.

Claude Code is a coding pair programmer. It's not a terminal wrapper. Use real tools for real-tool tasks.

---

## The mindset

Treat Claude Code like a senior engineer who is **smart but doesn't know your project until you tell them**. Every prompt is a context dump. The better the dump, the better the output.

If a prompt's output is bad, the prompt was bad. Iterate on the prompt before iterating on the code.
