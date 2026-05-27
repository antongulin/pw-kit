---
name: forms-and-dates
description: Patterns for interacting with form controls in Playwright + TypeScript — typeDateValue for date pickers (never fill or pressSequentially), relative-year variables instead of hardcoded dates, idempotent toggleSwitch, filterSingleSelect for dropdowns, save method variants (save/saveAndClose/saveAndConfirm), and required-field validation. Use when writing form interactions, working with date pickers, dropdowns, switches, checkboxes, when tests have flaky date input behavior, or when reviewing form-related test code.
when_to_use: |
  Trigger phrases: "date picker", "typeDateValue", "fill date", "dropdown", "single select", "toggle switch", "checkbox", "save and close", "required field validation", "hardcoded date", "relative year". Auto-activates when editing test or POM files.
paths: tests/**/*.spec.ts,pages/**/*.ts,modals/**/*.ts
---

# Form Controls, Dates, and Validation

Apply these patterns when writing or reviewing interactions with form controls — text inputs, dropdowns, date pickers, switches, checkboxes, and required-field validation.

## Date Inputs — The Critical Rule

**Always use `typeDateValue()` for date fields.** Never `fill()`, never `pressSequentially()` directly.

```ts
// CORRECT
await page.typeDateValue(orderEditPage.startDateInput, '03152024');

// WRONG — fills a date picker as if it were a plain text input;
// the picker may reject the value, format it weirdly, or fail to register
await orderEditPage.startDateInput.fill('03/15/2024');
await orderEditPage.startDateInput.pressSequentially('03/15/2024');
```

`typeDateValue()` (provided on `BasePage`) handles the picker's specific key sequence: it presses each digit with a small inter-key delay so the picker's input mask can format the value as it's typed.

### Date strings: digits only, locale-formatted on assertion

Date inputs accept **digits-only strings** in the format `MMDDYYYY`:

```ts
await page.typeDateValue(orderEditPage.startDateInput, '03152024');
// or composed from relative year vars:
const startDate = `0315${orderEditPage.thisYear}`;
await page.typeDateValue(orderEditPage.startDateInput, startDate);
```

For **assertions**, format the date according to the locale of the application under test:

```ts
const expected = page.formatDateByLocale('03152024');  // e.g., "03/15/2024" or "15/03/2024"
await expect(orderEditPage.startDateInput).toHaveValue(expected);
```

## Never Hardcode Years

Tests with hardcoded years break in future years. Use **relative-year variables** instead.

`BasePage` provides these properties (initialized by calling `initialize()` in `beforeEach` or `beforeAll`):

| Property | Value |
|---|---|
| `thisYear` | current year as string |
| `lastYear` | previous year |
| `yearBeforeLast` | two years ago |
| `threeYearsAgo` | three years ago |
| (… up to `sixYearsAgo`) | |
| `nextYear` | next year |
| `twoYearsHence` | two years from now |
| `fiveYearsHence`, `sixYearsHence` | further future |

Use them in date string composition:

```ts
// BAD — will break in 2025
await page.typeDateValue(input, '03152024');

// GOOD — always today-relative
await page.typeDateValue(input, `0315${page.thisYear}`);
await page.typeDateValue(input, `1231${page.lastYear}`);
await page.typeDateValue(input, `0101${page.nextYear}`);
```

For dates that need calculation (today + N days), use `getDateNDaysFromNow(N)` or the `todayString` / `futureDateString` fixtures from the central registry.

## Switches and Toggles — Idempotent

Use **`toggleSwitch(toBeEnabled, locator)`** instead of `.click()`. It reads `aria-checked` and only clicks if the state needs to change. This prevents accidental double-toggles when the switch is already in the desired state.

```ts
// CORRECT — idempotent
await page.toggleSwitch(true, orderEditPage.activeSwitch);
await page.toggleSwitch(false, orderEditPage.notifySwitch);

// WRONG — toggles regardless of current state, may leave state inverted
await orderEditPage.activeSwitch.click();
```

For **checkboxes**, use Playwright's native `.check()` / `.uncheck()` and `toBeChecked()`:

```ts
await orderEditPage.termsCheckbox.check();
await expect(orderEditPage.termsCheckbox).toBeChecked();
```

(Why the distinction? Switches are typically custom components with `aria-checked` on a wrapper, not on the input element. `.click()` toggles unconditionally; `.check()` only works on actual `<input type="checkbox">`.)

## Dropdowns — Use the Helper

Use **`filterSingleSelect(locator, optionText)`** instead of `.selectOption()` for custom dropdowns:

```ts
await page.filterSingleSelect(orderEditPage.statusDropdown, 'Active');
```

This handles: opening the dropdown, scrolling to the option, clicking it, and pressing Tab to confirm. Works across most custom dropdown component libraries.

For native `<select>` elements, Playwright's `.selectOption()` works fine:

```ts
await orderEditPage.nativeSelect.selectOption('US');
```

For multi-selects:

```ts
await page.filterMultiSelectByLocator(['Tag1', 'Tag2'], orderEditPage.tagsMultiSelect);
```

### Reading dropdown values

```ts
const allOptions = await page.getValuesFromDropdown(orderEditPage.statusDropdown);
const inactiveOptions = await page.getInactiveValuesFromSingleSelect(orderEditPage.statusDropdown);
```

After reading, the dropdown is left open. **Press Escape before re-opening** to avoid toggling it closed:

```ts
await orderEditPage.statusDropdown.press('Escape');
// now safe to re-open and select
await page.filterSingleSelect(orderEditPage.statusDropdown, 'Active');
```

### Asserting dropdown contents

```ts
await page.verifyDropdownContents(dropdown, 'Active', true);   // 'Active' is present
await page.verifyDropdownContents(dropdown, 'Archived', false); // 'Archived' is NOT present
await page.verifyDropdownOptionsSortedAlphabetically(dropdown);
```

## Save Variants — Use the Right One

Different save flows are different UX paths. Use the named variant that matches the intent — these are NOT interchangeable.

| Method | When to use |
|---|---|
| `save()` | Primary save, stays on page; you'll continue interacting after |
| `saveAndClose()` | Save and return to the grid/list |
| `saveAndConfirm()` | Save when a confirmation modal appears; click Yes |
| `saveAndCloseAndConfirm()` | Save & close + confirm in modal |
| `saveAndCancel()` | Trigger save, cancel the confirmation (test rollback) |
| `cancelAndDontSave()` | Cancel + "Don't Save" in unsaved-changes prompt |
| `back()` | Back navigation (warns if unsaved changes) |

Each returns when the corresponding success or transition completes — no need for follow-up `waitForSpinner` calls.

## Required Field Validation

To test that a field is required, clear it and assert the validation alert:

```ts
test('PREFIX-NNNNN: Email is required', async ({ orderEditPage }) => {
  await test.step('When User clears the email field and tries to save', async () => {
    await orderEditPage.emailInput.clear();
  });
  await test.step('Then a validation alert appears', async () => {
    await page.verifyValidationAlert(orderEditPage.emailValidationAlert, 'Email is required');
  });
});
```

To test that **save buttons disable** when required fields are missing:

```ts
test('PREFIX-NNNNN: Save disabled until required fields populated', async ({ orderEditPage }) => {
  await test.step('When User opens Add New', async () => {
    await ordersPage.addNewButton.click();
    await expect(orderEditPage.saveButton).toBeDisabled();
    await expect(orderEditPage.saveAndCloseButton).toBeDisabled();
  });
  await test.step('And populates one required field', async () => {
    await orderEditPage.emailInput.fill('user@example.com');
    // still disabled — other required fields not yet filled
    await expect(orderEditPage.saveButton).toBeDisabled();
  });
  await test.step('And populates the remaining required field', async () => {
    await page.filterSingleSelect(orderEditPage.statusDropdown, 'Active');
  });
  await test.step('Then save is enabled', async () => {
    await expect(orderEditPage.saveButton).toBeEnabled();
    await expect(orderEditPage.saveAndCloseButton).toBeEnabled();
  });
});
```

## Text Inputs — The Basics

Use Playwright's native methods:

```ts
await orderEditPage.descriptionInput.fill('Initial value');
await orderEditPage.descriptionInput.clear();
await orderEditPage.descriptionInput.fill('Replacement value');
await expect(orderEditPage.descriptionInput).toHaveValue('Replacement value');
```

For inputs that have masking or input validation:

```ts
// pressSequentially is OK for plain text inputs (not date pickers)
await orderEditPage.phoneInput.pressSequentially('5551234567', { delay: 50 });
```

## Multi-Step Wizards

For forms with multiple wizard pages, use **one `test.step` per page**:

```ts
test('PREFIX-NNNNN: Complete wizard', async ({ wizardPage }) => {
  await test.step('When User completes Page 1', async () => {
    await wizardPage.firstNameInput.fill('Anna');
    await wizardPage.nextButton.click();
  });
  await test.step('And completes Page 2', async () => {
    await page.filterSingleSelect(wizardPage.countryDropdown, 'United States');
    await wizardPage.nextButton.click();
  });
  await test.step('And submits Page 3', async () => {
    await wizardPage.termsCheckbox.check();
    await wizardPage.submitButton.click();
  });
  await test.step('Then the success page is shown', async () => {
    await expect(wizardPage.successHeading).toBeVisible();
  });
});
```

Cleanup still applies: data-modifying wizards use `try/finally` with `cleanupNeeded` flag.

## Common Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| `dateInput.fill('03/15/2024')` | `page.typeDateValue(dateInput, '03152024')` |
| `dateInput.pressSequentially('03/15/2024')` | `page.typeDateValue(dateInput, '03152024')` |
| `'0315' + 2024` (hardcoded year) | ` `0315${page.thisYear}` ` |
| `switch.click()` (may double-toggle) | `page.toggleSwitch(true / false, switch)` |
| Re-opening a dropdown without pressing Escape first | Press Escape before re-opening |
| Using `save()` then asserting on the grid | Use `saveAndClose()` if you want to return to the grid |
| Clearing required field and checking button state without asserting validation appears | Both belong in the same test |

## Further Reading

- `references/date-input-recipes.md` — patterns for date ranges, scheduler dates, relative-date inputs
