# Locator Recipes

Copy-paste solutions for situations the priority ladder doesn't fully cover.

## Working inside an iframe

```ts
const frame = page.frameLocator('iframe#payment-form');
await frame.getByLabel('Card number').fill('4242424242424242');
await frame.getByRole('button', { name: 'Pay' }).click();
```

Note: `frameLocator` is for cross-origin or sandboxed frames. For same-origin frames you can also use `page.locator('iframe').contentFrame()`.

## Shadow DOM

Playwright pierces shadow DOM automatically for `getByRole`, `getByText`, `getByLabel`. CSS selectors do NOT pierce by default — use `>>` if needed: `page.locator('my-element >> .inner-class')`.

## Modal dialog scope

Scope all locators inside a modal to the modal container to avoid matching same-named elements behind it:

```ts
readonly confirmDialog = this.page.getByRole('dialog');
readonly confirmDialogYes = this.confirmDialog.getByRole('button', { name: 'Yes' });
readonly confirmDialogNo = this.confirmDialog.getByRole('button', { name: 'No' });
```

## Toast / notification by message

Notifications appear and disappear. Locate by role + text, with visibility filter:

```ts
const toast = page.getByRole('status').filter({ hasText: 'Saved' });
await expect(toast).toBeVisible();
```

## Datepicker calendar day

Calendars often render days as buttons. Combine role with day name:

```ts
const day15 = page.getByRole('gridcell', { name: '15' });
await day15.click();
```

## Row containing a specific child

When a row has no testid but contains an identifiable child:

```ts
const rowWithEmail = page.getByRole('row').filter({
  has: page.getByText('user@example.com')
});
await rowWithEmail.getByRole('button', { name: 'Edit' }).click();
```

## Element behind a dynamic class

Frameworks add state classes (`is-active`, `is-disabled`). Match partial:

```ts
await expect(page.getByTestId('submit-button')).toHaveClass(/is-disabled/);
```

## "Nth" patterns when role + name aren't enough

```ts
// All 'Delete' buttons in a list — click the third
await page.getByRole('button', { name: 'Delete' }).nth(2).click();
```

But prefer adding a testid that includes the record ID:

```ts
await page.getByTestId(`usersGrid-deleteBtn-${userId}`).click();
```

## Tab inside a tab list

```ts
const tabs = page.getByRole('tablist');
await tabs.getByRole('tab', { name: 'Details' }).click();
```

## ARIA live region (announcements)

```ts
await expect(page.getByRole('alert')).toHaveText('Record saved.');
```
