# 14 — OCR for MyKad (The Demo Wow Moment)

> **Goal**: User snaps a MyKad photo → form auto-fills. AWS Textract → Claude post-process → JSON → form.
>
> **Time budget**: 75 minutes
> **Use `/plan` mode**: Yes

---

## Pre-flight check

- [ ] Prompt 13 committed
- [ ] AWS S3 bucket `aida-docs-<team>` exists in `ap-southeast-5`
- [ ] AWS credentials in `.env.local` work for `s3` and `textract`
- [ ] Tested Textract from CloudShell (per `CLOUD_RUNBOOK.md §3.6`)

---

## ▼▼▼ COPY EVERYTHING BELOW THIS LINE INTO CLAUDE CODE ▼▼▼

```
Read CLAUDE.md, docs/dev/DEVELOPER_GUIDE.md (§6 the OCR pattern), docs/cloud/CLOUD_RUNBOOK.md (§3.4–3.6), and lib/ai/bedrock.ts.

Use /plan. Show me the upload → OCR → AI postprocess → response flow as a sequence diagram.

Goal: Camera → MyKad photo → autofill onboarding form.

Tasks:

1. apps/web/lib/aws/s3.ts:
   - Memoized S3 client (region from S3_REGION env, falls back to AWS_REGION).
   - export uploadFile(key, body, contentType): uploads to S3_BUCKET.
   - export getPresignedUrl(key, opts): generates a short-lived (5 min) signed URL for read.

2. apps/web/lib/aws/textract.ts:
   - Memoized Textract client.
   - export extractText({ s3Bucket, s3Key }): calls DetectDocumentText, returns the full extracted text concatenated + a structured array of LINE blocks with their bounding boxes.

3. apps/web/lib/ai/prompts/ocr-postprocess.system.ts:

export function buildOcrPostprocessPrompt(opts: { docType: 'mykad' | 'payslip' | 'utility_bill' }): string {
  if (opts.docType === 'mykad') {
    return `You are extracting structured data from raw OCR text of a Malaysian MyKad (national ID card).

Output a JSON object with keys:
- full_name: string (the name as it appears, ALL CAPS)
- ic_number: string (12-digit format, with dashes XXXXXX-XX-XXXX)
- dob: string (ISO date YYYY-MM-DD, derived from the IC number's first 6 digits)
- gender: 'M' | 'F' (derived from the last digit of IC: odd=M, even=F)
- state_of_birth: string (derived from digits 7-8 of IC; refer to standard Malaysian state codes)
- address: string (full address as it appears, multiple lines joined with commas)
- raw_lines: string[] (the original lines, for debugging — INCLUDE this so we can verify)

If a field cannot be confidently extracted, set it to null. Do NOT invent.

Output ONLY the JSON object. No markdown fences. No prose.`;
  }
  // similar branches for 'payslip' and 'utility_bill' — stub for now
}

4. apps/web/app/api/ocr/mykad/route.ts (POST):
   - Auth-check.
   - Accept multipart/form-data with a single 'image' file. Validate: max 10MB, image/jpeg or image/png or image/heic.
   - Generate s3Key: `users/{userId}/mykad/{uuid}.{ext}`.
   - Upload to S3.
   - Call Textract with { s3Bucket, s3Key }.
   - Run Comprehend DetectPiiEntities on the raw text → log the PII entities count to a debug log (don't store the entities themselves).
   - Call chatJson with buildOcrPostprocessPrompt({ docType: 'mykad' }) and a Zod schema for the output. Use 'haiku' (fast + cheap, OCR cleanup is well within Haiku's ability).
   - Insert into documents table: type='mykad', s3_key, s3_bucket, ocr_extracted=<the JSON>.
   - Return { ok: true, extracted: { full_name, ic_number, dob, gender, address }, documentId }. **Do NOT return raw_lines to the client** (PII reduction).
   - Errors: 400 invalid file, 500 OCR failed, 502 AI failed.

5. apps/web/components/feature/onboarding/MyKadCapture.tsx (client):
   - Renders inside Step2NameIC (replacing the disabled placeholder button).
   - Two-button row: "Take photo" (uses `<input type="file" accept="image/*" capture="environment">`) and "Choose from gallery" (no capture attr).
   - On file selected:
     - Show a loading overlay: "Reading your IC..." with a spinner.
     - Compress the image client-side to max 1200px wide, 80% quality JPEG (use a tiny inline canvas-based compressor — under 30 lines).
     - POST to /api/ocr/mykad as FormData.
     - On success: prefill the Name and IC fields in the parent form.
     - Show a green success toast: "We filled in your details — please confirm they're correct."
     - On failure: error toast with retry button.
   - The whole flow should target < 5 seconds.

6. Privacy notes — add a small text under the camera buttons: "We only store your IC photo to verify your information. We never share it. Encrypted at rest."

7. Connect to Step2NameIC:
   - When OCR returns, populate the form fields via react-hook-form's setValue.
   - Make the fields visibly highlight (a brief gold border, fades after 2s) so the user sees what was filled.
   - User can still edit before continuing.

8. Update the documents table read in the profile screen (prompt later) to show "MyKad uploaded ✓".

9. Test plan in dev:
   - You don't have a real MyKad. Use a sample image of any Malaysian ID-format text (or just a clearly photographed text card with name + 12-digit number) for the smoke test.
   - The flow should still complete; if extraction fails on a non-real MyKad, that's expected — the API just returns the best-effort fields with nulls.
   - For the demo, a printed mock MyKad with valid format works (BAs can prepare one for Mak Cik Aminah's pre-printed image).

10. Cost guardrails:
    - Textract DetectDocumentText: $0.0015 per page. Tens of cents over the hackathon.
    - Comprehend DetectPiiEntities: $0.0001/100 chars. Trivial.
    - Bedrock Haiku: pennies per OCR call.

Verify:
- Onboarding step 2 → "Take photo" → upload an image → fields fill in.
- Check S3 bucket: file is there.
- Check documents table: row inserted with ocr_extracted JSON.
- The whole experience feels magic on a phone.

Summarize and give commit message.

Do NOT process payslip/utility_bill OCR yet — only MyKad. Do NOT return raw OCR text to the client.
```

## ▲▲▲ END OF CLAUDE CODE PROMPT ▲▲▲

## Verification

Demo this end-to-end on the phone — this is the wow moment of the pitch. Time the experience: tap → fields filled in under 5 seconds.

Commit:
```bash
git add .
git commit -m "feat: MyKad OCR autofill via S3 + Textract + Claude postprocess"
git push
```

## Move on to

`prompts/15_insights_dashboard.md`
