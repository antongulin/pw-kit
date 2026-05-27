---
name: cli-tool
description: Reference for the playwright-cli command-line tool — the verify-before-coding companion for Playwright + TypeScript test development. Covers the discovery workflow (open → snapshot → click/fill → emit locator code), API response verification via run-code, named browser sessions for multi-user tests, storage state save/load, tracing, and request mocking. Use when writing tests where element testids or interactions are uncertain, when verifying API response field names before assertions, or when debugging a test by replaying it interactively.
when_to_use: |
  Trigger phrases: "playwright-cli", "playwright cli", "verify testid", "discover elements", "snapshot the page", "interactive browser", "session management", "storage state", "save auth state", "trace", "verify API response". Auto-activates when user mentions the CLI tool by name or asks about live discovery / verification workflows.
---

# Playwright CLI — Verify Before Coding

Use the `playwright-cli` tool whenever you would otherwise have to guess about an element's locator, an API response shape, or an interaction sequence. The CLI gives you a live browser, emits Playwright locator code for every action you take, and prints structured snapshots of the DOM with stable element references.

## Why This Tool Matters

The single biggest source of wasted time in Playwright test authoring is **assuming what's on the page** instead of looking at it. The CLI eliminates that class of bug:

- Don't know an element's `data-testid`? Take a snapshot.
- Don't know what API field names the response uses? Run a `fetch` in browser context.
- Don't know if a click will trigger a modal or a navigation? Click it interactively and see.

Every command also **emits the equivalent Playwright TypeScript locator code** you can paste straight into a page object.

## Core Discovery Workflow

```bash
playwright-cli open https://app.example.com/login
playwright-cli snapshot
# Output lists every interactive element with a stable ID (e1, e2, ...) and its role, label, testid
```

Snapshot output looks like:
```
e1 [textbox "Email"]
e2 [textbox "Password"]
e3 [button "Sign In"]
```

Interact and let the CLI emit the locator code:

```bash
playwright-cli fill e1 "user@example.com"
# Emits: await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');

playwright-cli fill e2 "secret"
# Emits: await page.getByRole('textbox', { name: 'Password' }).fill('secret');

playwright-cli click e3
# Emits: await page.getByRole('button', { name: 'Sign In' }).click();
```

Paste the emitted code into your page object methods. **No guessing, no copy-paste from devtools.**

## Core Commands

```bash
# Browser lifecycle
playwright-cli open <URL>                    # launch and navigate
playwright-cli close                          # close current session
playwright-cli list                           # list all open sessions
playwright-cli close-all                      # close all sessions
playwright-cli kill-all                       # force-kill zombie processes

# Navigation
playwright-cli goto <URL>
playwright-cli go-back
playwright-cli go-forward
playwright-cli reload

# Discovery
playwright-cli snapshot                       # DOM + element references
playwright-cli snapshot --filename=foo.yml    # save snapshot to specific file
playwright-cli screenshot                     # PNG of current viewport
playwright-cli screenshot eN                  # element screenshot
playwright-cli screenshot --filename=foo.png

# Interaction (all emit Playwright locator code)
playwright-cli click eN
playwright-cli dblclick eN
playwright-cli fill eN "value"
playwright-cli select eN "option-value"
playwright-cli check eN / playwright-cli uncheck eN
playwright-cli hover eN
playwright-cli drag eA eB
playwright-cli press <Key>                    # e.g., Enter, ArrowDown, Tab
playwright-cli type "text"                    # type into focused element
playwright-cli upload ./path/to/file

# Dialogs
playwright-cli dialog-accept
playwright-cli dialog-accept "prompt text"
playwright-cli dialog-dismiss

# Resize / viewport
playwright-cli resize <width> <height>
```

## Running Arbitrary Playwright Code — `run-code`

For anything the named commands don't cover, use `run-code` with an async page handler. This is the escape hatch for API verification, JS evaluation, permission setup, etc.

### Verify API response field names (most common use)

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => fetch('/api/users/42').then(r => r.json()));
}"
```

The JSON is printed to stdout. **Always do this before writing assertions on field names** — frontend interfaces and backend JSON often disagree (e.g., `isPremium` in TS vs `IsPremium` in JSON).

### Set permissions / geolocation

```bash
playwright-cli run-code "async page => {
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 51.5074, longitude: -0.1278 });
}"
```

### Inspect iframe content

```bash
playwright-cli run-code "async page => {
  const frame = page.locator('iframe#payment').contentFrame();
  return await frame.locator('h1').innerText();
}"
```

### Wait for app-specific readiness flag

```bash
playwright-cli run-code "async page => {
  await page.waitForFunction(() => window.appReady === true);
}"
```

## Storage State — Save Auth, Skip Login

After logging in via the CLI, save the full browser state and reload it in later sessions to skip the login step:

```bash
# Save state after login
playwright-cli state-save auth.json

# Restore state in a new session
playwright-cli state-load auth.json
playwright-cli open https://app.example.com/dashboard   # already authenticated
```

This is invaluable when iterating on a test — log in once, save state, then explore the rest of the app freely without re-logging-in every cycle.

## Named Sessions — Multi-User Tests

```bash
# Open two independent browser sessions
playwright-cli -s=admin open https://app.example.com
playwright-cli -s=guest open https://app.example.com

# Operate on each independently
playwright-cli -s=admin snapshot
playwright-cli -s=guest click e3

# Close each
playwright-cli -s=admin close
playwright-cli -s=guest close
```

Use named sessions when designing tests that involve two roles (e.g., admin creates a record, regular user views it).

## Cookie / localStorage / sessionStorage

```bash
# Cookies
playwright-cli cookie-list
playwright-cli cookie-set session_id abc123 --domain=example.com --httpOnly --secure
playwright-cli cookie-delete session_id

# localStorage
playwright-cli localstorage-set theme dark
playwright-cli localstorage-get token
playwright-cli localstorage-clear

# sessionStorage (same API)
playwright-cli sessionstorage-set step 3
```

Use for test setup when the app stores feature flags or preferences in browser storage.

## Tracing

Wrap an uncertain sequence in tracing to capture DOM-before/after, network, and console for every action:

```bash
playwright-cli tracing-start

playwright-cli click eN
playwright-cli fill eM "value"

playwright-cli tracing-stop
# Trace + network log written to .playwright-cli/traces/
```

Open the resulting trace with `npx playwright show-trace <path>` — same viewer as for regular test failures.

## Request Mocking — Test Edge Cases

```bash
# Return a fixed JSON response for a route
playwright-cli route "**/api/users" --body='[{"id":1,"name":"Test"}]' --content-type=application/json

# Simulate a 500 error
playwright-cli route "**/api/orders" --status=500 --body='{"error":"Server error"}'

# Simulate offline
playwright-cli run-code "async page => {
  await page.route('**/api/**', route => route.abort('internetdisconnected'));
}"

# Manage routes
playwright-cli route-list
playwright-cli unroute "**/api/users"
playwright-cli unroute   # clear all
```

Use for exploring UI behavior under edge-case server responses **before** writing tests that depend on them. **Do not mock the primary application API in actual tests** — only mock external/third-party services.

## When To Use Each Tool

| Stage of test development | Tool |
|---|---|
| Don't know what testids exist | `playwright-cli open` + `snapshot` |
| Don't know API response shape | `playwright-cli run-code "...fetch..."` |
| Want to try the interaction first | Manually `click` / `fill` interactively, see what emits |
| Multiple user roles in one test | Named sessions `-s=role-name` |
| Skip repeated logins during exploration | `state-save` after one login, `state-load` after |
| Reproduce a failing test step-by-step | Replay it interactively, take snapshots at each step |
| Verify a UI behavior under unusual server response | `route` to mock the response, then re-snapshot |
| Capture evidence of behavior | `tracing-start` / `tracing-stop` or `screenshot` |

## Discovery → Code Loop

The canonical loop for writing a new test:

```
1. open    → navigate to the target page
2. snapshot → discover element IDs (e1, e2, ...) and DOM structure
3. run-code → verify API response field names / probe JS state
4. click/fill → perform actions; collect emitted locator code
5. route    → stub endpoints for error/edge cases if needed
6. state-save → persist authenticated session for reuse
7. tracing-start/stop → wrap uncertain sequences for debugging
8. Paste emitted code → write POM methods + test steps with confidence
```

## Companion: Context7 MCP for version-locked Playwright docs

`playwright-cli` verifies the **live UI behavior**. **Context7 MCP** verifies the **Playwright API signatures** for the version installed in `package.json`. Use both:

```
1. Read package.json → note @playwright/test version (e.g. 1.49.0)
2. Resolve the Playwright Test library id via Context7
3. Fetch version-pinned docs for the API you need
4. Cross-check with playwright-cli's live behavior
```

Why both: APIs change between versions, and training-era knowledge may be stale. Context7 gives you the right API surface; playwright-cli gives you the right runtime behavior. Combined, they eliminate the two main "code looked right but failed" bug classes.

## Common Mistakes

| Mistake | Fix |
|---|---|
| Guessing a `data-testid` instead of taking a snapshot | Take the snapshot first |
| Writing code that assumes API field names | Verify with `run-code "...fetch..."` |
| Re-logging-in for every exploration cycle | `state-save` once, `state-load` after |
| Forgetting to `close` sessions (zombies accumulate) | `playwright-cli list` and `close-all` periodically |
| Using `playwright-cli` for production tests | The CLI is for exploration only; actual tests use `@playwright/test` |

## Further Reading


Additional reference docs (recipes, deep-dives, edge cases) will be added based on team feedback. PRs welcome.
