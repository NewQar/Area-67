# Git Workflow

> Tiny, opinionated. Optimized for a 36-hour hackathon, not a multi-year project.

---

## The rule of small commits

**Commit after every working prompt.** Aim for 15–25 commits across the hackathon.

Small commits = easy rollback. If something breaks at hour 30, you want a clean checkpoint at hour 28.

Bad: "Wrap everything up in one big push at hour 35."
Good: "Each prompt is one commit. If a prompt produces a mess, `git reset --hard HEAD` and try again."

---

## Branching

Default: **work on `main`.** This is a hackathon. We're not running PR review.

Use a feature branch only when:
- You're about to attempt something risky and want a checkpoint to bail to.
- You're working in parallel with someone else on the same area (rare with a team this size).

```bash
# Risky thing
git checkout -b experiment/streaming-chat
# ... try the thing ...
# If it works, merge:
git checkout main
git merge --ff-only experiment/streaming-chat
git push
# If it doesn't, just abandon:
git checkout main
git branch -D experiment/streaming-chat
```

---

## Commit message format

```
<type>: <short message>
```

**Types** (use exactly these):
- `feat` — new user-facing feature
- `fix` — bug fix
- `chore` — config, deps, infra
- `docs` — documentation only
- `refactor` — restructure without behavior change
- `style` — formatting only
- `test` — tests added/updated

**Short message rules:**
- Imperative mood ("add", not "added").
- Lowercase first letter.
- No period at the end.
- Under 72 characters.

**Good:**
- `feat: phone OTP auth flow`
- `fix: onboarding step 3 validation`
- `chore: bump shadcn components`
- `docs: add demo day runbook`

**Bad:**
- `update stuff` (vague)
- `Fixed the bug.` (capital + period + vague)
- `feat: implemented an extremely sophisticated authentication flow leveraging Supabase phone OTP with email fallback for development environments` (too long)

---

## The daily flow

**Start of day / new task:**
```bash
git pull --rebase                    # get any teammate changes
git status                           # confirm clean
```

**During work:**
- Save files in your editor.
- Run `pnpm typecheck` periodically.
- Test the change in the browser.

**End of task (every prompt):**
```bash
git status                           # see what changed
git diff                             # review the diff
git add -p                           # stage in chunks (or `git add .` if small)
git commit -m "feat: <message>"
git push
```

**Before sleeping:**
```bash
git status                           # ensure clean
git log --oneline -5                 # confirm recent commits
git push                             # sync with remote
```

---

## When things go wrong

### "I want to throw away the changes Claude just made"
```bash
git status                           # confirm what changed
git checkout .                       # discard tracked file changes
git clean -fd                        # remove untracked files/folders too (use with care)
```

### "I want to undo the last commit but keep the changes"
```bash
git reset --soft HEAD~1
# changes are now staged but uncommitted; edit and re-commit
```

### "I want to undo the last commit AND throw away the changes"
```bash
git reset --hard HEAD~1
# gone. Hope you didn't want that.
```

### "I committed to main, want to move it to a branch"
```bash
git branch experiment/<name>          # mark current commit on a branch
git reset --hard HEAD~1               # rewind main
git checkout experiment/<name>        # switch to the branch with your work
```

### "I pushed something broken and need to roll back prod"
- **First, on Vercel**: Deployments → previous good deploy → Promote to Production. **30-second rollback. Do this first.**
- **Then in git**:
  ```bash
  git revert HEAD                    # creates a new commit that undoes the last one
  git push
  ```

### "I have merge conflicts after `git pull`"
```bash
git status                           # see which files conflict
# Open each, resolve the <<<<<<< / ======= / >>>>>>> markers
git add <resolved file>
git rebase --continue                # if you were rebasing
# or
git commit                           # if you were merging
```

### "I want to see what was in a previous commit"
```bash
git log --oneline -20                # last 20 commits
git show <hash>                      # full diff of that commit
git show <hash>:apps/web/lib/db/schema.ts  # one file at a time
```

---

## What goes in `.gitignore`

Already configured in prompt 01, but for reference, **never commit**:
- `.env.local` (any `.env*` except `.env*.example`)
- `node_modules/`
- `.next/`
- `*.log`
- `.DS_Store` / `Thumbs.db`
- Any file with a real API key, password, or token

Real protection: never paste a secret into a file Claude Code edits. Always use env vars.

---

## Pre-deploy git hygiene

Before deploying to Vercel:

```bash
git status                           # MUST be clean
git log --oneline -5                 # confirm latest commits look right
pnpm typecheck                       # MUST pass
pnpm build                           # MUST succeed locally first
```

If `pnpm build` fails locally, Vercel will fail too. Don't push and pray.

---

## The `git stash` escape hatch

When you're mid-work and need to switch context (e.g., demo dry run while a feature is half-built):

```bash
git stash push -m "wip onboarding step 5"
# do other thing
git stash pop                        # restore your work
```

Don't leave stashes around. Apply or drop them within a few hours. Stashes are easy to lose track of.
