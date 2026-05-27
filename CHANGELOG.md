# Changelog

All notable changes to **pw-kit** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] — Initial release

First public release. 14 skills covering Playwright + TypeScript test automation patterns, plus 5 guided slash command workflows. Validated across 5 evaluation iterations with 100% behavioral pass rate.

### Added

**9 knowledge skills** (auto-trigger via `paths:` glob matching):

- `locators` — strict locator priority ladder (testid → role → label → chained → CSS/XPath); data-testid naming convention; parameterized arrow-function locators
- `pom` — base class hierarchy (BasePage / BaseGridPage / BaseEditPage); decision tree for which base to extend; `gridPrefix` constructor pattern
- `fixtures` — central `base-pages-fixture.ts` registry; `browserPage` vs `page` rule; alphabetical ordering
- `test-organization` — ticket-prefixed test naming; mandatory `test.step` with Gherkin; failure classification (`test.fail` / `test.fixme` / `test.skip`)
- `forms-and-dates` — `typeDateValue` for date inputs; relative-year variables; idempotent `toggleSwitch`; named save variants
- `assertions` — web-first assertions only; no `waitForTimeout`; no `networkidle`; `expect.soft` / `expect.poll`; `waitForResponse` ordering
- `test-data` — decision framework for in-test vs precreated vs read-only data; `try/finally` cleanup with `cleanupNeeded` flag
- `api-testing` — resource class pattern; `ApiListener` for capturing real responses by `stateKey`; optional SQL bridge; MFA/TOTP
- `cli-tool` — playwright-cli discovery workflow + Context7 MCP version-locked docs

**5 workflow skills** (slash commands, `disable-model-invocation: true`):

- `/pw-kit:new-test` — 7-phase guided test creation from a ticket
- `/pw-kit:fix-test` — 6-phase failing-test investigation with 3-way classification (bug / broken / flaky)
- `/pw-kit:pre-pr` — 13-category pre-PR checklist
- `/pw-kit:create-test-cases` — generate Gherkin test cases from a dev ticket
- `/pw-kit:init` — scaffold a brand-new Playwright + TypeScript project (16 templates: configs, base classes, fixture registry, example tests, AGENTS.md)

### Validated

- **Iteration 1** (5 skills, 10 runs): 100% with-skill vs 67% baseline → **+33%**
- **Iteration 2** (6 new skills, 12 runs): 100% with-skill (post-patch) vs 82% baseline → **+18%**
- **Iteration 3** (clean baseline, no AGENTS.md leakage): 100% vs 56% → **+44%** (true delta)
- **Iteration 4** (last 3 skills, 6 runs): 100% vs 28% → **+72%**
- **Iteration 5** (post-patch re-run of eval-8 and eval-9): 100% (16/16)

All four iterations passed `claude plugin validate`.

### Integrations

- **Playwright MCP** — recommended for in-conversation browser interactions
- **playwright-cli** — used by live-discovery phases of workflow skills
- **Context7 MCP** — version-locked Playwright docs; integrated into `new-test`, `fix-test`, `init`, and `cli-tool` skills

---

[0.1.0]: https://github.com/antongulin/pw-kit/releases/tag/v0.1.0
