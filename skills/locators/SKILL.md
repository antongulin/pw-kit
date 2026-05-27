---
name: locators
description: Playwright + TypeScript locator conventions — strict priority ladder (getByTestId first, then role/label, then chained, then class/id, then text, CSS/XPath as last resort), data-testid naming convention, parameterized locators, filter/narrow patterns, and anti-patterns. Use when writing or reviewing locators in page objects, when choosing how to target an element, when fixing brittle CSS/XPath selectors, when a test has 'resolved to N elements' errors, or when reviewing test code.
when_to_use: |
  Trigger phrases: "which locator should I use", "how do I select", "getByTestId", "data-testid", "page object locator", "fix flaky locator", "brittle selector", "resolved to N elements", "missing testid", "locator priority". Also auto-activates when editing files matching pages/**/*.ts or tests/**/*.spec.ts.
paths: pages/**/*.ts,tests/**/*.spec.ts,modals/**/*.ts
---

# Playwright Locator Conventions

Apply these locator rules whenever writing or reviewing Playwright code in this project. The priority ladder is strict — drop to a lower tier only when the higher tier is genuinely unavailable.

## The Priority Ladder

Choose the highest tier that resolves the target element. Each lower tier is less stable and more likely to break on UI changes.

1. **`getByTestId('description-input')`** — preferred. Every interactive element should have a `data-testid`.
2. **`getByRole('button', { name: 'Save' })`** — semantic role + accessible name.
3. **`getByLabel('Description')`** — form field by its label.
4. **`getByPlaceholder('Search...')`** — form field by placeholder.
5. **`getByTitle('Delete')`** — element by title attribute.
6. **Chained**: `page.getByTestId('panel-edit').getByRole('button', { name: 'Save' })` — narrow scope.
7. **Class / id**: `page.locator('#main-content')`, `page.locator('.sidebar')`.
8. **`getByText('Welcome')` / `getByAltText('logo')`** — brittle to copy/asset changes.
9. **CSS / XPath**: `page.locator('div > .item:nth-child(3)')`, XPath strings — **last resort, must include a comment explaining why no higher tier works.**

## Data-Testid Naming Convention

Test IDs follow the pattern `<descriptiveName>-<controlType>`. Apply this convention when requesting test IDs from the app team or when defining locators.

| Control type | Suffix | Example |
|---|---|---|
| Text input | `-input` | `description-input`, `email-input` |
| Single-select dropdown | `-select` | `category-select`, `status-select` |
| Date picker | `-date` | `start-date`, `due-date` |
| Checkbox | `-checkbox` | `inactive-checkbox`, `notify-checkbox` |
| Radio button | `-radio` | `priority-radio` |
| Button | `-button` | `save-button`, `add-button` |
| Switch / toggle | `-switch` | `active-switch`, `mine-only-switch` |
| Multi-select | `-multiselect` | `tags-multiselect` |
| Table / grid | `<entityName>Grid` | `usersGrid`, `ordersGrid` |
| Grid row | `<entityName>Grid-row-{id}` | `usersGrid-row-42` |
| Grid action | `<entityName>Grid-{action}-{id}` | `usersGrid-editBtn-42` |

Grid row testids **include the record ID** so rows are directly addressable without scanning.

## Locator Declaration Patterns

### Static locators on the page object

Declare locators as `readonly` properties in the constructor:

```ts
export class UserEditPage extends BaseEditPage {
  readonly emailInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByTestId('email-input');
    this.saveButton = page.getByTestId('save-button');
  }
}
```

### Parameterized locators (arrow functions)

For locators that depend on a runtime value, declare arrow function properties:

```ts
readonly rowById = (id: string) => this.page.getByTestId(`usersGrid-row-${id}`);
readonly editButtonById = (id: string) => this.page.getByTestId(`usersGrid-editBtn-${id}`);
readonly cellForRow = (id: string, column: string) =>
  this.rowById(id).locator(`[column="${column}"]`);
```

Call them in tests:

```ts
await usersPage.editButtonById('42').click();
await expect(usersPage.cellForRow('42', 'email')).toHaveText('user@example.com');
```

### Naming locators

Use **purpose-specific names**, not control-type-only names:

- Good: `categoryDropdown`, `descriptionInput`, `addUserButton`, `confirmDeleteModal`
- Bad: `dropdown1`, `input`, `button`, `modal`

## Narrowing and Filtering

When a locator resolves to multiple elements, use these patterns instead of CSS index selectors:

```ts
// Filter by content
page.getByRole('row').filter({ hasText: 'Active' });

// Filter by child locator
page.getByRole('row').filter({ has: page.getByRole('button', { name: 'Edit' }) });

// Exclude matches
page.getByRole('row').filter({ hasNot: page.getByText('Archived') });

// Positional
page.getByRole('row').first();
page.getByRole('row').last();
page.getByRole('row').nth(2);

// Visibility (resolves 'resolved to N elements' errors when some are hidden)
page.getByRole('button', { name: 'Save' }).filter({ visible: true });
```

## Handling Missing Test IDs

When an element lacks a `data-testid`:

1. Fall back to the next tier (role, label, etc.).
2. **Add a TODO comment** with the ticket key so the missing testid is tracked:

```ts
// TODO: <PREFIX>-NNNN — Missing data-testid for save button. Request from app team.
this.saveButton = page.getByRole('button', { name: 'Save' });
```

Never silently use a lower-tier locator and forget about it.

## Anti-Patterns

Reject these patterns in code review:

| Anti-pattern | Why it's bad | Use instead |
|---|---|---|
| `page.locator('button:has-text("Save")')` | Hardcoded text, brittle to copy changes | `page.getByRole('button', { name: 'Save' })` |
| `page.locator('div > div:nth-child(3) > .btn')` | Breaks on any DOM restructure | `getByTestId` or chained semantic locators |
| `page.locator('tr:nth-child(2) > td:nth-child(4)')` | Tied to table order which may change | `rowById(id)` + `cellForRow(id, columnName)` |
| `page.$('input.email')` | `$` is eager (snapshots); use `locator` (lazy) | `page.locator('input.email')` or `getByTestId('email-input')` |
| `page.locator('[data-testid="email-input"]')` | Re-implementing `getByTestId` as a CSS attribute selector | `page.getByTestId('email-input')` |

## Common Errors and Fixes

- **`locator.click: Timeout`** — locator targets the wrong element, an overlay is blocking it, or the page isn't loaded. Take a snapshot with `playwright-cli snapshot` to verify the testid exists.
- **`locator resolved to N elements`** — narrow with `.filter({ visible: true })`, `.first()`, or a more specific parent.
- **`fill: Element is not an input`** — locator resolved to a wrapper. Chain `.locator('input')` to drill in.

## Quick Reference: Decision Flow

```
Need to target an element
  ↓
Does it have data-testid?  → YES → getByTestId
  ↓ NO
Does it have a semantic role + accessible name? → YES → getByRole
  ↓ NO
Does it have a label / placeholder / title? → YES → getByLabel / getByPlaceholder / getByTitle
  ↓ NO
Can you target a parent that has a testid and chain? → YES → getByTestId('parent').getByRole(...)
  ↓ NO
Does it have a unique id or class? → YES → page.locator('#id') / page.locator('.class')
  ↓ NO
Does it have unique text? → YES (but brittle) → getByText
  ↓ NO
CSS/XPath as last resort + // comment explaining why
  ↓
Also: add TODO with ticket key for missing testid
```

## Further Reading

- `references/locator-recipes.md` — copy-paste solutions for tricky scenarios (iframes, shadow DOM, ARIA dialogs)
