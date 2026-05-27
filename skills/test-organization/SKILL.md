---
name: test-organization
description: Test file structure and naming for Playwright + TypeScript — Gherkin test.step (Given/When/Then/Cleanup), ticket-prefixed naming, file size limits (50 tests / 1200 lines), failure classification (test.fail / test.fixme / test.skip), try/finally cleanup pattern, no functions in test files, and parallel-safety rules. Use when writing a new test, naming a test or describe block, structuring test.step calls, classifying a failing test, refactoring oversized test files, or reviewing test organization.
when_to_use: |
  Trigger phrases: "test.step", "Gherkin", "test naming", "test describe", "test.fail", "test.fixme", "test.skip", "test failed how to mark", "cleanup pattern", "try finally", "test file too long", "test organization", "parallel safe". Auto-activates when editing files matching tests/**/*.spec.ts.
paths: tests/**/*.spec.ts
---

# Test Organization Conventions

Apply these rules when writing any new test, structuring `test.step` calls, naming tests, classifying failures, or splitting oversized test files.

## Test Naming Format

Every test name starts with a ticket key followed by a colon and a description:

```ts
test('PREFIX-12345: Search users by email', ...);

// Multiple scenarios for one ticket:
test('PREFIX-12345 Scenario 1: Add a user', ...);
test('PREFIX-12345 Scenario 2: Edit a user', ...);
test('PREFIX-12345 Scenario 3: Delete a user', ...);
```

The `PREFIX` matches the project's ticket system (configured via the plugin's `userConfig.ticketPrefix`). Examples: `DEVQA-12345`, `JIRA-12345`, `LIN-12345`, `GH-12345`.

## `test.describe` Naming

- If the file covers **one ticket**, use the ticket key: `test.describe('PREFIX-12345', ...)`
- If the file covers a **feature area** spanning multiple tickets, describe the behavior under test: `test.describe('Users grid filters', ...)`
- **Never copy a defect title verbatim into `test.describe`.** Defect titles usually say "X is broken" — describe what should happen, not what shouldn't.

## Gherkin Step Structure (mandatory)

Every test uses `test.step` with Gherkin keywords:

```ts
test('PREFIX-12345: Add a user', async ({ usersPage, userEditPage, newDescription }) => {
  await test.step('Given User on the Users page', async () => {
    // Empty body acceptable when beforeEach handled the precondition
  });
  await test.step('When User clicks Add New', async () => {
    await usersPage.addUserButton.click();
  });
  await test.step('And populates required fields', async () => {
    await userEditPage.emailInput.fill(`${newDescription}@example.com`);
  });
  await test.step('And saves the record', async () => {
    await userEditPage.saveAndClose();
  });
  await test.step('Then the record is displayed in the grid', async () => {
    await usersPage.verifyExists(`${newDescription}@example.com`);
  });
});
```

### Gherkin Keywords

| Keyword | Tense | Purpose |
|---|---|---|
| **Given** | past | Prerequisites and setup |
| **When** | present | The single action under test |
| **And** | present | Additional actions (any number) |
| **Then** | present | The expected outcome |
| **Cleanup** | imperative | Data revert / state restoration (no descriptive text) |

### Rules

- **Exactly one `When` per test.** Each test verifies one behavior.
- **User is referred to as "User"** — never "a user", "the user", "I", "you", "we".
- **Empty `Given` body is acceptable** when `beforeEach` covers the precondition. Keep the step for documentation visibility.
- **Step text comes verbatim from the ticket.** No paraphrasing.
- **Cleanup step is named just `"Cleanup"`** — not "Cleanup: delete the record". Stable across tests.

## Cleanup Pattern (try/finally)

Tests that modify data must clean up using `try/finally`:

```ts
test('PREFIX-12345: Add a user', async ({ usersPage, userEditPage, newDescription }) => {
  let cleanupNeeded = false;
  await test.step('When User clicks Add New', async () => {
    await usersPage.addUserButton.click();
  });
  try {
    await test.step('And saves the record', async () => {
      await userEditPage.emailInput.fill(`${newDescription}@example.com`);
      await userEditPage.saveAndClose();
      cleanupNeeded = true;
    });
    await test.step('Then the record is displayed in the grid', async () => {
      await usersPage.verifyExists(`${newDescription}@example.com`);
    });
  } finally {
    if (cleanupNeeded) {
      await test.step('Cleanup', async () => {
        await usersPage.deleteRow(`${newDescription}@example.com`);
      });
    }
  }
});
```

### Cleanup rules

- Use `try/finally`, **not `try/catch`**. `catch` swallows errors and may skip cleanup.
- **`cleanupNeeded` flag** — only run cleanup if the data-modifying step actually succeeded. Prevents double-delete errors when the test fails before saving.
- **No cleanup for read-only tests** — explicitly documented; do not add empty cleanup blocks.
- **Delete tests are self-cleaning** — when delete IS the test action, no extra cleanup needed.

## File Naming and Limits

- Pattern: `${pageName}-test.spec.ts` → `users-test.spec.ts`, `user-edit-test.spec.ts`
- Multiple files per feature: add a descriptive suffix → `users-crud-test.spec.ts`, `users-filters-test.spec.ts`, `users-sorting-test.spec.ts`
- **Hard limit: 50 tests per file.**
- **Hard limit: 1200 lines per file.**
- Split when either limit is exceeded.

## What Belongs Where

| Code | Goes in |
|---|---|
| Locators | Page object class (`pages/.../*-page.ts`) |
| Methods representing user actions | Page object class |
| Test data generation helpers | `tests/utility/common-test-functions.ts` |
| Test steps and assertions | Test file |
| Imports | Top of test file only |
| Functions defined for use across tests | NEVER in test files — POM or utility |

If a test needs a helper function, **put it on the page object or in the utility module**. Never declare `function foo() { ... }` inside a `.spec.ts` file.

## Suite Tags

Use tags to enable selective execution:

```ts
test('PREFIX-12345: Critical path @smoke', async ({ ... }) => { ... });
test('PREFIX-12345: Full coverage @regression', async ({ ... }) => { ... });
```

Run with:

```bash
npx playwright test --grep "@smoke"
```

Common tags: `@smoke`, `@regression`, `@critical`, `@flaky-watch`.

## Failure Classification

When a test fails, classify it before fixing. Three categories with distinct actions:

### `test.fail` — known app bug

The app is broken; the test correctly catches it.

```ts
// Defect: DEFECT-67890
test.fail('PREFIX-12345: User can change email', async ({ ... }) => { ... });
```

- The test will fail (expected behavior).
- If it **unexpectedly passes**, either the bug was fixed (remove `.fail`) or the test is not actually testing what it claims.
- **Always include a comment with the defect ticket key.** No `.fail` without a key.

### `test.fixme` — broken test, working app

The test is incorrectly written or the app changed in a way the test didn't catch up to.

```ts
test.fixme('PREFIX-12345: User can change email', async ({ ... }) => { ... });
```

- Create a Fix-me task in the project tracker.
- The test is skipped, but the reason is visible.

### `test.skip` — sparingly

Use only when neither `.fail` nor `.fixme` fits, e.g., conditional skipping:

```ts
test.skip(!isHosted, 'Hosted-environment-only feature; un-skip when running against hosted env');
test('PREFIX-12345: Hosted-only feature', async ({ ... }) => { ... });
```

- Always include a comment explaining **when this skip should be removed.**
- Never use `.skip` for flaky tests — use `.fixme` instead, so the issue is tracked.

## Parallel Safety

Tests in different files run in parallel; tests within a file run sequentially. Every test must be:

- **Idempotent** — running it twice produces the same result.
- **Independent** — does not depend on another test having run first.
- **Data-unique** — uses unique IDs (via `common.randomNumber()`, timestamps, or the `newDescription` fixture) so parallel runs don't collide.

If a suite must run serially, add `--workers=1` to its npm script and a comment in `playwright.config.ts` or the npm script explaining why.

## Common Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| `test('Test that user can save', ...)` | Use ticket-prefixed name: `test('PREFIX-NNNNN: Save user')` |
| Multiple `When` steps in one test | Split into multiple tests |
| `// Step 1: Click button` comments instead of `test.step` | Use `test.step('When User clicks ...', ...)` |
| `await test.step('Cleanup: delete the record', ...)` | Rename to just `'Cleanup'` |
| `test.skip('Flaky', ...)` | Use `test.fixme` + create a Fix-me task |
| `function makeUser() { ... }` inside `.spec.ts` | Move to page object or utility |
| Hardcoded record IDs | Use random IDs or precreated test data |
| `try/catch` for cleanup | Use `try/finally` |
| `await page.waitForTimeout(2000)` | Use element-specific assertions |

## Further Reading

- `references/test-file-template.ts` — copy-paste skeleton for a new test file
