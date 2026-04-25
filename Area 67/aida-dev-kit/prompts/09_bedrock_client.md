# 09 — AWS Bedrock Client + Prompt Registry

> **Goal**: One unified, well-typed AI helper that all features call. Streaming and non-streaming. Pluggable models. Versioned prompt files.
>
> **Time budget**: 30 minutes
> **Use `/plan` mode**: No (well-defined scope)

---

## Pre-flight check

- [ ] Prompt 08 committed
- [ ] DevOps confirmed Bedrock model access is granted in `ap-southeast-1`
- [ ] `.env.local` has `AWS_REGION=ap-southeast-1`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, optionally `AWS_SESSION_TOKEN`, `BEDROCK_HAIKU_MODEL_ID`, `BEDROCK_SONNET_MODEL_ID`
- [ ] Tested from CloudShell: a Bedrock invoke returned a response (per `CLOUD_RUNBOOK.md §3.3`)

---

## ▼▼▼ COPY EVERYTHING BELOW THIS LINE INTO CLAUDE CODE ▼▼▼

```
Read CLAUDE.md, docs/dev/DEVELOPER_GUIDE.md (especially §4 AI integration patterns), and the existing lib/ai/ folder.

Goal: Build the unified AI client at apps/web/lib/ai/. Every AI call in the app will go through this. Two surfaces: chat() for non-streaming JSON outputs, chatStream() for streaming chat.

Tasks:

1. apps/web/lib/ai/bedrock.ts — the core client:

import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';

Construct one BedrockRuntimeClient using AWS_REGION + credentials from env. Memoize.

export type Model = 'haiku' | 'sonnet';
const MODEL_ID: Record<Model, string> = {
  haiku:  process.env.BEDROCK_HAIKU_MODEL_ID!,
  sonnet: process.env.BEDROCK_SONNET_MODEL_ID!,
};

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export interface ChatOptions {
  model: Model;
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

export async function chat(opts: ChatOptions): Promise<string> {
  // Use InvokeModelCommand with anthropic_version: 'bedrock-2023-05-31'.
  // Body: { anthropic_version, max_tokens, system, messages, temperature? }.
  // Parse response: result.content[0].text.
  // Throw a typed AiError on bad output (with model id + bedrock error code).
}

export async function* chatStream(opts: ChatOptions): AsyncGenerator<string> {
  // Use InvokeModelWithResponseStreamCommand.
  // Iterate chunks, parse content_block_delta events, yield delta.text strings.
  // Properly handle message_stop and any error events.
}

export class AiError extends Error {
  constructor(message: string, public cause?: unknown, public model?: Model) {
    super(message);
  }
}

2. apps/web/lib/ai/json.ts — typed JSON outputs:

export async function chatJson<T>(opts: ChatOptions & { schema: z.ZodSchema<T> }): Promise<T> {
  // Append a strict instruction to the system prompt: "Respond with valid JSON only. No markdown fences. No prose."
  // Call chat().
  // Strip markdown fences if present (defensive).
  // Parse, validate against schema. Throw AiError on parse/validation failure with the raw text in cause.
}

3. apps/web/lib/ai/prompts/ — versioned prompt files. Create the folder and 4 files:

a. matching.system.ts — exports a function buildMatchingSystemPrompt({ locale }: { locale: string }): string. The prompt grounds Claude as a Malaysian aid expert and gives the JSON output schema. Include the schema in the prompt so we get strict JSON. (Implementation will come in prompt 10; for now create with TODO and a stub returning a placeholder string.)

b. aida.system.ts — exports buildAidaSystemPrompt({ locale, userFacts, catalogJson }: {...}). Stubs for now.

c. aida.suggested-replies.ts — exports buildSuggestedRepliesPrompt({ locale, lastResponse }). Stub.

d. ocr-postprocess.system.ts — exports buildOcrPostprocessPrompt({ docType }: { docType: 'mykad' | 'payslip' | 'utility_bill' }). Stub.

4. apps/web/lib/ai/index.ts — re-exports: chat, chatStream, chatJson, AiError, Model, ChatMessage, ChatOptions.

5. Sanity test endpoint: apps/web/app/api/_dev/bedrock-ping/route.ts (GET):
   - Auth-check (require user).
   - Calls chat({ model: 'haiku', system: 'You answer in 1 sentence.', messages: [{ role: 'user', content: 'Say hi in Bahasa Malaysia.' }], maxTokens: 50 }).
   - Returns { ok: true, response: text, latencyMs }.
   - Add a TODO comment: "Remove before production. This is a smoke-test endpoint."

6. Verify:
   - pnpm dev
   - In a logged-in session, GET http://localhost:3000/api/_dev/bedrock-ping
   - Should return JSON with a Bahasa Malaysia greeting and a latencyMs under 3000.
   - If you get 403/AccessDenied: Bedrock model access not granted. Tell DevOps.
   - If you get 400 "model not supported": model ID is wrong, likely missing the apac. prefix.

7. Cost guardrails: Add a tiny log-line in chat() that prints the model used + estimated tokens (input + output * model rate) per call, to stderr. We're well under the $250 AWS credit but it's useful awareness.

Summarize and give commit message.

Do NOT implement the actual matching or chatbot logic yet — those are next prompts. This is just the plumbing.
```

## ▲▲▲ END OF CLAUDE CODE PROMPT ▲▲▲

## Verification

```bash
pnpm dev
# In browser, signed in:
curl -b cookies.txt http://localhost:3000/api/_dev/bedrock-ping
```

Expected: JSON with `ok: true`, a Bahasa Malaysia greeting, and `latencyMs` under 3 seconds.

Commit:
```bash
git add .
git commit -m "feat: Bedrock AI client with typed chat, chatStream, chatJson"
git push
```

## Move on to

`prompts/10_matching_engine.md`
