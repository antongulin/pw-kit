---
name: fix-test
description: Systematic 6-phase workflow for investigating and fixing failing Playwright tests. Classifies the root cause as app bug (test.fail + defect report), broken test (test.fixme + fix-me task), or flaky test (fix timing/data/state root cause). Uses trace viewer, app source code grep, and live reproduction with playwright-cli. Use when user invokes /pw-kit:fix-test, asks to "fix this failing test", "investigate test failure", "debug a test", or shares a test that's failing.
when_to_use: |
  Trigger phrases: "/pw-kit:fix-test", "fix failing test", "test failure", "investigate failure", "debug test", "why is this test failing", "flaky test", "test.fail vs test.fixme". Slash command only — does not auto-activate.
disable-model-invocation: true
allowed-tools: Bash(npx playwright test:*) Bash(playwright-cli:*) Bash(git:*) Read Grep Glob Edit
---

# /pw-kit:fix-test — Investigate and Fix a Failing Test

Follow this 6-phase workflow when a user asks you to fix a failing test. The non-negotiable rule: **never guess the root cause.** Use the trace, the source code, and live reproduction to classify the failure before changing anything.

## Required Inputs (collect first)

Before starting Phase 1, ensure you have:

1. **Failing test path** (e.g., `tests/customers/customers-crud-test.spec.ts:42` or just the test name)
2. **Error output** — what Playwright reported
3. **Trace file** — usually at `test-results/<test-name>/trace.zip`
4. **Ticket key** the test is verifying (if it's `PREFIX-NNNNN: ...`, extract NNNNN)
5. **App repo path** (if the user configured `appRepoPath` in plugin userConfig, use that; otherwise ask)

If any are missing, ask the user before starting Phase 1.

## Phase 1 — Gather Context

Collect:

- **Failing test source** — read the full test file and any POMs it uses.
- **Error message and stack trace** — note the failing line, the matcher used, and any timeout indication.
- **The linked dev/feature ticket** — for source-code analysis in Phase 3.
- **Recent test changes** — `git log -p <test-file> | head -100` to see if the test was recently touched.

```bash
# Run the failing test and capture output
npx playwright test path/to/test.spec.ts --headed

# Or for just the trace
npx playwright show-trace test-results/<test-name>/trace.zip
```

## Phase 2 — Analyze the Test

Read the test file end-to-end and the POMs it imports. Look for:

- **Wrong locator** — does the `data-testid` match what's actually in the app?
- **Base class method usage** — is the test using `BaseGridPage.editRowByDescription()` correctly?
- **Recent test changes** — `git log -p` and `git blame` on the failing line and the POMs.
- **Wrong fixture dependency** — `{ page }` instead of `{ browserPage }`?
- **Missing await** — `expect(...)` without `await` is a common bug.

If the test was recently modified, the regression is likely there. If it hasn't been touched in months, the regression is likely in the app.

### Cross-check API usage with the installed Playwright version (Context7 MCP)

If the failing line uses a Playwright API whose signature you're unsure about (e.g., `expect.toPass`, `page.routeFromHAR`, custom matchers, fixture scoping), read the installed version from `package.json` and look up the version-matched docs via **Context7 MCP** before guessing. Playwright API surface changes between minor versions; verifying against the right version eliminates a class of false-positive "bug" reports.

## Phase 3 — Analyze the App Source

In the app repo:

```bash
cd <app-repo>
git log --all --grep="<TICKET_KEY>" --oneline   # find commits for the feature
git log --since="<test-was-last-passing>" -- <component-path>  # find recent changes
```

For each candidate component file:
- Check `data-testid` attributes — were any renamed or removed?
- Check route paths — did URL patterns change?
- Check API endpoints — did request/response shapes change?

If you find the smoking gun in app code, that's evidence for "app bug" classification.

## Phase 4 — Reproduce With Playwright CLI

Open a real browser and walk through the failing test step-by-step. **Do not skip this phase** — static analysis often misses runtime behavior.

```bash
playwright-cli open <APP_URL>
playwright-cli snapshot                           # what's the actual DOM?
# manually replay the test steps
playwright-cli click eN
playwright-cli snapshot                           # what changed?
playwright-cli run-code "async page => fetch('/api/...').then(r => r.json())"  # API shape?
```

Look for:
- **Element not present** — testid was renamed in the app
- **Element present but behind overlay** — needs to be dismissed first
- **API response shape changed** — assertion is now wrong
- **Timing** — the failing element does appear but later than the test expects

Run the test in headed mode to watch it fail in real time:

```bash
npx playwright test path/to/test.spec.ts --headed --slow-mo=500
```

If it fails differently each run → flaky (intermittent).
If it fails the same way every run → deterministic (bug or broken test).

## Phase 5 — Classify and Act

Use this decision tree:

### App behaves correctly + test is wrong → BROKEN TEST

The test asserts something that doesn't match the actual (correct) app behavior. Fix the test.

**Before changing the test code**, verify the new expected value live with `playwright-cli`. Don't trust the commit message or the source diff alone — confirm the testid/locator/text actually exists in the rendered DOM right now:

```bash
playwright-cli open <APP_URL_of_the_page>
playwright-cli snapshot                        # confirm the new testid is present
# or for a specific element:
playwright-cli run-code "async page => page.getByTestId('new-testid-name').count()"
```

Only after the live UI confirms the new value, edit the page object or test:

```ts
// Fix the test in place if simple
// e.g., update the expected text, the locator, the cleanup, the timing
```

If the fix is non-trivial (takes more than a few lines or touches multiple POMs), mark `test.fixme`, create a fix-me task in the project tracker, and add a comment:

```ts
// Fix-me task: PREFIX-NNNNN — Outdated assertion on email validation; rewrite to match new UX
test.fixme('PREFIX-12345: ...', async ({ ... }) => { /* ... */ });
```

### App doesn't match expected result → APP BUG

The app's behavior is wrong; the test correctly catches it. Mark `test.fail` and produce a structured bug report.

```ts
// Defect: DEFECT-67890
test.fail('PREFIX-12345: ...', async ({ ... }) => { /* ... */ });
```

The `test.fail` acts as a **live sentinel**: when the bug is fixed in the app, the test will start passing unexpectedly, alerting whoever is on call. **Always include the defect ticket key in a comment.**

Produce a bug report in this exact structure (ready to paste into a defect ticket):

```markdown
## Title
<short description of the broken behavior>

## Steps to reproduce
1. ...
2. ...
3. ...

## Expected result
<what should happen, from the ticket>

## Actual result
<what actually happens, from your reproduction>

## Evidence
- Screenshot: <path or attachment>
- Trace: <path>
- Network capture: <relevant API URLs and response excerpts>

## Technical details
- Component: <component name in app repo>
- Likely commit: <SHA if found via git log>
- Related: <linked tickets>

## Possible root cause
<your hypothesis from Phase 3 source analysis>
```

### Intermittent failure → FLAKY TEST

The test fails some runs and passes others. Find and fix the root cause — **do not** add `test.fixme`, `test.skip`, or retries.

Common flaky causes:
- **Timing**: missing `await expect(...)`, snapshot-style assertion, `networkidle` wait, hardcoded `waitForTimeout`
- **Parallel data collision**: hardcoded record description, missing random suffix
- **Shared mutable state**: module-level variables, leftover data from previous run
- **Animation**: element clicked while transitioning; need to wait for stable state first

Fix the root cause, then verify with:

```bash
# Run the same test 10 times in a row to check for flakiness
for i in {1..10}; do
  npx playwright test path/to/test.spec.ts || break
done
```

If it passes 10/10, it's no longer flaky.

## Phase 6 — Verify and Report

Run the test:

```bash
npx playwright test path/to/test.spec.ts
```

- **App bug fix**: the test should still fail (since `test.fail` is now in place); if it passes, your `test.fail` may be wrong.
- **Broken test fix**: the test should now pass; if not, the fix isn't done.
- **Flaky test fix**: run 10 times; should pass all 10.

Report back to the user:

```markdown
## Root Cause
<one paragraph explanation>

## Classification
[App Bug | Broken Test | Flaky]

## Evidence
- Trace step that revealed the issue: <step number / description>
- Source code reference: <component file:line>
- Reproduction notes: <what you saw with playwright-cli>

## Action Taken
- [ ] Marked test.fail with defect ticket DEFECT-NNNNN
- [ ] Bug report prepared (see below)
OR
- [ ] Fixed test in place: <brief description>
OR
- [ ] Fixed flakiness root cause: <description>

## Next Steps for User
- [ ] Create defect ticket from bug report and link DEFECT-NNNNN
- [ ] Review and approve the test fix
- [ ] (if flaky fix) Run the test 10× locally to verify stability
```

## Critical Rules

1. **Never guess.** Use the trace, source code, and live reproduction. Speculative fixes waste time.
2. **Classify before fixing.** App bug, broken test, and flaky test have completely different actions.
3. **Never add `waitForTimeout` to make a test pass.** That's flaky tape, not a fix.
4. **Never mark flaky tests as `test.skip`.** Use `test.fixme` and create a tracking task so the issue is visible.
5. **`test.fail` requires a defect ticket key.** No `.fail` without traceability.
6. **Always reproduce with playwright-cli** before concluding. Static analysis misses runtime behavior.

## Further Reading


Additional reference docs (recipes, deep-dives, edge cases) will be added based on team feedback. PRs welcome.
