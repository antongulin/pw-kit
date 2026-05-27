---
name: new-test
description: Guided workflow for creating a new Playwright + TypeScript test from a ticket. Walks through context gathering, app source analysis, existing test inventory, live discovery with playwright-cli or Playwright MCP, proposal gate before writing code, implementation collaboration, and mandatory gap analysis. Use when user invokes /pw-kit:new-test, asks to "write a new test", "create a test for TICKET-NNNNN", "implement test from ticket", or mentions a QA/feature ticket needs testing.
when_to_use: |
  Trigger phrases: "/pw-kit:new-test", "new test", "create a test for", "implement test from", "write test for TICKET", "test from ticket", "test from card", "from QA ticket". Slash command only — does not auto-activate.
disable-model-invocation: true
allowed-tools: Bash(npx playwright test:*) Bash(playwright-cli:*) Bash(node:*) Read Grep Glob Edit Write
---

# /pw-kit:new-test — Guided Test Creation From Ticket

Follow this 7-phase workflow when a user asks you to write a Playwright test from a ticket. The workflow has a hard rule: **never guess**. Verify everything against the ticket, the app source, or a live browser snapshot.

## Required Inputs (collect first)

Before starting Phase 1, ensure you have:

1. **Ticket key** (e.g., `PREFIX-12345`) — and either ticket content pasted by user, or access to fetch it.
2. **Application repo path** — local path to the app source. If the user configured `appRepoPath` in plugin userConfig, use that. Otherwise ask.
3. **Application URL** for live discovery.
4. **Credentials** (typically already in `.env`).

If anything is missing, ask the user for it before starting Phase 1.

## Phase 1 — Gather Context (read the ticket)

Extract from the ticket:

- **Scenario names** — verbatim, no paraphrasing. These become `test.step` descriptions.
- **Step text** — verbatim Given / When / Then text.
- **Expected results** — what the test should assert.
- **Preconditions** — what must be true before the test starts (user role, existing data, environment flags).
- **Linked dev/feature ticket** — for source code analysis in Phase 2.

**Do not paraphrase the ticket.** The ticket is the source of truth for test names and step text. If the wording in the ticket is awkward, flag it back to the user — do not silently rewrite.

If any acceptance criteria are ambiguous or missing, **flag them now** with a `[QUESTION: ...]` annotation and ask the user before proceeding. A wrong guess costs more than a clarifying question.

## Phase 2 — Analyze App Source

Read the application repo to find:

- **Changed files** for this feature — `git log --grep="$TICKET_KEY"` in the app repo, then read changed components.
- **`data-testid` attributes** on UI elements you'll need to target.
- **Routes** — URL patterns, especially for navigation assertions.
- **API endpoints** — request/response shapes for any backend interactions.

For each API the test will exercise:

```bash
# Verify the actual response shape, do not assume
playwright-cli run-code "async page => {
  return await page.evaluate(() => fetch('/api/path').then(r => r.json()));
}"
```

Field names in API responses often differ from TypeScript interface names. **Verify the actual shape before writing code that depends on field names.**

If the app repo is not available, say so to the user and skip directly to Phase 4 (live discovery).

## Phase 3 — Inventory Existing Tests and Page Objects

Search the test repo for:

- **Existing page object** for the page under test. If it exists, you'll extend or add methods to it. If not, you'll create one.
- **Existing tests** for the same feature area. Understand what's already covered.
- **Existing testids and method names** to follow conventions.
- **Base class methods** that already provide what you need — check `pages/base-page.ts`, `pages/base-grid-page.ts`, `pages/base-edit-page.ts` exhaustively before considering adding a new method.

Reference skills:
- **pom** for the base class hierarchy and decision tree
- **locators** for testid conventions
- **fixtures** for registering new page objects
- **test-organization** for naming and Gherkin structure

## Phase 4 — Live Discovery (verify before coding)

Open the page under test in a real browser. Walk through every ticket step interactively before writing any code.

```bash
playwright-cli open <APP_URL>
playwright-cli snapshot                    # extract element IDs (e1, e2, ...) and testids
playwright-cli click e3                    # try the interaction; CLI emits the locator code
playwright-cli fill e5 "test value"        # CLI emits page.getByRole(...) for you
```

Capture and verify:

- **All `data-testid` values** for elements you'll target. Note any missing testids — they need TODO comments later.
- **The interaction sequence** for each ticket step. Verify it works in the live UI.
- **API response shapes** via `playwright-cli run-code "async page => fetch(...)"`.
- **Edge cases** — what happens with empty data, invalid input, slow network?

Save evidence: `playwright-cli screenshot`, `playwright-cli tracing-start` / `tracing-stop` for the full walk-through if needed.

### Verify API signatures against the installed Playwright version (Context7 MCP)

Before using a Playwright method you're not 100% sure about — especially newer matchers, fixtures, or routing APIs — check the installed version in `package.json` first, then look up the matching docs via the **Context7 MCP**:

```
1. Read package.json → note the installed @playwright/test version (e.g. 1.49.0)
2. Use Context7 to resolve the library id for Playwright Test, version-pinned
3. Fetch the relevant API docs for that version
```

Why this matters: APIs evolve. `page.routeFromHAR`, `expect.toPass`, `test.use({ trace })` and many others have changed signatures across versions. If you write code based on training-era docs, the user's installed version may behave differently. Always reconcile against the installed version's docs when there's any doubt.

## Phase 5 — Propose Implementation (approval gate)

**Before writing any test code**, present the implementation plan to the user. Get explicit approval before proceeding. The proposal must include:

| Item | Details |
|---|---|
| Test file location | `tests/<feature>/<name>-test.spec.ts` (with correct naming per **test-organization**) |
| Page objects to create or modify | List each, with which base class it extends and what new methods to add |
| New locators | List each with its testid (or fallback + TODO comment if missing) |
| Fixture registry changes | Which fixtures to add to `base-pages-fixture.ts` (alphabetical position) |
| Test structure | List of `test.describe` + `test` blocks, with verbatim ticket step text in Gherkin form |
| Cleanup strategy | What data will be created, how it will be cleaned up (try/finally + cleanupNeeded flag) |
| Open questions | Any `[QUESTION: ...]` items from Phase 1 still pending |

Present as a structured list, not prose. Ask: "Approve this plan? Any changes before I start writing?"

**Do not write code until the user approves.** If they request changes, revise the plan and re-present.

## Phase 6 — Implement Collaboratively

Once the plan is approved, implement in this order:

1. **Page object methods** first (in `pages/.../*-page.ts`). Add the new locators and methods.
2. **Fixture registration** (in `pages/base-pages-fixture.ts`). Insert alphabetically in both the `Pages` interface and the `test.extend({...})` body.
3. **Test file** last (in `tests/<feature>/*-test.spec.ts`).

After each file, briefly summarize what changed so the user can spot issues early.

When the test is written, run it **headed** to verify behavior:

```bash
npx playwright test tests/<feature>/<name>-test.spec.ts --headed
```

If it fails, debug using the trace viewer or `playwright-cli` step-by-step replay. Never add `waitForTimeout` to make a test pass.

Apply the pre-PR checklist from the **test-organization** skill before considering the implementation complete:

- [ ] Test name follows `PREFIX-NNNNN: Description` format
- [ ] `test.step` with Gherkin keywords on every test
- [ ] User referred to as "User"
- [ ] Locators in POM, not in test
- [ ] Web-first assertions only (`await expect(locator).to...`)
- [ ] No `waitForTimeout`, no `networkidle`
- [ ] No hardcoded dates
- [ ] Try/finally cleanup for data-modifying tests
- [ ] No functions defined in test file
- [ ] Fixtures alphabetical
- [ ] TODO comments for missing testids with ticket key

## Phase 7 — Gap Analysis (mandatory, not optional)

After the test passes and the pre-PR checklist is clean, perform a structured gap analysis. **Do not skip this phase.** Even if no gaps exist, present "no gaps found" explicitly.

Cross-reference the ticket scenarios against:

- **Untested UI controls** on the same page — are there switches, dropdowns, buttons, or input fields the test doesn't exercise?
- **Boundary conditions** — empty values, max-length values, special characters, leading/trailing whitespace.
- **Empty states** — what does the user see when there are zero records?
- **Data variants** — different record types, different permission levels, different locales.
- **Weak assertions** — any `test.step` with a `Then` that doesn't actually assert? (Empty step body or just a navigation with no `expect`?)
- **Error states** — invalid input, server errors (only if testable without mocking the primary API).
- **Cleanup edge cases** — what if the create fails partway? Does cleanup still work?

Present findings in a table:

| Gap | Type | Rationale | Recommend |
|---|---|---|---|
| Inactive switch not tested | UI control | Switch exists on form but no test asserts behavior | Add scenario or TODO comment |
| Empty grid state untested | Empty state | What does the user see with zero rows? | Add new test |
| ... | ... | ... | ... |

Then ask the user how to proceed for each:

- Add to current test file?
- Create new test file?
- Defer with a `// TODO: PREFIX-NNNNN — Gap: <description>` comment in the test file?
- Out of scope, no action?

Document the user's decision per gap. Add follow-up TODO comments to the code where appropriate.

## When To Use Each Tool

| Stage | Tool |
|---|---|
| Phase 1 (read ticket) | Ticket system (Jira, Linear, etc.) |
| Phase 2 (app source) | Read, Grep, Glob in app repo |
| Phase 3 (test repo) | Read, Grep, Glob in test repo |
| Phase 4 (live discovery) | `playwright-cli open / snapshot / click / fill / run-code` |
| Phase 4 (API verification) | `playwright-cli run-code "async page => fetch(...)"` |
| Phase 5 (propose) | Plain conversation — no code yet |
| Phase 6 (implement) | Edit, Write |
| Phase 6 (verify) | `npx playwright test ... --headed` |
| Phase 6 (debug) | Trace viewer, `playwright-cli` replay |
| Phase 7 (gap analysis) | Structured presentation in chat |

## Critical Rules

1. **Never guess.** If a testid, method, locator, or interaction is unclear, verify with `playwright-cli snapshot` or read the source code. A wrong guess wastes more time than a clarifying question.
2. **Verbatim from the ticket.** Step text is copied, not paraphrased.
3. **Proposal gate before coding.** Phase 5 is non-skippable.
4. **Web-first assertions only.** `await expect(locator).to...` — never `expect(await locator.textContent())`.
5. **No `waitForTimeout`, no `networkidle`.** Wait for the specific element you need.
6. **Try/finally for cleanup**, not try/catch. Use `cleanupNeeded` flag.
7. **Check base class methods** before adding new ones. The base class catalog is long; most needs are already covered.
8. **Gap analysis is mandatory.** Present findings even if there are none.

## Further Reading

- `references/proposal-template.md` — copy-paste template for Phase 5 proposal output
- `references/gap-analysis-checklist.md` — extended checklist for Phase 7
- `references/api-verification-recipe.md` — patterns for verifying API response shapes with playwright-cli
