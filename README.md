# pw-kit — Playwright AI Kit for Claude Code

> AI-driven test automation patterns for Playwright + TypeScript projects. 14 skills that teach Claude your team's conventions, plus 5 guided slash commands for the most common test workflows.

Works with any modern web framework — React, Vue, Angular, Svelte. Stack-agnostic by design.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Author: Anton Gulin](https://img.shields.io/badge/Author-Anton%20Gulin-181717?logo=github&logoColor=white)](https://github.com/antongulin)
[![Website](https://img.shields.io/badge/Website-anton.qa-blue)](https://www.anton.qa)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-antongulin-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/antongulin/)
[![X](https://img.shields.io/badge/X-@aiwithanton-000000?logo=x&logoColor=white)](https://x.com/aiwithanton)

---

## What This Does

When you install this plugin, Claude Code gets 14 new skills:

- **9 knowledge skills** that load automatically when you edit page objects or test files — Claude immediately knows your locator priority, base-class hierarchy, fixture pattern, date handling rules, and assertion conventions.
- **5 workflow slash commands** for the most common test tasks — write a new test from a ticket, fix a failing test, run a pre-PR review, scaffold a new project, or generate Gherkin test cases from a dev ticket.

The end result: Claude writes tests that follow your conventions on the first try, instead of generic Playwright code you have to rewrite.

---

## Quick Start

### 1. Install the plugin

```bash
# In Claude Code:
/plugin install /path/to/pw-kit.plugin
```

### 2. Configure on first install

Claude Code prompts you for two settings:

| Setting | What it does |
|---|---|
| **Ticket prefix** | Your tracker prefix (e.g. `JIRA`, `LIN`, `DEVQA`). Used in test names like `JIRA-12345: Description`. Default: `TASK`. |
| **App repository path** *(optional)* | Local path to the application repo. Used by `/pw-kit:new-test` and `/pw-kit:fix-test` to analyze source code. Leave blank if not local. |

### 3. Verify

```bash
/plugin list
# pw-kit should appear with 14 skills
```

### 4. Try a slash command

In an empty directory, run:

```
/pw-kit:init
```

You'll get a fully scaffolded Playwright + TypeScript project with base classes, fixtures, configs, and example tests.

---

## How It Works

### Knowledge skills auto-activate

You don't invoke these. They load when Claude sees you editing a matching file:

```
You: "Write a Customers page object with edit and delete buttons in each row."
```

Claude opens the file at `pages/customers/customers-page.ts`. The `pom` and `locators` skills load automatically because that path matches their `paths:` glob. Claude now knows:

- Extend `BaseGridPage`, not write a generic class
- Pass `'customersGrid'` as the `gridPrefix` to super
- Use parameterized arrow-function locators for row-keyed buttons
- Add a `TODO: TICKET-NNNNN — Missing testid` comment if any element lacks `data-testid`

No prompting needed. Claude just writes idiomatic code.

### Workflow skills run on demand

These don't auto-trigger. You type the slash command:

```
/pw-kit:new-test
```

Claude walks you through a 7-phase guided process — gather ticket context, analyze app source, explore the live UI, propose a plan, wait for your approval, implement, then do a mandatory gap analysis.

---

## Commands Reference

| Slash command | What it does | When to use it |
|---|---|---|
| **`/pw-kit:init`** | Scaffold a brand-new Playwright + TypeScript project with all conventions pre-wired (folder structure, configs, base classes, fixture registry, example tests, AGENTS.md). | Starting a new test repo. |
| **`/pw-kit:new-test`** | 7-phase guided test creation from a ticket. Gathers context, analyzes app source, explores the live UI, gates on a proposal, implements, runs gap analysis. | You have a ticket with acceptance criteria and need to write the test. |
| **`/pw-kit:fix-test`** | 6-phase failing-test investigation. Reads the trace, analyzes the test file and app source, reproduces live, then classifies as **app bug** (`test.fail` + defect report), **broken test** (`test.fixme` or fix in place), or **flaky** (fix root cause). | A test is failing and you want to know why before changing anything. |
| **`/pw-kit:pre-pr`** | 13-category checklist over your branch's changes. Reports violations as `file:line — rule — fix`. Catches naming, locators, dates, assertions, cleanup, fixture-ordering, page-object naming, and ticket-process gaps. | Before opening a pull request. |
| **`/pw-kit:create-test-cases`** | Convert a developer ticket into Gherkin test cases for a QA ticket. Produces 1 main scenario + 2–4 edge cases. Merges data variants. Flags ambiguities with `[QUESTION:]` tags. Output is paste-ready text — no code. | You have a dev card but no QA ticket yet. |

---

## Onboarding Walkthrough

### Scenario A — Start a brand-new test project

```
You: /pw-kit:init

Claude: I need a few details to scaffold the project:
  - Project name?
  - Target directory?
  - Application URL?
  - Ticket prefix? (or use the one you configured)

You: new-app-tests, ./new-app-tests, https://myapp.example.com, JIRA

Claude: [Creates folders, writes 16 config + base-class + example files,
runs npm install + npx playwright install, verifies with a smoke check]

Result: ./new-app-tests/ is a fully-working Playwright project. Edit .env, then
start adding feature tests.
```

### Scenario B — Add a test to an existing project

```
You: /pw-kit:new-test for JIRA-12345

Claude: Phase 1 — paste the ticket content or give me a URL.

You: [pastes ticket]

Claude: [Phases 2–4: reads your app repo, inventories existing POMs, walks
the UI live with playwright-cli to capture testids and verify the flow]

Claude: Phase 5 — Implementation plan: [shows the proposal in a structured
table]. Approve?

You: approve

Claude: [Phase 6: writes the POM additions, registers the fixture
alphabetically, writes the test file, runs it headed to verify]

Claude: Phase 7 — Gap analysis: [shows 3 missed coverage points with
recommendations]
```

### Scenario C — Fix a failing test

```
You: /pw-kit:fix-test — tests/customers/customers-test.spec.ts is failing
with "locator.click: Timeout waiting for getByTestId('save-button-old')"

Claude: [Phases 1–4: reads the trace, the test file, the linked app commit,
and reproduces in the live UI]

Claude: Phase 5 — Classification: BROKEN TEST. The app code at
src/components/SaveButton.tsx:12 renamed the testid from 'save-button-old'
to 'save-button-primary' in commit a1b2c3d. App behaves correctly.

Recommended action: update the locator in the page object. Trivial fix.

Approve?
```

### Scenario D — Pre-PR check

```
You: /pw-kit:pre-pr

Claude: [Reads git diff main...HEAD, walks the 13 categories]

Claude: 4 violations found:

tests/orders/orders-test.spec.ts:23 — Locators / Category 3 —
   Test imports from '@playwright/test' instead of '@POM/base-pages-fixture'.
   Fix: change import to '@POM/base-pages-fixture'.

tests/orders/orders-test.spec.ts:31 — Dates / Category 4 —
   Date input uses .fill('03/15/2024'). Hardcoded year, wrong method.
   Fix: use this.typeDateValue(input, `0315${this.thisYear}`).

[...two more violations...]
```

### Scenario E — Generate Gherkin from a dev ticket

```
You: /pw-kit:create-test-cases — [pastes a dev ticket about CSV export]

Claude: [4 scenarios in Gherkin, paste-ready text, with one [QUESTION:]
about pagination semantics]
```

---

## The 9 Knowledge Skills (Auto-Trigger)

These activate based on which file you're editing. You never invoke them manually.

| Skill | Activates when editing | What Claude knows |
|---|---|---|
| `locators` | `pages/**`, `tests/**`, `modals/**` | Locator priority ladder (testid → role → label → chained → class → text → CSS/XPath). `data-testid` naming convention. Parameterized arrow-function locators. |
| `pom` | `pages/**`, `modals/**` | Base class hierarchy. Decision tree for which base to extend. `gridPrefix` constructor pattern. Plural-for-grids / singular-for-edits naming. |
| `fixtures` | `pages/base-pages-fixture.ts`, `pages/**`, `tests/**` | The central fixture registry pattern. `browserPage` vs `page`. Alphabetical ordering rule. `Pages` interface. Path alias imports. |
| `test-organization` | `tests/**` | Ticket-prefixed naming. Mandatory `test.step` with Gherkin Given/When/Then/Cleanup. Failure classification (`test.fail` / `test.fixme` / `test.skip`). File size limits. |
| `forms-and-dates` | `tests/**`, `pages/**`, `modals/**` | `typeDateValue()` for date pickers (never `fill`). Relative-year variables. Idempotent `toggleSwitch`. `filterSingleSelect` for dropdowns. Distinct save variants. |
| `assertions` | `tests/**`, `pages/**` | Web-first only. No `waitForTimeout`. No `networkidle`. `expect.soft` and `expect.poll`. `waitForResponse` set up before the trigger. |
| `test-data` | `tests/**`, `pages/**` | Decision framework for in-test vs precreated vs read-only data. `try/finally` + `cleanupNeeded` flag. Step named exactly `"Cleanup"`. Random identifiers. |
| `api-testing` | `api/**`, `tests/**`, `pages/**` | Resource class pattern (extends BasePage). `ApiListener` with `stateKey` for capturing real responses without mocking. Optional SQL bridge. MFA/TOTP. |
| `cli-tool` | (on mention of playwright-cli) | Discovery workflow (open → snapshot → click/fill → emit code). `run-code` for API verification. Named sessions. Storage state. Tracing. |

---

## Validation

This plugin was tested across **4 iterations** using Anthropic's skill-creator framework. All 14 skills were behaviorally evaluated against a baseline (Claude without the skill loaded).

| Iteration | Skills tested | Pass rate with skill | Pass rate baseline | Delta |
|---|---|---|---|---|
| 1 | First 5 (locators, pom, fixtures, test-org, new-test) | 100% | 67% | +33% |
| 2 | 6 new (forms, assertions, test-data, pre-pr, fix-test, cli) | 96% → **100%**† | 82% | +13% → **+18%** |
| 3 (clean re-run) | 3 of iter-2 evals, no AGENTS.md leakage | 100% | 56% | **+44%** |
| 4 | Last 3 (api-testing, create-test-cases, init) | 100% | 28% | **+72%** |
| 5 (re-run) | eval-8 (pre-pr) + eval-9 (fix-test) after skill patches | **100% (16/16)** | — | — |

† Iter-2 originally scored 36/38 (95%). Two assertions failed: `pre-pr` didn't flag `{ page }` vs `{ browserPage }` in test files, and `fix-test` didn't recommend `playwright-cli` live verification before renaming a locator. Both skills were patched and re-tested in iter-5 — every assertion now passes. **All 14 skills now hit 100% with skill enabled.**

\* Iter-2 had baseline contamination — subagents could read the source project's AGENTS.md. Iter-3 re-ran clean and exposed the true +44% delta.

Strongest individual differentiators:

- **`init`**: baseline missed 5 of 7 directories, wrong fixture architecture, wrong config settings → 100% vs 38%
- **`pw-kit:create-test-cases`**: baseline produced 14 over-engineered scenarios with code fences; skill produced 4 well-scoped scenarios with `[QUESTION:]` flags → 100% vs 29%
- **`api-testing`**: baseline used generic `page.waitForResponse()`; skill used the `ApiListener` pattern with `stateKey` → 100% vs 17%

Detailed eval reports are at the project root (HTML files starting with `playwright-ai-kit-eval-iteration-`).

---

## Customizing for Your Stack

The kit ships **lean** — only the 3 base classes that cover ~80% of modern SaaS pages (`BasePage`, `BaseGridPage`, `BaseEditPage`). Add more as patterns emerge in your project:

| Pattern in your app | Add this base class |
|---|---|
| Many-to-many association tables with Associate/Disassociate buttons | `BaseAssociationsPage extends BasePage` |
| Tree-nav left panel + detail form right panel | `BaseListDetailPage extends BasePage` |
| Modal dialogs used from multiple pages | `BaseModalPage extends BasePage` |
| Virtual-scroll grids (CDK / TanStack) | `BasePricingGridPage extends BaseGridPage` (abstract) |

The `pom` skill's decision tree guides Claude on which base to extend.

For MFA login, an optional `mfa-totp-template.ts` is referenced — implement it per your provider (the kit doesn't ship it because TOTP secret management is project-specific).

For SQL/stored-procedure bridges, see `execute-local-procedure` references in the `test-data` skill — implement if your backend exposes a procedure-execution endpoint.

---

## Project Structure (after `/pw-kit:init`)

```
your-test-project/
├── .env                          # gitignored, copy from .env.example
├── .eslintrc                     # standard-with-typescript
├── .prettierrc                   # singleQuote, 120 width, 2 tab
├── .vscode/                      # recommended extensions + format-on-save
├── AGENTS.md                     # project-level conventions for AI agents
├── README.md
├── api/                          # API resource classes (mirrors REST namespace)
├── data/                         # static test fixtures
├── modals/                       # shared modal page objects
├── pages/
│   ├── base-page.ts              # universal foundation
│   ├── base-grid-page.ts         # searchable data tables
│   ├── base-edit-page.ts         # single-record edit forms
│   ├── base-pages-fixture.ts     # central fixture registry (alphabetical)
│   ├── home-page.ts              # stub POM
│   ├── login-page.ts             # stub POM
│   └── <feature>/                # your feature POMs
├── tests/
│   ├── utility/
│   │   ├── common-test-functions.ts
│   │   └── example-test-patterns/    # excluded from execution
│   └── <feature>/                # your feature tests
├── playwright.config.ts
├── tsconfig.json                 # path aliases @POM/* @CommonTestFunctions/*
└── package.json
```

---

## Compatibility

| Tool | Version |
|---|---|
| Playwright | latest (1.x) |
| Node.js | 18+ |
| TypeScript | latest |
| Claude Code | 2.x with plugin support |

Pair with:

- **Playwright MCP** — for in-conversation browser interactions
- **playwright-cli** — for the live-discovery phase of workflows
- **Context7 MCP** — for version-locked Playwright docs

---

## Frontmatter Notes

Skills use Claude Code-native frontmatter fields (`paths` for auto-triggering, `when_to_use` for extra trigger context, `disable-model-invocation` for workflow-only skills). These work in Claude Code and pass `claude plugin validate`, but are extensions to the cross-platform [agentskills.io open standard](https://agentskills.io). For cross-platform `.skill` distribution, move these fields into `metadata:`.

---

## Contributing

The plugin source lives at [github.com/antongulin/pw-kit](https://github.com/antongulin/pw-kit). To modify locally:

1. Edit `skills/<name>/SKILL.md`
2. `claude plugin validate .claude-plugin/plugin.json`
3. `zip -r ../pw-kit.plugin . -x "*.DS_Store"`
4. Reinstall in Claude Code

To add a new skill, follow the pattern in `skills/locators/` — `SKILL.md` with frontmatter + `references/` for deeper content. Keep `SKILL.md` under 500 lines; put detail in references.

---

## Author

**Anton Gulin** — California, US (UTC −07:00)

QA / test-automation engineer building AI-augmented test development workflows.

- 🌐 Website: [anton.qa](https://www.anton.qa)
- 📨 Email: [i@anton.qa](mailto:i@anton.qa)
- 💼 LinkedIn: [in/antongulin](https://www.linkedin.com/in/antongulin/)
- 💻 GitHub: [@antongulin](https://github.com/antongulin)
- ✍️ Medium: [@antongulin](https://medium.com/@antongulin)
- 🐦 X: [@aiwithanton](https://x.com/aiwithanton)
- 📞 Contact form: [anton.qa/contact](https://anton.qa/contact)

Feedback, issues, and PRs welcome — open an issue on the [GitHub repo](https://github.com/antongulin/pw-kit) or reach out via any channel above.

---

## License

MIT — see [LICENSE](LICENSE). © Anton Gulin.

---

## Background

This kit distills patterns I developed and contributed to over years of building a production Playwright test suite — 40k+ lines of TypeScript, 14 base classes, 400+ page objects, 200+ test suites, and **thousands of individual test cases** running across multiple environments and CI pipelines. pw-kit takes the conventions I helped establish there, strips out anything proprietary or domain-specific, and generalizes them into a reusable plugin so I (and others) can stand up new Playwright projects with the same discipline from day one.

Validated using [Anthropic's skill-creator](https://docs.claude.com/en/docs/claude-code/skills) framework across 4 iterations.
