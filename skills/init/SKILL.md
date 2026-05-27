---
name: init
description: Bootstrap a complete Playwright + TypeScript test automation project from scratch. Scaffolds folder structure (pages/, tests/, api/, modals/, data/), writes all configs (playwright.config.ts, tsconfig.json, .eslintrc, .prettierrc, .env template), generates base class skeletons (BasePage, BaseGridPage, BaseEditPage), creates the central fixture registry (base-pages-fixture.ts), and seeds example tests demonstrating the patterns. Use when user invokes /pw-kit:init, says they want to "start a new Playwright project", "scaffold playwright tests", "set up Playwright with these conventions", or asks how to initialize a Playwright + TypeScript repo.
when_to_use: |
  Trigger phrases: "/pw-kit:init", "scaffold playwright", "new playwright project", "init playwright", "set up playwright with conventions", "start a Playwright project from scratch", "bootstrap test project", "Playwright project template". Slash command only — does not auto-activate.
disable-model-invocation: true
allowed-tools: Bash(npm:*) Bash(npx:*) Bash(mkdir:*) Bash(git:*) Read Write Edit
---

# /pw-kit:init — Scaffold a New Playwright + TypeScript Project

Follow this 6-phase workflow when a user asks you to bootstrap a brand-new Playwright + TypeScript test project with this kit's conventions pre-wired.

## Required Inputs

Before starting, gather:

1. **Project name** (used for `package.json` name field)
2. **Application base URL** (for `.env` template)
3. **Ticket prefix** (e.g., `DEVQA`, `JIRA`, `LIN`, `GH`) — for test naming. Default to plugin's `userConfig.ticketPrefix` if set, else ask.
4. **Target directory** — where should the project be created?
5. **Feature module names** (optional) — sample modules to scaffold sub-folders for, e.g., `users`, `orders`, `products`. Default to one example: `example`.

If any are missing, ask before proceeding.

## Phase 1 — Create Folder Structure

```bash
mkdir -p <project>/{pages,tests,api,modals,data,docs,.vscode}
mkdir -p <project>/pages/{components}
mkdir -p <project>/tests/{utility,user-group-permissions,ci-cd-smoke}
mkdir -p <project>/tests/utility/example-test-patterns
mkdir -p <project>/api/{custom,integrations}
```

For each `<feature>` module:

```bash
mkdir -p <project>/pages/<feature>
mkdir -p <project>/tests/<feature>
```

## Phase 2 — Write Configuration Files

Generate from the templates in `assets/`:

| File | Source template |
|---|---|
| `package.json` | `assets/package.json.tmpl` |
| `playwright.config.ts` | `assets/playwright.config.ts.tmpl` |
| `tsconfig.json` | `assets/tsconfig.json.tmpl` |
| `.eslintrc` | `assets/.eslintrc.tmpl` |
| `.prettierrc` | `assets/.prettierrc.tmpl` |
| `.prettierignore` | `assets/.prettierignore.tmpl` |
| `.gitignore` | `assets/.gitignore.tmpl` |
| `.env.example` | `assets/.env.example.tmpl` |
| `global-setup.ts` | `assets/global-setup.ts.tmpl` |
| `.vscode/extensions.json` | `assets/.vscode-extensions.json.tmpl` |
| `.vscode/settings.json` | `assets/.vscode-settings.json.tmpl` |

Substitute `{{PROJECT_NAME}}`, `{{BASE_URL_DEFAULT}}`, `{{TICKET_PREFIX}}` placeholders during write.

## Phase 3 — Write Base Class Skeletons

The kit ships a **lean starter** — three base classes that cover ~80% of modern SaaS pages. Generate these files (templates in `assets/`):

| File | Class | Source template |
|---|---|---|
| `pages/base-page.ts` | `BasePage` | `assets/base-page.ts.tmpl` |
| `pages/base-grid-page.ts` | `BaseGridPage extends BasePage` | `assets/base-grid-page.ts.tmpl` |
| `pages/base-edit-page.ts` | `BaseEditPage extends BasePage` | `assets/base-edit-page.ts.tmpl` |

Each contains the essential methods documented in the **pom** skill — locators for common app frame elements, grid dynamic locators keyed by `gridPrefix`, date helpers (`typeDateValue`, `formatDateByLocale`, relative-year vars), form helpers (`toggleSwitch`, `filterSingleSelect`), modal helpers, save variants, etc.

**Mark optional sections clearly:**

```ts
// ─────────────────────────────────────────────────────────────────────────────
// OPTIONAL: Permissions test helpers
// Remove this block if you don't have a permissions/access-control system.
// ─────────────────────────────────────────────────────────────────────────────
async verifyNoSecurityRightsState(): Promise<void> { /* ... */ }
async verifyViewOnlyRightsState(): Promise<void> { /* ... */ }
// ...
```

Teams prune what they don't use; the comments make it obvious where to cut.

## Phase 4 — Write the Fixture Registry

Generate `pages/base-pages-fixture.ts` from `assets/base-pages-fixture.ts.tmpl`. The template includes:

- `Browser` + `browserPage` root fixtures
- `LoginPage` + `HomePage` stub imports (placeholder POMs)
- `CommonTestFunctions` for randomization
- Utility fixtures: `todayString`, `futureDateString`, `newDescription`, `isCI`
- Alphabetical placement comments for new entries

```ts
// Maintain alphabetical order in BOTH the Pages interface AND the test.extend body.
// PRs that break this are flagged in code review.
```

## Phase 5 — Seed Example Files

### Login/Home stub POMs

```
pages/login-page.ts
pages/home-page.ts
```

Minimal but functional — show the user how a real POM is structured.

### Common test functions

```
tests/utility/common-test-functions.ts
```

A `CommonTestFunctions` class with `randomBoolean()`, `randomNumber(length?)`, `randomElement()`, `getRandomNumberByLength(length)`, `getDateNDaysFromNow(days, culture?)`.

### Example test patterns (excluded from execution)

Drop the example template tests in `tests/utility/example-test-patterns/`:

```
example-grid-test.spec.ts          # search, filter, sort, paginate, delete
example-edit-test.spec.ts          # full CRUD on edit page
example-modal-test.spec.ts         # opening, confirming, cancelling a modal
```

These show the patterns in context. `playwright.config.ts` has `testIgnore: ['**/utility/example-test-patterns/**']` so they don't run.

### AGENTS.md

Generate `AGENTS.md` from `assets/AGENTS.md.tmpl`. This is the project rules document that AI agents read. It compresses the conventions taught by each skill into a single reference at the project root.

### README.md

Generate `README.md` from `assets/README.md.tmpl` with prerequisites, install steps, and usage.

## Phase 6 — Install Dependencies and Verify

```bash
cd <project>
npm install
npx playwright install --with-deps
```

Then run a smoke check:

```bash
npx playwright test --list      # should print the example tests (excluded), 0 actual tests
npx eslint . --ext .ts          # should complete without errors
npx prettier --check .          # should pass
```

If everything passes:

> Project initialized at `<path>`. Next steps:
> 1. Fill in `.env` with your real BASE_URL and credentials (copy `.env.example` to `.env`).
> 2. Write your first POM following the **pom** skill conventions.
> 3. Register it in `base-pages-fixture.ts` (alphabetical).
> 4. Invoke `/pw-kit:new-test` to write your first test from a ticket.

### Optional: pin Playwright version via Context7 MCP

The template uses `"@playwright/test": "latest"` for convenience. For production projects, pin to a specific version. Use **Context7 MCP** to look up the current stable release and any breaking-change notes before pinning:

```
1. Resolve Playwright Test library id via Context7
2. Fetch the latest stable version + recent changelog
3. Edit package.json: replace "latest" with the pinned version (e.g. "1.49.0")
4. Re-run npm install
```

## Customization After Init

The kit ships lean. Customize for your project:

| Need | Action |
|---|---|
| Multi-locale UI | Add locale-aware `formatDateByLocale` logic to `base-page.ts` |
| Tree-nav + detail layout pages | Create `pages/base-list-detail-page.ts` extending `BasePage` |
| Many-to-many association tables | Create `pages/base-associations-page.ts` extending `BasePage` |
| Virtual-scroll grids | Create a specialized abstract base extending `BaseGridPage` |
| MFA / TOTP login | Copy `assets/mfa-totp-template.ts` into `api/security/` |
| Custom stored-procedure bridge | Copy `assets/execute-local-procedure-template.ts` into `api/custom/` |

Each customization is opt-in. The kit doesn't impose patterns you don't need.

## Common Mistakes During Init

| Mistake | Fix |
|---|---|
| Skipping the `.env` setup, then tests can't find BASE_URL | Phase 6 reminds the user; `.env.example` is the starting point |
| Forgetting to run `npx playwright install` after `npm install` | Phase 6 runs it explicitly |
| Editing the alphabetical fixture order during init (saves time but creates a bad pattern) | The template includes the alphabetical comment so the convention is established from day one |
| Adding all 5+ base classes when only 3 are needed | Default to the lean 3; document upgrades in the customization section |

## Further Reading

- `assets/` — all the template files. Each is a complete, working example with placeholder substitutions.
