---
name: test-data
description: Test data management patterns for Playwright + TypeScript — decision framework for in-test creation vs precreated DB seed vs read-only fixtures, try/finally cleanup with cleanupNeeded flag (never try/catch), unique-data identifiers for parallel safety (randomNumber, randomElement, getDateNDaysFromNow), step named exactly 'Cleanup'. Use when designing test data strategy, choosing between API setup and UI setup, adding cleanup to a test, fixing test data collisions in parallel runs, or reviewing test data handling.
when_to_use: |
  Trigger phrases: "test data", "cleanup", "try finally", "cleanupNeeded", "seed data", "test fixtures", "data collision", "parallel safe", "random data", "newDescription", "precreated data", "DB seed". Auto-activates when editing test files.
paths: tests/**/*.spec.ts,pages/**/*.ts
---

# Test Data Management

Apply these rules when deciding where to create test data, how to clean it up, and how to keep parallel runs from colliding.

## Decision Framework: Where Should Test Data Live?

| Scenario | Strategy |
|---|---|
| Simple record (1–2 fields, no relationships) | Create **in the test**, clean up in `finally` |
| Complex record (multiple relationships, prerequisites) | **Precreate in the test database project** (deployed with the DB), reference by stable description in the test |
| Read-only validation (asserting on existing data shape) | Use **existing precreated data**, no cleanup |
| Specific data state (e.g., a closed order, an inactive user) | **Seed via API or SQL** before the test, clean up after |

The rule of thumb: **the more complex the setup, the more it belongs outside the test body.** A long Given section obscures what's actually being tested.

## The `try/finally` Cleanup Pattern

Tests that modify data must clean up. Use `try/finally`, **never `try/catch`**:

```ts
test('PREFIX-NNNNN: Add a customer', async ({ customersPage, customerEditPage, newDescription }) => {
  let cleanupNeeded = false;
  await test.step('When User clicks Add New', async () => {
    await customersPage.addNewButton.click();
  });
  try {
    await test.step('And saves the record', async () => {
      await customerEditPage.nameInput.fill(newDescription);
      await customerEditPage.emailInput.fill(`${newDescription}@example.com`);
      await customerEditPage.saveAndClose();
      cleanupNeeded = true;
    });
    await test.step('Then the record is displayed in the grid', async () => {
      await customersPage.verifyExists(`${newDescription}@example.com`);
    });
  } finally {
    if (cleanupNeeded) {
      await test.step('Cleanup', async () => {
        await customersPage.deleteRow(`${newDescription}@example.com`);
      });
    }
  }
});
```

### Why `try/finally`, not `try/catch`

`catch` swallows the error and may skip cleanup. `finally` always runs. The pattern is: **let the assertion failure propagate, but always clean up first.**

### Why the `cleanupNeeded` flag

Without the flag, if the save step fails before the record was actually created, the cleanup step would try to delete a non-existent record — which fails noisily and confuses the test report. Set `cleanupNeeded = true` only **after** the data-modifying action succeeds. The cleanup runs only if there's something to clean up.

### Why the step is named exactly `"Cleanup"`

Not `"Cleanup: delete the customer"`, not `"Clean up the created data"`. Just `"Cleanup"`. This keeps the step name stable across tests and matches the project's convention. The implementation goes in the step body, where the IDE and reviewers can see it.

## Read-Only Tests — No Cleanup

Tests that don't modify state need no cleanup block. Document the intent by simply omitting the step:

```ts
test('PREFIX-NNNNN: Default grid display', async ({ customersPage }) => {
  await test.step('When the grid displays', async () => {
    await expect(customersPage.grid).toBeVisible();
  });
  await test.step('Then the default columns are visible', async () => {
    await customersPage.verifyGridColumnNames(customersPage.grid, ['Name', 'Email', 'Status']);
  });
  // No Cleanup step — this test does not modify state.
});
```

Do NOT add an empty `await test.step('Cleanup', async () => {});` — it's noise.

## Delete Tests Are Self-Cleaning

When the test action IS deletion, no separate cleanup is needed — the test cleans up its own data:

```ts
test('PREFIX-NNNNN Scenario 3: Delete a customer', async ({ customersPage, customerEditPage, newDescription }) => {
  await test.step('Given a customer exists', async () => {
    await customersPage.addNewButton.click();
    await customerEditPage.nameInput.fill(newDescription);
    await customerEditPage.saveAndClose();
  });
  await test.step('When User deletes the customer', async () => {
    await customersPage.deleteRow(newDescription);
  });
  await test.step('Then the customer is no longer in the grid', async () => {
    await customersPage.verifyNotExists(newDescription);
  });
  // No Cleanup — the test action removed the record.
});
```

Add a brief comment if it's not obvious.

## Unique Data Identifiers for Parallel Safety

Tests within a file run serially, but tests across files run in parallel. If two tests in different files both create a customer named "Test Customer", they may collide.

Use **random identifiers** in test data:

```ts
test('PREFIX-NNNNN: Add', async ({ common, customersPage, customerEditPage }) => {
  const description = `Customer_${common.randomElement()}`;  // e.g., Customer_xZ9pq2K
  // ... or use the newDescription fixture
});
```

### Available random helpers (on `CommonTestFunctions`)

| Helper | Returns |
|---|---|
| `common.randomBoolean()` | `true` or `false` |
| `common.randomNumber(length?)` | random integer, default 7 digits |
| `common.randomElement()` | alphanumeric string with `_` prefix, e.g., `_xZ9pq2K` |
| `common.getRandomNumberByLength(length)` | numeric string of given length |
| `common.getDateNDaysFromNow(days, culture?)` | formatted date string (e.g., for date inputs) |

### `newDescription` fixture (recommended)

The central fixture registry typically exposes a `newDescription` fixture that returns a unique random string per test:

```ts
test('PREFIX-NNNNN: Add', async ({ newDescription, customersPage }) => {
  // newDescription is a fresh random string scoped to this test
  // e.g., "Test_xZ9pq2K"
});
```

Use this fixture whenever you need a unique-data label. It's both convenient and self-documenting.

### Random helpers on the page object

`BasePage` provides similar helpers without needing the `common` fixture:

```ts
const email = page.getRandomEmail();          // user12345@test.com
const desc = page.getRandomString(10);        // 10-char alphanumeric
const flip = page.coinFlip();                 // true 50% of the time
```

## Anti-Patterns

### Hardcoded record IDs

```ts
// WRONG — record IDs differ across environments
await customersPage.editById('12345').click();

// CORRECT — use stable descriptions for precreated records
await customersPage.editRowByDescription('Test Customer (Pre-created)');
```

### Hardcoded dates

```ts
// WRONG — breaks in future years, locale-fragile
await page.typeDateValue(input, '03152024');

// CORRECT
await page.typeDateValue(input, `0315${page.thisYear}`);
```

### Complex setup chains in the test

```ts
// WRONG — too much setup obscures what's under test
await test.step('Given complex preconditions', async () => {
  await api.createUser(...);
  await api.createOrg(...);
  await api.addUserToOrg(...);
  await api.createProject(...);
  await api.addUserToProject(...);
  await api.createTask(...);
  await api.assignTask(...);
  // ... 12 more steps ...
});
```

Move the setup to:
- The test database project (precreate it during deploy)
- A reusable helper method that wraps the API calls
- A `beforeAll` that creates shared precondition data (only for truly shared state)

### Shared mutable state

```ts
// WRONG — module-level state breaks parallel tests
let createdCustomerId: string;

test('Test A', async ({ ... }) => {
  createdCustomerId = await createCustomer();
});

test('Test B', async ({ ... }) => {
  await editCustomer(createdCustomerId);  // depends on Test A having run first
});
```

Every test must be **independent** — runnable on its own, in any order, in parallel.

### `try/catch` instead of `try/finally`

```ts
// WRONG — catch swallows the error, cleanup may be skipped, reports look green
try {
  await test.step('When ...', async () => { /* ... */ });
} catch (e) {
  await test.step('Cleanup', async () => { /* ... */ });
  throw e;
}

// CORRECT
let cleanupNeeded = false;
try {
  await test.step('When ...', async () => {
    /* ... */
    cleanupNeeded = true;
  });
} finally {
  if (cleanupNeeded) {
    await test.step('Cleanup', async () => { /* ... */ });
  }
}
```

### Cleanup that fails the test

Cleanup should be **defensive** — if the data-modifying step partially failed and left things in an unexpected state, cleanup should still try to leave the system clean. Consider wrapping deletes in try/catch internally:

```ts
await test.step('Cleanup', async () => {
  try {
    await customersPage.deleteRow(description);
  } catch (e) {
    console.warn(`Cleanup of ${description} failed: ${e.message}`);
    // Do not rethrow — let the test report the original failure if any
  }
});
```

(This is the rare case where `try/catch` inside cleanup is acceptable; the outer `try/finally` structure stays the same.)

## API Seeding for Permission Tests

For tests that require a specific user-permission state, seed via API in `beforeEach` rather than navigating through the UI to configure permissions:

```ts
test.beforeEach(async ({ executeLocalProcedure }) => {
  await executeLocalProcedure.createUserGroupForPermissionsTest(
    'Customers', /* adding */ true, /* deleting */ false, /* editing */ true, /* viewing */ true
  );
  await executeLocalProcedure.associateUserWithUserGroup(testUserId, userGroupId, true);
});
```

This keeps the test focused on what it's actually testing (the permission's UI effect) rather than the setup of the permission state.

## Further Reading


Additional reference docs (recipes, deep-dives, edge cases) will be added based on team feedback. PRs welcome.
