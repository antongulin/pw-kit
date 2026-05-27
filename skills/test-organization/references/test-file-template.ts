// Starter template for a new test spec file.
// Replace PREFIX with your ticket prefix, replace EntityName with the entity under test.

import { test, expect } from '@POM/base-pages-fixture';

const featureName = 'Users';

test.beforeEach(async ({ loginPage, homePage, usersPage }) => {
  await test.step('Given User logged in successfully', async () => {
    await loginPage.visit();
    await loginPage.loginWithDefaultCredentials();
  });
  await test.step(`And navigated to ${featureName}`, async () => {
    await homePage.filterAndOpenFromSystemNav(featureName);
    await usersPage.initialize();
  });
});

test.afterEach(async ({ browserPage }) => {
  await browserPage.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// Read-only test (no cleanup needed)
// ─────────────────────────────────────────────────────────────────────────────

test('PREFIX-NNNNN: Default display', async ({ usersPage }) => {
  await test.step('When the grid displays', async () => {
    await expect(usersPage.grid).toBeVisible();
  });
  await test.step('Then the default state is correct', async () => {
    await usersPage.verifyDefaultState();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Data-modifying test (try/finally + cleanupNeeded flag)
// ─────────────────────────────────────────────────────────────────────────────

test('PREFIX-NNNNN: Add a new user', async ({ usersPage, userEditPage, newDescription }) => {
  let cleanupNeeded = false;
  await test.step('When User clicks Add New', async () => {
    await usersPage.addNewButton.click();
  });
  await test.step('And populates the required fields', async () => {
    await userEditPage.emailInput.fill(`${newDescription}@example.com`);
    await userEditPage.firstNameInput.fill(newDescription);
  });
  try {
    await test.step('And saves the record', async () => {
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

// ─────────────────────────────────────────────────────────────────────────────
// Multi-scenario ticket (numbered scenarios)
// ─────────────────────────────────────────────────────────────────────────────

test('PREFIX-NNNNN Scenario 1: Sort by email ascending', async ({ usersPage }) => {
  await test.step('When User clicks the Email column header', async () => {
    await usersPage.sortByColumnName('Email');
  });
  await test.step('Then the records are sorted by email ascending', async () => {
    await usersPage.verifyColumnIsSorted('Email', true);
  });
});

test('PREFIX-NNNNN Scenario 2: Sort by email descending', async ({ usersPage }) => {
  await test.step('When User clicks the Email column header twice', async () => {
    await usersPage.sortByColumnName('Email');
    await usersPage.sortByColumnName('Email');
  });
  await test.step('Then the records are sorted by email descending', async () => {
    await usersPage.verifyColumnIsSorted('Email', false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Known defect (test.fail with defect ticket reference)
// ─────────────────────────────────────────────────────────────────────────────

// Defect: DEFECT-NNNNN
test.fail('PREFIX-NNNNN: Email validation rejects unicode', async ({ userEditPage }) => {
  await test.step('When User enters a unicode email', async () => {
    await userEditPage.emailInput.fill('用户@example.com');
  });
  await test.step('Then validation rejects it', async () => {
    await expect(userEditPage.emailValidationAlert).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Broken test (test.fixme — create a Fix-me task)
// ─────────────────────────────────────────────────────────────────────────────

// Fix-me task: PREFIX-NNNNN — Fix when the date picker locator changes
test.fixme('PREFIX-NNNNN: Birthday field accepts past date', async ({ userEditPage }) => {
  // Test body kept for reference; will be updated in the fix-me task
});

// ─────────────────────────────────────────────────────────────────────────────
// Conditional skip
// ─────────────────────────────────────────────────────────────────────────────

test('PREFIX-NNNNN: Self-hosted-only feature', async ({ usersPage, isHosted }) => {
  test.skip(isHosted, 'Self-hosted-only feature; un-skip when running against on-prem env');
  await test.step('Then the self-hosted control is visible', async () => {
    await expect(usersPage.selfHostedOnlyButton).toBeVisible();
  });
});
