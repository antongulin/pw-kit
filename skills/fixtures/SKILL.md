---
name: fixtures
description: Central fixture pattern for Playwright + TypeScript test automation — single base-pages-fixture.ts file that pre-wires every page object, the browserPage root fixture (test-scoped page + worker-scoped browser), alphabetical ordering rule, import-via-path-alias pattern, and Pages interface for type safety. Use when adding a new page object to the fixture registry, when fixing 'not a function' errors from wrong fixture dependencies, when test files have lots of manual page-object instantiation, or when reviewing fixture registration order.
when_to_use: |
  Trigger phrases: "fixture", "base-pages-fixture", "browserPage", "register page object", "add fixture", "Pages interface", "fixture dependency", "not a function" errors in test setup, "alphabetical fixture order". Auto-activates when editing pages/base-pages-fixture.ts.
paths: pages/base-pages-fixture.ts,pages/**/*-page.ts,tests/**/*.spec.ts
---

# Central Fixture Registry Pattern

Apply this pattern when adding page objects to the project, when test files need a new page object available, or when fixtures cause "not a function" errors.

## The Pattern in One File

A single file at `pages/base-pages-fixture.ts` extends Playwright's built-in `test` with a custom fixture for every page object in the project. Test files import from this file via a path alias, never from `@playwright/test` directly.

```ts
// pages/base-pages-fixture.ts
import { test as baseTest, expect, chromium, Browser, Page } from '@playwright/test';
import { CommonTestFunctions } from '@CommonTestFunctions/common-test-functions';
import { LoginPage } from '@POM/login-page';
import { HomePage } from '@POM/home-page';
import { OrdersPage } from '@POM/orders/orders-page';
import { OrderEditPage } from '@POM/orders/order-edit-page';
import { UsersPage } from '@POM/users/users-page';
import { UserEditPage } from '@POM/users/user-edit-page';
// ... import every page object alphabetically

export interface Pages {
  browser: Browser;
  browserPage: Page;
  common: CommonTestFunctions;
  homePage: HomePage;
  loginPage: LoginPage;
  orderEditPage: OrderEditPage;
  ordersPage: OrdersPage;
  userEditPage: UserEditPage;
  usersPage: UsersPage;
  // ... alphabetical
}

export const test = baseTest.extend<Pages>({
  browser: [
    async ({}, use) => {
      const browser = await chromium.launch({});
      await use(browser);
      await browser.close();
    },
    { scope: 'worker' }
  ],

  browserPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  common: async ({}, use) => {
    await use(new CommonTestFunctions());
  },

  homePage: async ({ browserPage }, use) => {
    await use(new HomePage(browserPage));
  },

  loginPage: async ({ browserPage }, use) => {
    await use(new LoginPage(browserPage));
  },

  orderEditPage: async ({ browserPage }, use) => {
    await use(new OrderEditPage(browserPage));
  },

  ordersPage: async ({ browserPage }, use) => {
    await use(new OrdersPage(browserPage));
  },

  userEditPage: async ({ browserPage }, use) => {
    await use(new UserEditPage(browserPage));
  },

  usersPage: async ({ browserPage }, use) => {
    await use(new UsersPage(browserPage));
  }
  // ... alphabetical
});

export { expect };
```

## Why This Works

1. **`browser` is worker-scoped** — one Chromium instance per worker process, shared across tests in that worker.
2. **`browserPage` is test-scoped** — fresh browser context and page per test, ensuring isolation.
3. **Every page object fixture depends on `{ browserPage }`** — they all wrap the same `Page` within a test, so navigation in one POM is visible to all others.
4. **Test files import `test` and `expect` from the registry**, not from `@playwright/test`, so all fixtures are available with zero per-file ceremony.

## Test File Usage

Test files become extremely lean:

```ts
import { test, expect } from '@POM/base-pages-fixture';

test.beforeEach(async ({ loginPage }) => {
  await test.step('Given User logged in', async () => {
    await loginPage.visit();
    await loginPage.loginWithDefaultCredentials();
  });
});

test.afterEach(async ({ browserPage }) => {
  await browserPage.close();
});

test('PREFIX-12345: Search users by email', async ({ usersPage, userEditPage }) => {
  await test.step('When User searches for an email', async () => {
    await usersPage.filterSearch('user@example.com');
  });
  await test.step('Then the matching record appears', async () => {
    await usersPage.verifyExists('user@example.com');
  });
});
```

No `new UsersPage(page)`. No imports of individual page classes per test file. Type-safe through `Pages`.

## The Three Inviolable Rules

### Rule 1: Use `browserPage`, never `page`, in test fixtures

Page object fixtures must depend on `{ browserPage }`, not `{ page }`. The raw `page` fixture from Playwright's `test` is hidden by the custom extension; using it will cause "not a function" or "page is undefined" errors at runtime.

```ts
// CORRECT
usersPage: async ({ browserPage }, use) => {
  await use(new UsersPage(browserPage));
}

// WRONG — will fail at runtime
usersPage: async ({ page }, use) => {
  await use(new UsersPage(page));
}
```

Test files follow the same rule:

```ts
// CORRECT
test.afterEach(async ({ browserPage }) => {
  await browserPage.close();
});

// WRONG
test.afterEach(async ({ page }) => {
  await page.close();
});
```

### Rule 2: Alphabetical ordering is enforced

Both the `Pages` interface AND the `test.extend({...})` body must be alphabetically sorted. PRs that introduce out-of-order entries are flagged in code review.

This makes the registry scannable as it grows past hundreds of entries.

### Rule 3: Import from the path alias, not the file path

Configure a TypeScript path alias in `tsconfig.json`:

```json
"paths": {
  "@POM/*": ["pages/*"]
}
```

Test files import via the alias:

```ts
// CORRECT
import { test, expect } from '@POM/base-pages-fixture';

// AVOID — breaks if file is moved
import { test, expect } from '../../pages/base-pages-fixture';
```

## Adding a New Page Object to the Registry

Follow these steps in order:

1. **Write the page object class** in `pages/${feature}/${page-name}-page.ts` extending the correct base.
2. **Import it** in `base-pages-fixture.ts` — insert the import alphabetically.
3. **Add the type** to the `Pages` interface — insert alphabetically. Use the camelCase fixture name (lowercase class name).
4. **Add the fixture body** — insert alphabetically in `test.extend({...})`.
5. **Use it in tests** by destructuring `{ yourPageName }`.

## Non-Page Fixtures

Beyond page objects, the registry typically wires utility fixtures. Examples:

```ts
export const test = baseTest.extend<Pages>({
  // ... browser + browserPage above

  common: async ({}, use) => {
    await use(new CommonTestFunctions());
  },

  todayString: async ({}, use) => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    await use(`${mm}${dd}${today.getFullYear()}`);
  },

  futureDateString: async ({}, use) => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    const mm = String(future.getMonth() + 1).padStart(2, '0');
    const dd = String(future.getDate()).padStart(2, '0');
    await use(`${mm}${dd}${future.getFullYear()}`);
  },

  newDescription: async ({ common }, use) => {
    await use(`Test_${common.randomElement()}`);
  },

  isCI: async ({}, use) => {
    await use(!!process.env.CI);
  }
});
```

Tests destructure them naturally:

```ts
test('PREFIX-NNNNN: Add new', async ({ usersPage, userEditPage, newDescription, todayString }) => {
  // newDescription is unique per test
  // todayString is today's date in MMDDYYYY
});
```

## Common Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| `TypeError: <fixture>.<method> is not a function` | Fixture depends on `{ page }` instead of `{ browserPage }` | Change to `{ browserPage }` |
| `<fixture> is undefined` in test | Forgot to add to `Pages` interface | Add the type |
| `Cannot find module '@POM/base-pages-fixture'` | Path alias not configured | Add `@POM/*` to `tsconfig.json` paths |
| Fixture works locally but fails in CI | Worker-scoped vs test-scoped mismatch | Check scope of `browser` (worker), not test |
| Code review flags "fixture out of order" | Alphabetical rule | Re-sort the interface AND the `test.extend` body |

## Path Aliases in tsconfig.json

Recommended minimal set:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@POM/*": ["pages/*"],
      "@CommonTestFunctions/*": ["tests/utility/*"]
    }
  }
}
```

Add feature-specific aliases as the project grows: `@Users/*`, `@Orders/*`, etc. — this reduces deep relative imports (`../../../`) in page object files.

## Further Reading

- `references/fixture-template.ts` — copy-paste starter for `base-pages-fixture.ts`
