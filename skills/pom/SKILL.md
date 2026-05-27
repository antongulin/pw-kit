---
name: pom
description: Page Object Model architecture for Playwright + TypeScript — base class hierarchy (BasePage, BaseGridPage, BaseEditPage), decision tree for which base to extend, gridPrefix constructor pattern, POM authoring rules (plural for grids, singular for edits, file naming, no redundant base methods). Use when creating a new page object, deciding which base class to extend, adding methods to a page object, choosing between adding to base vs subclass, or reviewing POM structure.
when_to_use: |
  Trigger phrases: "page object", "POM", "base page", "BaseGridPage", "BaseEditPage", "which base class", "page object model", "add new page object", "extend base", "page-page.ts". Auto-activates when editing files in pages/.
paths: pages/**/*.ts,modals/**/*.ts
---

# Page Object Model Architecture

Apply these rules when creating, modifying, or reviewing any page object class.

## The Inheritance Chain

```
BasePage                           Universal foundation (nav, app frame,
  │                                modals, forms, dates, dropdowns, loading)
  ├── BaseGridPage                 Pages with a searchable data table
  ├── BaseEditPage                 Single-record edit/details forms
  └── (your project-specific bases) BaseAssociationsPage, BaseListDetailPage,
                                    BaseModalPage — add as patterns emerge
```

`BasePage` is the universal foundation. `BaseGridPage` and `BaseEditPage` cover ~80% of modern SaaS pages. Add more bases (associations, list-detail, modal) when your project develops patterns that don't fit either grid or edit.

## Decision Tree: Which Base To Extend

```
Does the page show a searchable table of records with per-row actions?
  └── YES → extends BaseGridPage
            (plural class name: UsersPage, OrdersPage, ProductsPage)

Is the page a single-record form opened via edit/details action?
  └── YES → extends BaseEditPage
            (singular class name: UserEditPage, OrderEditPage, ProductEditPage)

Does the page have a tree/sidebar navigation + detail panel layout?
  └── YES → extends BaseListDetailPage  (if you have one; otherwise BasePage)

Is it a checkbox-row association panel (Associate/Disassociate buttons)?
  └── YES → extends BaseAssociationsPage  (if you have one; otherwise BasePage)

Is it a modal that is opened from multiple pages?
  └── Place in modals/, extends BasePage or BaseModalPage if defined

None of the above (login page, dashboard, etc.)?
  └── extends BasePage directly
```

**Test the assumption**: if a base class method does not work on a new page, ask whether the inconsistency is intentional. Absent a documented reason in the requirements, treat it as a defect in the app, not a reason to override the base.

## Class Naming

| Page type | Naming | Example |
|---|---|---|
| Grid/list (shows many records) | **Plural** | `UsersPage`, `OrdersPage`, `ProductsPage` |
| Edit/details (shows one record) | **Singular** | `UserEditPage`, `OrderEditPage`, `ProductEditPage` |
| Modal | Singular + Modal suffix | `ConfirmDeleteModal`, `BulkExportModal` |
| List-detail | Plural + suffix | `ReportsListDetailPage` |

## File Naming and Location

- File name: `${pageName}-page.ts` (kebab-case, mirrors class name) → `users-page.ts`, `user-edit-page.ts`
- Modal files: `${name}-modal.ts` → `confirm-delete-modal.ts`
- Location: `pages/${feature}/${page-name}-page.ts`. The `pages/` folder structure mirrors the application's menu.
- Tabs of an edit page: `pages/${feature}/${entity}/tabs/${tab-name}-page.ts`.
- Shared modals: `modals/${modal-name}-modal.ts`.

## POM Class Skeleton

A page object class follows this shape:

```ts
import { Page, Locator } from '@playwright/test';
import { BaseGridPage } from '@POM/base-grid-page';

export class UsersPage extends BaseGridPage {
  // 1. Static locators (declare readonly, assign in constructor)
  readonly addUserButton: Locator;
  readonly emailFilterInput: Locator;
  readonly statusDropdown: Locator;

  // 2. Parameterized locators (arrow function properties)
  readonly userRowById = (id: string) => this.page.getByTestId(`usersGrid-row-${id}`);
  readonly editButtonById = (id: string) => this.page.getByTestId(`usersGrid-editBtn-${id}`);

  constructor(page: Page) {
    // 3. Call super with the gridPrefix string
    super(page, 'usersGrid');

    // 4. Bind locators
    this.addUserButton = page.getByTestId('add-user-button');
    this.emailFilterInput = page.getByTestId('email-filter-input');
    this.statusDropdown = page.getByTestId('status-dropdown');
  }

  // 5. Methods representing user actions (NOT individual clicks)
  async filterByStatus(status: string): Promise<void> {
    await this.filterSingleSelect(this.statusDropdown, status);
    await this.clickSearchButton();
  }

  async verifyDefaultState(): Promise<void> {
    await expect(this.addUserButton).toBeVisible();
    await expect(this.emailFilterInput).toHaveValue('');
  }
}
```

## The gridPrefix Pattern (the keystone)

`BaseGridPage` and `BasePage` use a `gridPrefix` string property to derive dynamic row testid patterns. Pass the prefix once in the constructor:

```ts
super(page, 'usersGrid');
```

This single string configures:

```ts
gridRowLocator(id)           → getByTestId('usersGrid-row-{id}')
gridDetailsButtonLocator(id) → getByTestId('usersGrid-detailsBtn-{id}')
gridDeleteButtonLocator(id)  → getByTestId('usersGrid-deleteBtn-{id}')
gridDuplicateButtonLocator(id) → getByTestId('usersGrid-duplicateBtn-{id}')
gridCheckboxLocator(id)      → getByTestId('usersGrid-rowCheckbox-{id}')
```

No need to redeclare these in every subclass — they come for free as long as your app's testids follow the convention.

## POM Authoring Rules

### Rule 1: Check the base class first

Before adding a method to a subclass, search the base class for the same functionality. Common base methods that often get duplicated by mistake:

- `filterSearch(text)`, `filterNoSearchButton(text)`, `clickSearchButton()`, `clickClearButton()`, `clickAddNewButton()`
- `filterSingleSelect(locator, option)`, `toggleSwitch(state, locator)`, `typeDateValue(locator, dateString)`
- `editRow(index)`, `editRowByDescription(description)`, `deleteRow(description)`
- `verifyExists(value)`, `verifyNotExists(value)`, `verifyNoRecordsFound()`
- `sortByColumnName(name)`, `verifyColumnIsSorted(name, ascending?)`
- `verifyGridColumnNames(grid, names)`, `verifyGridColumnTooltip(name)`
- `save()`, `saveAndClose()`, `saveAndConfirm()`, `back()`

If a base method exists, **use it**. Do not write a local version.

### Rule 2: Methods represent user actions, not clicks

```ts
// Bad: too granular, leaks UI mechanics into tests
await usersPage.emailInput.click();
await usersPage.emailInput.fill('foo@bar.com');
await usersPage.searchButton.click();
await usersPage.waitForSpinnerToDisappear();

// Good: one method on the page object
await usersPage.searchByEmail('foo@bar.com');
```

Page object methods should read like user intentions. Internal mechanics stay in the method body.

### Rule 3: Never put locators or actions in test files

If a test needs a locator that does not exist on the page object, **add it to the page object**, do not declare it inline in the test.

### Rule 4: Override base methods only with justification

If a base class method genuinely cannot work for a particular page (different UI library, different DOM structure for a deliberate UX reason), override it — but **add a comment explaining the deviation**. Silent overrides hide real defects in the app or in the base class.

### Rule 5: Save method variants are distinct

These are different UX flows and should be distinct named methods, not one method with a flag:

| Method | Behavior |
|---|---|
| `save()` | Primary save, stays on page |
| `saveAndClose()` | Save and return to grid |
| `saveAndConfirm()` | Save + confirm in modal dialog |
| `saveAndCloseAndConfirm()` | Save & close + confirm in modal |
| `saveAndCancel()` | Trigger save, cancel the confirmation (rollback test) |
| `cancelAndDontSave()` | Cancel + don't save in unsaved-changes modal |

## Locators in Page Objects

Page object locators follow the conventions in the **locators** skill. Quick reminders:

- Prefer `getByTestId()`.
- Use parameterized arrow functions for record-id-keyed locators: `rowById = (id) => ...`
- Use purpose-specific names: `addUserButton` not `button1`.
- Add a `// TODO: <PREFIX>-NNNN — Missing data-testid for ...` comment when forced to use a lower-tier locator.

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Class name doesn't match plural/singular convention | Rename: grid pages plural, edit pages singular |
| Redundant method already exists on base | Delete the local version, use the base |
| Locator declared in test file | Move to the page object |
| `this.page` used directly when a base method would work | Refactor to use the base method |
| `new SomePage(page)` in test file | Test files import via fixtures, not constructors |
| `save()` overridden without comment | Add comment explaining why this page needs a custom save |

## Further Reading

- `references/base-page-method-catalog.md` — full method catalog for BasePage, BaseGridPage, BaseEditPage with signatures
