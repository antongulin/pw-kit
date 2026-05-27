---
name: api-testing
description: API testing patterns for Playwright + TypeScript — resource class pattern (HTTP wrappers extending BasePage, domain folders mirroring REST namespaces, typed payload builders), the ApiListener pattern for capturing real responses by stateKey without mocking, optional SQL/stored-procedure bridge for test-data setup, and TOTP-based MFA enrollment. Use when seeding test data via API, asserting on API responses without mocking, building HTTP wrapper classes, capturing network responses during UI tests, or setting up test users with MFA.
when_to_use: |
  Trigger phrases: "API test", "API helper", "api-listener", "ApiListener", "page.request", "capture response", "API resource class", "seed via API", "MFA", "TOTP", "executeLocalProcedure", "SQL setup", "test data via API". Auto-activates on files in api/.
paths: api/**/*.ts,tests/**/*.spec.ts,pages/**/*.ts
---

# API Testing Patterns

Apply these patterns when seeding test data via API, asserting on real API responses without mocking, or building reusable HTTP wrappers for tests.

## The Resource Class Pattern

Wrap each backend resource in a class. The folder structure mirrors the backend's REST namespace, so `api/CRM/Users/...` endpoints live in `api/crm/users/users-resource.ts`. Each class extends `BasePage` to inherit the same `page.request` context and credentials.

```ts
// api/crm/users/users-resource.ts
import { APIResponse, expect } from '@playwright/test';
import { BasePage } from '@POM/base-page';

interface UsersSearchParams {
  type: string;
  q?: string;
  status?: 'active' | 'inactive';
  page?: string;
  pageSize?: string;
}

export class UsersResource extends BasePage {
  async getUsersSearch(params: UsersSearchParams): Promise<APIResponse> {
    const url = new URL(`${this.BASE_URL}/api/CRM/Users/Search`);
    Object.entries(params)
      .filter(([_, v]) => v != null && v !== '')
      .forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const response = await this.page.request.get(url.toString());
    expect(response.status()).toBe(200);
    return response;
  }

  async createUser(payload: { email: string; firstName: string; lastName: string }): Promise<APIResponse> {
    const response = await this.page.request.post(`${this.BASE_URL}/api/CRM/Users`, { data: payload });
    expect(response.status()).toBe(201);
    return response;
  }
}
```

### Why extends BasePage

- Same `this.page` so it shares the authenticated session.
- Same env-backed credentials (`this.BASE_URL`, etc.).
- Same `expect` import.
- Same fixture lifecycle — instantiated via `base-pages-fixture.ts` like any other POM.

### Typed params with optional fields

Use a TypeScript interface with optional fields, then filter undefined/empty before building the query string. Compile-time guidance on which params are valid, runtime flexibility to omit any.

### Status assertion at the call site

Inline `expect(response.status()).toBe(200)` ensures API failures surface immediately at the seeding step, not as a confusing UI assertion later.

### Optional baseUrl per method

If you may need to run helpers against multiple server instances, accept an optional `baseUrl` parameter that defaults to `this.BASE_URL`:

```ts
async getUsersSearch(params: UsersSearchParams, baseUrl?: string): Promise<APIResponse> {
  const url = new URL(`${baseUrl ?? this.BASE_URL}/api/CRM/Users/Search`);
  // ...
}
```

## File Layout

```
api/
├── api-listener.ts                       # cross-cutting network intercept
├── <domain>/                              # admin, crm, finance, security, txn, web
│   └── <entity>-resource.ts               # CRUD wrappers (read-heavy)
│   └── <entity>-operations.ts             # CRUD wrappers (mutation-heavy)
├── custom/                                # test-infra: stored-proc bridge, SQL passthrough
└── integrations/                          # third-party endpoints (separate from domain)
```

The convention:
- `*-resource.ts` for read-heavy collections (GET-dominant)
- `*-operations.ts` for write-heavy entities (POST/PUT/DELETE-dominant)
- `custom/` for test-infra helpers that wrap procedure or SQL execution
- `integrations/` for third-party service wrappers (payment gateways, identity providers, analytics)

Each domain folder corresponds to a top-level REST namespace. New domains get a new folder.

## The ApiListener Pattern — Capture Real Responses

Set up listeners **before** navigation, then trigger a UI action and read the captured response after. This avoids mocking entirely — you get structured access to **real** backend data for assertions.

```ts
// api/api-listener.ts (sketch — full implementation in references/api-listener-template.ts)
export class ApiListener {
  constructor(private page: Page) {
    this.capturedResponses = {};
    this.capturedRequests = {};
    this.routesToIntercept = [];
  }

  addRouteCapture(regex: RegExp, capture: { method: string; stateKey: string; responseTransformer?: (data: any) => any }): void;
  async collectDataFromAPICalls(): Promise<void>;
  async waitForAPIResponses(stateKeys: string[]): Promise<void>;
  getCapturedData(stateKey: string): any;
  getCapturedRequestInfo(stateKey: string): CapturedRequestInfo[];
  async cleanup(): Promise<void>;
}
```

### Usage pattern 1 — pre-intercept

Register routes before the UI action; data is captured as it flows in:

```ts
const apiListener = new ApiListener(usersPage.page);
apiListener.addRouteCapture(/\/api\/CRM\/Users\/Search\?type=fluent/, {
  method: 'GET',
  stateKey: 'usersSearch'
});
await apiListener.collectDataFromAPICalls();

await usersPage.searchButton.click();        // triggers the API call
await usersPage.waitForSpinnerToDisappear();

const results = apiListener.getCapturedData('usersSearch');
expect(results.users).toHaveLength(5);
expect(results.users[0].id).toBe(42);
```

### Usage pattern 2 — promise race

Wait for a specific response without blocking the UI action:

```ts
const apiPromise = apiListener.waitForAPIResponses(['usersSearch']);
await Promise.all([
  usersPage.searchButton.click(),
  apiPromise
]);
const results = apiListener.getCapturedData('usersSearch');
```

### Why this beats mocking

- **Real responses, not synthetic** — tests catch real backend regressions.
- **Decoupled** — `stateKey` ties setup to assertion site by name. No tight coupling between intercept code and assertion code.
- **Transparent** — the original response is re-fulfilled, so the app continues normally. The listener is invisible to the UI under test.

### When mocking IS appropriate

Mock only **external/third-party services** (payment gateways, third-party identity providers, analytics endpoints). Never mock the primary application API — that defeats the purpose of end-to-end testing.

```ts
await page.route('**/api.stripe.com/v1/charges', route => route.fulfill({
  status: 200,
  body: JSON.stringify({ id: 'ch_test', status: 'succeeded' })
}));
```

## The SQL / Stored-Procedure Bridge (optional, project-specific)

If the application exposes a generic procedure-execution endpoint, wrap it for test-only DB manipulation. This avoids needing a direct DB connection from tests.

```ts
// api/custom/execute-local-procedure.ts (sketch)
export class ExecuteLocalProcedure extends BasePage {
  async executeLocalProcedure(
    payload: { procedureId: string; procedureName: string; parameterValues: Array<{ name: string; value: string }> }
  ): Promise<any>;

  async runSqlQuery(sql: string): Promise<any>;

  async createUserForTest(userId: string, fname: string, lname: string, password: string): Promise<void>;
  async assignUserToGroup(userId: string, groupId: string): Promise<void>;
  async getSortedSeasons(): Promise<string[]>;
  async verifySeasonDropdownSorted(dropdown: Locator): Promise<void>;
  // ... domain-specific helpers built atop the bridge
}
```

### Key patterns

- **One bridge endpoint + one SQL passthrough procedure** handles every test-infra DB need.
- **Idempotent procedure registration**: if a stored procedure may or may not exist, check first via `addProcedureAndGetId(name)` before using.
- **DB-truth assertions**: for asserting sort order or filter results, query the DB for the expected output and compare against the UI, rather than hardcoding the expected list. Adapts automatically when reference data changes.

### Caveats

- **Test environments only.** A raw SQL passthrough is a security risk in production.
- **Many backends don't have this.** Skip the bridge entirely if your backend doesn't expose a procedure-execution endpoint; use direct database access via a Node.js DB client in a fixture instead.

## MFA / TOTP Pattern

For tests against MFA-enabled users, generate TOTP codes inline:

```ts
// api/security/mfa-resource.ts (sketch)
export class MfaResource extends BasePage {
  async registerUserForMfa(opts: { userId: string; password: string }): Promise<Authenticator>;
}

// Returned Authenticator instance can generate codes
const authenticator = await mfaResource.registerUserForMfa({ userId, password });
const code = authenticator.generateCode();
await loginPage.mfaInput.fill(code);
```

The `Authenticator` is a self-contained RFC 6238 TOTP generator (no external library) initialized with the secret from the MFA setup API. Reuse the instance for subsequent code generations within the same 30-second window.

## Faker for Random Test Users

For tests needing fresh user data:

```ts
// api/web/registration/registration-resource.ts (sketch)
export class RegistrationResource {
  async getRandomUser(type?: 'Individual' | 'Household'): Promise<{
    newUserResponse: any;
    registrationBodyResponse: any;
  }>;
}

const { newUserResponse } = await registrationResource.getRandomUser('Individual');
```

- Faker properties generated fresh per call (not cached on the class).
- Returns BOTH the response JSON AND the original request body — useful when assertions need to know what was sent.

## How API Helpers Compose With Tests

```ts
test('PREFIX-NNNNN: User filters by status', async ({
  usersPage, common, executeLocalProcedure
}) => {
  let cleanupNeeded = false;
  const userId = common.randomNumber(7);
  try {
    await test.step('Given an active user exists', async () => {
      await executeLocalProcedure.createUserForTest(String(userId), 'Test', 'User', 'pass123');
      cleanupNeeded = true;
    });
    await test.step('When User filters by Active status', async () => {
      await usersPage.filterByStatus('Active');
    });
    await test.step('Then the test user is visible', async () => {
      await usersPage.verifyExists(`Test User`);
    });
  } finally {
    if (cleanupNeeded) {
      await test.step('Cleanup', async () => {
        await executeLocalProcedure.runSqlQuery(`DELETE FROM users WHERE id = ${userId}`);
      });
    }
  }
});
```

The API helpers handle setup and cleanup; the test body focuses on the UI behavior under test.

## Common Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| Mocking the primary application API | Use ApiListener to capture real responses; mock only external/third-party services |
| Hardcoding the `BASE_URL` in resource methods | Use `this.BASE_URL` (inherited from `BasePage`) or accept optional override |
| Skipping the inline `expect(response.status())` check | Always assert status at the call site so failures surface where they happen |
| Creating a fresh `request.newContext()` inside each method | Use the inherited `this.page.request` — shares cookies and auth |
| Bypassing the UI for the action under test | API is for setup and cleanup only; actions under test happen through the UI |
| Hardcoding test data IDs that exist in one environment | Either precreate in DB-as-code project, or seed via API |
| Setting up `page.route()` listeners inside the test | Move into the `ApiListener` class or a fixture; tests just call `getCapturedData(key)` |

## Further Reading


Additional reference docs (recipes, deep-dives, edge cases) will be added based on team feedback. PRs welcome.
