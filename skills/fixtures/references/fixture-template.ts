// Starter template for pages/base-pages-fixture.ts.
// Copy this file to pages/base-pages-fixture.ts in a new project,
// then add page object imports + fixtures alphabetically as you build them.

import { test as baseTest, expect, chromium, Browser, Page } from '@playwright/test';
import { CommonTestFunctions } from '@CommonTestFunctions/common-test-functions';

// 1. Imports — alphabetical
import { HomePage } from '@POM/home-page';
import { LoginPage } from '@POM/login-page';
// import { OrderEditPage } from '@POM/orders/order-edit-page';
// import { OrdersPage } from '@POM/orders/orders-page';
// import { UserEditPage } from '@POM/users/user-edit-page';
// import { UsersPage } from '@POM/users/users-page';

// 2. Pages interface — alphabetical
export interface Pages {
  browser: Browser;
  browserPage: Page;
  common: CommonTestFunctions;
  futureDateString: string;
  homePage: HomePage;
  isCI: boolean;
  loginPage: LoginPage;
  newDescription: string;
  todayString: string;
  // orderEditPage: OrderEditPage;
  // ordersPage: OrdersPage;
  // userEditPage: UserEditPage;
  // usersPage: UsersPage;
}

// 3. Fixture registry — alphabetical
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

  futureDateString: async ({}, use) => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    const mm = String(future.getMonth() + 1).padStart(2, '0');
    const dd = String(future.getDate()).padStart(2, '0');
    await use(`${mm}${dd}${future.getFullYear()}`);
  },

  homePage: async ({ browserPage }, use) => {
    await use(new HomePage(browserPage));
  },

  isCI: async ({}, use) => {
    await use(!!process.env.CI);
  },

  loginPage: async ({ browserPage }, use) => {
    await use(new LoginPage(browserPage));
  },

  newDescription: async ({ common }, use) => {
    await use(`Test_${common.randomElement()}`);
  },

  todayString: async ({}, use) => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    await use(`${mm}${dd}${today.getFullYear()}`);
  }

  // orderEditPage: async ({ browserPage }, use) => {
  //   await use(new OrderEditPage(browserPage));
  // },
  // ordersPage: async ({ browserPage }, use) => {
  //   await use(new OrdersPage(browserPage));
  // },
  // userEditPage: async ({ browserPage }, use) => {
  //   await use(new UserEditPage(browserPage));
  // },
  // usersPage: async ({ browserPage }, use) => {
  //   await use(new UsersPage(browserPage));
  // }
});

export { expect };
