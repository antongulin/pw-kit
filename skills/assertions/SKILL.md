---
name: assertions
description: Web-first assertion patterns for Playwright + TypeScript — always await expect(locator).toXxx() (never snapshot-style expect(await locator.textContent())), never page.waitForTimeout, never waitForLoadState('networkidle'), expect.soft for supplementary checks, expect.poll for non-locator values, waitForResponse set up BEFORE the triggering action. Use when writing assertions, fixing flaky waits, debugging timing issues, removing hardcoded sleeps, asserting on API responses, or reviewing test assertion code.
when_to_use: |
  Trigger phrases: "expect", "assertion", "waitForTimeout", "networkidle", "flaky wait", "sleep", "wait for", "toHaveText", "auto-retry", "expect.soft", "expect.poll", "waitForResponse", "race condition". Auto-activates when editing test files.
paths: tests/**/*.spec.ts,pages/**/*.ts
---

# Web-First Assertions and Waiting

Apply these patterns when writing assertions or wait logic. Web-first assertions (`await expect(locator).toXxx()`) auto-retry until the condition is met or the timeout expires. Snapshot-style assertions (`expect(await locator.textContent())`) do not. The difference between the two is the most common source of flaky tests.

## The Cardinal Rule

```ts
// CORRECT — auto-retries until visible or timeout
await expect(page.getByTestId('save-success-message')).toBeVisible();
await expect(page.getByTestId('order-total')).toHaveText('$42.00');
await expect(page.getByTestId('email-input')).toHaveValue('user@example.com');

// WRONG — snapshots the value once, no retry, race conditions guaranteed
expect(await page.getByTestId('save-success-message').isVisible()).toBe(true);
const text = await page.getByTestId('order-total').textContent();
expect(text).toBe('$42.00');
```

If a locator method returns a `Promise<T>` (you have to `await` it BEFORE the `expect`), you've snapshotted the value. Auto-retry is lost. Rewrite to use a web-first matcher on the locator directly.

## Common Web-First Matchers

| What you want to assert | Web-first matcher |
|---|---|
| Element is visible | `await expect(locator).toBeVisible()` |
| Element is hidden | `await expect(locator).toBeHidden()` (or `.not.toBeVisible()`) |
| Element exists in DOM | `await expect(locator).toBeAttached()` |
| Element has exact text | `await expect(locator).toHaveText('Saved')` |
| Element contains text | `await expect(locator).toContainText('Saved')` |
| Input has value | `await expect(locator).toHaveValue('user@example.com')` |
| Element is enabled / disabled | `await expect(locator).toBeEnabled()` / `.toBeDisabled()` |
| Element is checked | `await expect(locator).toBeChecked()` |
| Element has CSS class | `await expect(locator).toHaveClass(/active/)` |
| Element has attribute | `await expect(locator).toHaveAttribute('aria-checked', 'true')` |
| Element count | `await expect(locator).toHaveCount(5)` |
| At least one match | `await expect(locator).not.toHaveCount(0)` |
| URL matches | `await expect(page).toHaveURL('**/dashboard')` |
| Page title | `await expect(page).toHaveTitle('Dashboard')` |

All of these auto-retry until the condition is met or `expect` timeout (30s) is reached.

## Never `waitForTimeout`

```ts
// WRONG
await page.waitForTimeout(2000);
await expect(saveSuccess).toBeVisible();

// CORRECT
await expect(saveSuccess).toBeVisible();   // auto-retries, no fixed sleep
```

A `waitForTimeout` is either too short (flaky) or too long (slow tests). Wait for the specific condition you need — the element appearing, disappearing, or changing state.

If you need a wait that is genuinely time-based (e.g., testing a 5-second auto-dismiss), use `await expect(locator).toBeHidden({ timeout: 6000 })` instead — it still auto-retries within the bound, succeeding as soon as the element disappears.

## Never `waitForLoadState('networkidle')`

```ts
// WRONG
await page.waitForLoadState('networkidle');
await expect(grid).toBeVisible();

// CORRECT — wait for the specific element you actually need
await expect(grid).toBeVisible();
```

`networkidle` is the **#1 source of flaky tests**. Modern web apps make periodic polling requests (analytics, heartbeats, websockets) that never settle. The wait either times out or finishes "by coincidence" when polling happens to pause. Replace with element-specific assertions.

For specific spinner-disappearance waits, the project's `waitForSpinnerToDisappear()` base method is fine (it waits for known indicator selectors, not arbitrary network activity).

## `waitForResponse` — Set Up BEFORE the Trigger

For asserting on API responses, set up the listener **before** the action that triggers the request, then await it after:

```ts
// CORRECT
const responsePromise = page.waitForResponse(
  response => response.url().includes('/api/users') && response.status() === 200
);
await usersPage.searchButton.click();
const response = await responsePromise;
const data = await response.json();
expect(data.users.length).toBeGreaterThan(0);

// WRONG — race condition; the response may have arrived before we start listening
await usersPage.searchButton.click();
const response = await page.waitForResponse(/* ... */);  // may never fire
```

This is one of the most common ordering bugs in Playwright tests. The rule: **set up the listener, then trigger, then await**.

## `expect.soft` — Supplementary Checks

Use `expect.soft` for non-critical assertions you want to collect even if some fail (e.g., checking default field values):

```ts
test('PREFIX-NNNNN: Default form state', async ({ orderEditPage }) => {
  await test.step('Then all defaults are correct', async () => {
    await expect.soft(orderEditPage.statusDropdown).toHaveValue('Active');
    await expect.soft(orderEditPage.priorityDropdown).toHaveValue('Normal');
    await expect.soft(orderEditPage.notifyCheckbox).toBeChecked();
    await expect.soft(orderEditPage.regionDropdown).toHaveValue('US');
    // test continues even if some of the above fail; reports all failures at the end
  });
});
```

**Do NOT use `expect.soft` for the critical assertion of the test.** The "Then" step that establishes the test's pass/fail should use a hard `expect`.

## `expect.poll` — Non-Locator Values

For values that aren't backed by a DOM locator (computed state, network counters, custom JS evaluations), use `expect.poll`:

```ts
// Polls the callback every 500ms until it returns 5 or until expect timeout
await expect.poll(
  async () => {
    return await page.evaluate(() => window.cart.items.length);
  },
  { message: 'Cart should have 5 items', timeout: 10000, intervals: [500] }
).toBe(5);
```

For locator-backed values, prefer the matcher (`toHaveCount(5)`) over `expect.poll`.

## Per-Assertion Timeout Override

The global `expect` timeout is 30s. Override per-assertion only when a specific operation genuinely needs more (or less):

```ts
// Long-running batch operation expected to take ~50s
await expect(batchStatus).toHaveText('Complete', { timeout: 60000 });

// Element that should disappear immediately; failing fast is preferable
await expect(loadingSpinner).toBeHidden({ timeout: 5000 });
```

Don't override the timeout globally — that hides real performance regressions and makes flaky tests pass by accident.

## Asserting Counts vs. Specific Records

```ts
// Exact count
await expect(grid.getByRole('row')).toHaveCount(5);

// At least one
await expect(grid.getByRole('row')).not.toHaveCount(0);

// Specific record visible
await expect(grid.getByTestId(`row-${userId}`)).toBeVisible();

// Specific column value in a specific row
await expect(grid.getByTestId(`cell-${userId}-status`)).toHaveText('Active');
```

Prefer `not.toHaveCount(0)` over `toHaveCount(N)` when the exact count is not meaningful — fewer false failures when the underlying data changes.

## Asserting on Hidden / Absent Elements

```ts
// Element exists in DOM but is hidden (e.g., CSS display:none)
await expect(deleteButton).toBeHidden();

// Element does not exist in DOM at all
await expect(deleteButton).toHaveCount(0);

// Either of the above (use when behavior could be either)
await expect(deleteButton).not.toBeVisible();
```

## Race-Condition Patterns

Two patterns that often trigger races:

### Action triggers navigation

```ts
// CORRECT
const navigationPromise = page.waitForURL('**/dashboard');
await loginPage.signInButton.click();
await navigationPromise;

// Or, if you just want to assert the URL eventually settles:
await loginPage.signInButton.click();
await expect(page).toHaveURL('**/dashboard');
```

### Action triggers a download

```ts
const downloadPromise = page.waitForEvent('download');
await reportPage.exportButton.click();
const download = await downloadPromise;
expect(download.suggestedFilename()).toMatch(/report-.*\.csv/);
```

### Action triggers a dialog

```ts
page.once('dialog', async dialog => {
  expect(dialog.message()).toContain('Are you sure?');
  await dialog.accept();
});
await deleteButton.click();
```

## Common Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| `expect(await locator.textContent()).toBe('Saved')` | `await expect(locator).toHaveText('Saved')` |
| `await page.waitForTimeout(2000)` | `await expect(locator).toBeVisible()` |
| `await page.waitForLoadState('networkidle')` | `await expect(grid).toBeVisible()` |
| `await locator.isVisible()` then `expect(...).toBe(true)` | `await expect(locator).toBeVisible()` |
| `waitForResponse` set up after the click | Move it before the click |
| Setting global timeout to 120s to fix flakiness | Find the actual slow operation; override per-assertion |
| `expect.soft` for the critical Then assertion | Use hard `expect` for the test's primary assertion |
| Asserting count when count isn't meaningful | Use `not.toHaveCount(0)` for "at least one" |

## Further Reading


Additional reference docs (recipes, deep-dives, edge cases) will be added based on team feedback. PRs welcome.
