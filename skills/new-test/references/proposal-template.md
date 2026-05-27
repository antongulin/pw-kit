# Phase 5 Proposal Template

Use this exact structure when presenting the implementation plan in Phase 5. Replace bracketed placeholders. Do not write any code before the user approves.

---

## Implementation Plan for `PREFIX-NNNNN`

### Test File
- **Path**: `tests/<feature>/<page-name>-test.spec.ts`
- **Existing or new**: [New file / Adding to existing `<file>`]
- **Naming rationale**: [Why this name; if adding suffix like `-crud`, explain]

### Page Objects

#### `pages/<feature>/<page-name>-page.ts`
- **Existing or new**: [Existing — adding methods / New file]
- **Extends**: `BaseGridPage` / `BaseEditPage` / `BasePage`
- **gridPrefix** (if grid): `<entityName>Grid`

**New locators to add:**
| Name | Testid (or fallback) | TODO needed? |
|---|---|---|
| `emailInput` | `getByTestId('email-input')` | No |
| `saveButton` | `getByRole('button', { name: 'Save' })` | Yes — testid missing |

**New methods to add:**
| Method | Signature | Action it represents |
|---|---|---|
| `filterByEmail` | `(email: string) => Promise<void>` | Filter the grid by email column |
| `verifyDefaultState` | `() => Promise<void>` | Assert filters are blank, switches off |

**Methods already on base class (will use, not duplicate):**
- `filterSearch(text)`, `clickSearchButton()`, `verifyExists(value)`, `verifyNotExists(value)`

### Fixture Registry Changes
**File**: `pages/base-pages-fixture.ts`
- Add to `Pages` interface (alphabetical position): `usersPage: UsersPage;`
- Add fixture body (alphabetical position):
  ```ts
  usersPage: async ({ browserPage }, use) => {
    await use(new UsersPage(browserPage));
  }
  ```

### Test Structure

```ts
test.describe('PREFIX-NNNNN', () => {
  test('PREFIX-NNNNN: Default display', async ({ usersPage }) => {
    await test.step('Given User on Users page', async () => { /* beforeEach */ });
    await test.step('When the grid displays', async () => { ... });
    await test.step('Then the default state is correct', async () => { ... });
  });

  test('PREFIX-NNNNN: Search by email', async ({ usersPage, newDescription }) => {
    let cleanupNeeded = false;
    await test.step('And a user exists with email <email>', async () => {
      // precondition setup
      cleanupNeeded = true;
    });
    try {
      await test.step('When User searches by that email', async () => { ... });
      await test.step('Then the matching record is displayed', async () => { ... });
    } finally {
      if (cleanupNeeded) {
        await test.step('Cleanup', async () => { ... });
      }
    }
  });
});
```

(Step text copied verbatim from ticket — confirm with user if any wording is awkward.)

### Cleanup Strategy
| Test | Data created | Cleanup method |
|---|---|---|
| Default display | None | No cleanup |
| Search by email | One user record | `try/finally` with `cleanupNeeded` flag; `usersPage.deleteRow(email)` |

### Open Questions (from ticket review)
- [QUESTION 1]: [Specific ambiguity in ticket]
- [QUESTION 2]: [Specific missing detail]

(Resolve before proceeding.)

### Estimated Effort
- [N] page object methods to add
- [N] new locators
- [N] tests to write
- [N] fixture entries

---

**Approve this plan?** Any changes before I start writing?
