---
name: pre-pr
description: Pre-PR quality and convention check for Playwright + TypeScript test changes. Walks through 13 categories — commit messages, naming, locators, dates, assertions, cleanup, file standards, page objects, parallel safety, branch state, gap analysis, ticket process. Reports each violation as file + line + rule + suggested fix. Use when user invokes /pw-kit:pre-pr, asks to "check my changes before PR", "review my test changes", "is this ready to ship", or before opening a pull request.
when_to_use: |
  Trigger phrases: "/pw-kit:pre-pr", "pre-pr check", "before PR", "ready to ship", "pre-pull-request review", "is this ready", "PR check", "open a pull request", "before I push". Slash command only — does not auto-activate.
disable-model-invocation: true
allowed-tools: Bash(git:*) Bash(npx playwright test:*) Read Grep Glob
---

# /pw-kit:pre-pr — Pre-Pull-Request Checklist

Follow this 13-category checklist when a user asks you to review their changes before opening a PR. Report each violation as `file:line — rule — suggested fix`. Use `git diff main...HEAD --name-only` to identify changed files, then read each one and check every category.

## How to Run

```bash
# Identify changed files
git diff main...HEAD --name-only

# For each changed test/POM file, read it and run the categories below
```

Report format per finding:

```
<path/to/file.ts>:<line> — <category>:<rule> — <suggested fix>
```

If all checks pass: report exactly `"All checks passed — PR ready"`.

## Category 1: Commit Messages

For each commit on the branch:
- [ ] Includes a ticket key (e.g., `PREFIX-12345`) in the commit message
- [ ] No "WIP", "fix", "test" or other vague single-word messages

If a commit lacks a ticket key, flag it with the warning: **"no hidden work"**.

```bash
git log main..HEAD --oneline
```

## Category 2: Test Code Structure

For each test file:
- [ ] Imports from `@POM/base-pages-fixture`, NOT directly from `@playwright/test` — flag any test file that imports `test, expect` from `@playwright/test`
- [ ] Fixture destructuring uses `{ browserPage }`, NOT `{ page }` — flag any `async ({ page }) =>` in `beforeEach`/`afterEach`/`test`
- [ ] Test name format: `PREFIX-NNNNN: Description` (single scenario) or `PREFIX-NNNNN Scenario N: Description` (multi-scenario)
- [ ] `test.describe` names the behavior, NOT the defect/story title
- [ ] Step text uses Gherkin keywords: `Given` (past), `When` (present, exactly one), `And` (any number), `Then` (present), `Cleanup`
- [ ] User referred to as `"User"` — never `"a user"`, `"the user"`, `"I"`, `"you"`, `"we"`
- [ ] TypeScript only (no `.js` test files)
- [ ] Empty `Given` step is acceptable when `beforeEach` covers the precondition

## Category 3: Locators

- [ ] Use `getByTestId()` first, falling through role/label/placeholder/title/chained/class/id/text before CSS/XPath
- [ ] Any CSS/XPath locator must include a comment explaining why no higher tier works
- [ ] All locators live in page objects, not in test files
- [ ] Missing `data-testid` → TODO comment with ticket key: `// TODO: PREFIX-NNNNN — Missing data-testid for ...`
- [ ] Parameterized locators are arrow function properties on the POM class, not `.first()` / `.nth(N)` in tests
- [ ] No re-implementation of `getByTestId` as CSS attribute selector (`page.locator('[data-testid="x"]')`)

## Category 4: Dates

- [ ] No hardcoded date strings (e.g., `'03/15/2024'`)
- [ ] Date input uses `typeDateValue()` — never `fill()` or `pressSequentially()` for date fields
- [ ] Relative-year variables (`page.thisYear`, `page.lastYear`, etc.) used for year components
- [ ] Locale-aware formatting via `formatDateByLocale()` for assertions

## Category 5: Assertions and Waiting

- [ ] Web-first assertions only: `await expect(locator).to...`
- [ ] No `expect(await locator.textContent()).toBe(...)` snapshot-style assertions
- [ ] No `page.waitForTimeout(N)` — flag with "find the actual condition to wait for"
- [ ] No `page.waitForLoadState('networkidle')` — flag with "use element-specific assertion"
- [ ] `waitForResponse` set up **before** the triggering click, awaited after
- [ ] `expect.soft` used only for supplementary checks, never the critical Then assertion

## Category 6: Test Data and Cleanup

- [ ] Tests that modify data use `try/finally` (not `try/catch`) with a `cleanupNeeded` boolean flag
- [ ] Cleanup step named exactly `"Cleanup"` — not `"Cleanup: delete the record"` or similar
- [ ] Read-only tests have no `Cleanup` step (no empty cleanup blocks)
- [ ] Unique data identifiers used for created data (`common.randomNumber()`, `newDescription` fixture, etc.)
- [ ] No hardcoded record IDs (differ across environments)
- [ ] No complex multi-step setup chains in the test body (move to precreated DB data or API helpers)
- [ ] No shared module-level mutable variables between tests

## Category 7: Functions and Code Placement

- [ ] No functions defined inside test files (`function foo() {}` or `const foo = () => {}`)
- [ ] Helpers belong in POM or `tests/utility/`
- [ ] Page object methods represent user actions (not individual `.click()` chains)
- [ ] No redundant POM methods that re-implement base class behavior — check `BasePage`, `BaseGridPage`, `BaseEditPage` first

## Category 8: File Standards

- [ ] Test file naming: `${pageName}-test.spec.ts`
- [ ] Multi-file features use descriptive suffix: `-crud`, `-filters`, `-sorting`, etc.
- [ ] **Max 50 tests per file** (hard limit — split if exceeded)
- [ ] **Max 1200 lines per file** (hard limit — split if exceeded)
- [ ] Permissions tests live in `tests/user-group-permissions/`, never colocated with feature tests
- [ ] All imports at the top of the file (no inline `require()` or dynamic imports for fixtures)

## Category 9: Page Objects

- [ ] POM file naming: `${pageName}-page.ts`
- [ ] Grid pages: plural class name (e.g., `CustomersPage`)
- [ ] Edit pages: singular class name (e.g., `CustomerEditPage`)
- [ ] Class extends the correct base (`BaseGridPage`, `BaseEditPage`, or local domain base)
- [ ] Constructor passes `gridPrefix` string to super for grid pages
- [ ] Fixture entry in `pages/base-pages-fixture.ts` is alphabetically positioned in both the `Pages` interface AND the `test.extend({...})` body
- [ ] Fixture body uses `{ browserPage }`, not `{ page }`

## Category 10: Quality

- [ ] Tests are idempotent (re-running produces the same result)
- [ ] Tests are independent (no dependency on order of execution)
- [ ] Test data uses unique identifiers (parallel-safe)
- [ ] Actions are from the perspective of the user (not bypassing UI for the action under test; API only for setup/cleanup)
- [ ] `initialize()` called (e.g., in `beforeEach`) before relative-year vars are used

## Category 11: Branch State

```bash
git log main..HEAD --oneline      # commits on this branch
git status                        # uncommitted changes?
git rebase --dry-run main 2>&1    # would rebasing succeed?
```

- [ ] Branch is rebased onto current `main` (no merge conflicts)
- [ ] No uncommitted changes
- [ ] No `console.log()` debugging statements left in code
- [ ] No `test.only(...)` or `describe.only(...)` — would block `forbidOnly` in CI

## Category 12: Gap Analysis

For each new or modified test file, verify the gap-analysis-related checks:
- [ ] Every `Then` step contains at least one `await expect(...)` — flag empty Then steps as missing assertions
- [ ] Boundary conditions considered (empty values, max-length, special characters)
- [ ] Empty states considered (zero records, no search matches)
- [ ] Data variants considered (active/inactive, different permissions, locales)
- [ ] Follow-up TODO comments present for any deferred gaps (with ticket keys)

## Category 13: Ticket Process (cannot auto-verify — surface as reminders)

These cannot be checked from the diff; remind the user:
- [ ] All Test Case tickets are in "Ready for Review" status
- [ ] All Test Case tickets have an "is a test for" link to a Story/Defect
- [ ] All Task tickets are "In Progress"
- [ ] Test Count field on linked tickets reflects the number of scenarios
- [ ] No tickets moved to "Done" — that happens after PR approval
- [ ] Local branch is synched with remote daily (rebase practice)

Present these as a "Reminders" block in the output, separate from the auto-detected violations.

## Report Format

Use this exact structure when reporting findings:

```
# Pre-PR Report

## Changed Files
- path/to/file1.spec.ts
- path/to/file2-page.ts

## Violations (N total)

### path/to/file1.spec.ts
- L42 — Category 5: snapshot-style assertion — replace `expect(await loc.textContent()).toBe(...)` with `await expect(loc).toHaveText(...)`
- L78 — Category 6: missing cleanupNeeded flag — set `cleanupNeeded = true` after the save succeeds, guard the finally block

### path/to/file2-page.ts
- L15 — Category 3: missing TODO for missing data-testid — add `// TODO: PREFIX-NNNNN — Missing data-testid for save button`

## Reminders (Category 13 — cannot auto-verify)
- Verify Test Case tickets are in 'Ready for Review' status
- Verify Test Count field is set correctly
- ...

## Quality Metrics
- Tests added: 3
- Tests modified: 1
- POMs modified: 2
- Lines added/removed: +145 / -22
```

If no violations: `All checks passed — PR ready` plus the Reminders block.

## Further Reading


Additional reference docs (recipes, deep-dives, edge cases) will be added based on team feedback. PRs welcome.
