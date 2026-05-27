# API Response Verification Recipes

API response field names frequently differ from the TypeScript interface names the front-end uses internally. Always verify the actual shape before writing assertions or POM methods that depend on field names.

## Why This Matters

Common pattern:
- TypeScript interface in the app: `interface User { isPremium: boolean }`
- API JSON response: `{ "PremiumIndicator": true, "is_premium_user": true, ... }`

Writing a test that asserts on `user.isPremium` will silently pass against a mock but fail against the real backend. Always check.

## Recipe 1: Inspect a GET response

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => fetch('/api/users/42', { headers: { 'Content-Type': 'application/json' }})
    .then(r => r.json()));
}"
```

The returned JSON is printed. Compare field names against what the test will assert.

## Recipe 2: POST a payload and inspect response

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', firstName: 'Test' })
  }).then(r => r.json()));
}"
```

## Recipe 3: Capture a response during a UI action

If the API is triggered by a user action, capture it without firing manually:

```ts
const responsePromise = page.waitForResponse(response =>
  response.url().includes('/api/users') && response.status() === 200
);
await usersPage.searchButton.click();
const response = await responsePromise;
const json = await response.json();
console.log('Field names:', Object.keys(json));
```

Insert this code temporarily during development, observe the field names, then write the actual test.

## Recipe 4: Inspect headers (auth, content-type, etc.)

```bash
playwright-cli run-code "async page => {
  const r = await page.evaluate(() => fetch('/api/users/42', { method: 'GET' }));
  return await r.evaluate(r => Object.fromEntries(r.headers.entries()));
}"
```

## Recipe 5: Multiple endpoints in one shot

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(async () => {
    const [users, orders, products] = await Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/products').then(r => r.json())
    ]);
    return {
      userFields: Object.keys(users[0] || {}),
      orderFields: Object.keys(orders[0] || {}),
      productFields: Object.keys(products[0] || {})
    };
  });
}"
```

## When to Mock vs When Not to Mock

- **Do not mock the primary application API** in tests. Tests should exercise real backend behavior.
- **Mock only external/third-party services** (payment gateways, third-party identity providers, analytics).
- **Capture real responses for assertion data**, do not mock to make assertions pass — use the API listener pattern instead (see `playwright-api-testing` skill if installed).

## Common Field Name Surprises

| Front-end (TS interface) | Backend (JSON) | Example |
|---|---|---|
| camelCase | PascalCase | `isPremium` vs `IsPremium` |
| camelCase | snake_case | `firstName` vs `first_name` |
| `id` | `Id` or `_id` or `<entity>Id` | `id` vs `userId` |
| Boolean | "Indicator" suffix | `isActive` vs `ActiveIndicator` |
| Dates as `Date` | Dates as ISO strings | `createdAt` vs `"2024-03-15T12:00:00Z"` |
| Optional `undefined` | Optional `null` | `email?: string` vs `email: null` |

When the convention is inconsistent across endpoints (which is common in older codebases), always verify per endpoint.
