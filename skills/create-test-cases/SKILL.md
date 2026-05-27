---
name: create-test-cases
description: Convert a developer feature ticket into lean, ticket-ready Gherkin test cases for paste into a QA ticket. Produces 1 main success scenario + 2-4 edge cases max, merges near-identical data variants into one case with annotation, flags ambiguity inline with [QUESTION:] tags. Output is pure ticket-ready text — no code, no file paths. Use when user invokes /pw-kit:create-test-cases, says they have a dev card without a QA card yet, asks to "draft test cases", "write Gherkin scenarios from this feature", or wants to prepare QA scope before implementation.
when_to_use: |
  Trigger phrases: "/pw-kit:create-test-cases", "create test cases", "draft test cases", "Gherkin scenarios", "QA scope", "test cases for ticket", "convert dev card to test cases", "test case planning". Slash command only — does not auto-activate.
disable-model-invocation: true
allowed-tools: Read Grep Glob
---

# /pw-kit:create-test-cases — Generate Gherkin Test Cases From a Dev Ticket

Follow this 4-phase workflow when a user has a feature ticket but no QA test cases yet, and wants you to draft them. The output is **ticket-paste-ready text only** — no code, no file paths, no implementation. This skill produces the intermediate artifact that feeds `/pw-kit:new-test`.

## Required Inputs

Before starting, ensure you have:

1. **Dev ticket content** — title, main success scenario, extensions, any existing test-case notes
2. **Feature area** — for calibrating scope against similar existing tests

If the dev ticket isn't pasted into the conversation, ask for it before starting.

## Phase 1 — Parse the Ticket

Extract from the ticket:

- **Main success scenario** — the happy path
- **Extensions / alternatives** — branches off the happy path
- **Acceptance criteria** — explicit pass/fail conditions
- **Data variants** — different inputs that produce different outputs
- **Preconditions** — what must be true before the user action

Note any ambiguity. **Do not guess** — flag with `[QUESTION: ...]` for the user to answer before the test cases are final.

## Phase 2 — Calibrate Scope

Search the test repo for existing tests in the same feature area:

```bash
ls tests/<feature>/ | head -20
grep -r "test.describe" tests/<feature>/ | head -10
```

This tells you:
- How many test cases similar features have (3? 8? 15?)
- What granularity is normal (one test per UI control, or one test per user flow?)
- Which conventions the team follows

**Anchor your draft against this calibration.** A 3-scenario ticket in a feature area where similar features have 8 tests probably means you're missing edge cases. A 12-scenario draft in a feature area where similar features have 4 tests probably means you're over-engineering.

## Phase 3 — Draft Test Cases

Produce **1 main success scenario + 2-4 edge cases max.** Resist the urge to test every possible variation.

### Rules

- **Exactly one `When` per test case** — forces atomic action focus
- **User referred to as "User"** — never "a user", "the user", first/second person
- **Merge data variants** — if Scenarios 2 and 3 only differ in input value, combine into one case with `[Data variants: ...]` annotation
- **Add coverage via extra `And`/`Then` steps, not extra test cases** — only branch into a new case when the user action differs
- **Use Gherkin keywords**: `Given` (past), `When` (present, exactly one), `And` (any number), `Then` (present)
- **Flag ambiguity inline** with `[QUESTION: <specific clarification needed>]`
- **No code, no file paths, no implementation details** — this is QA-ticket text

### Output format

```
Scenario 1: <Main happy path description>
  Given <precondition in past tense>
  And <additional preconditions if any>
  When <the one action under test>
  Then <expected outcome>
  And <additional expected outcomes if any>

Scenario 2: <Edge case description>
  Given <precondition>
  When <the action>
  Then <expected outcome>
  [QUESTION: <if any specific ambiguity here>]

Scenario 3: <Edge case description>
  Given <precondition>
  When <the action>
  Then <expected outcome>
  [Data variants:
    - Input A → Output X
    - Input B → Output Y
    - Input C → Output Z]
```

## Phase 4 — Review With User

Present the draft to the user as ticket-paste-ready text. Ask:

1. Does the count feel right (not over-engineered, not missing critical coverage)?
2. Are any `[QUESTION:]` markers resolvable now?
3. Does the data variants annotation in Scenario N match what they expect?
4. Anything to add or remove?

**Iterate based on feedback.** Produce a clean final version after the user signs off — strip any `[QUESTION:]` markers that have been resolved (incorporate the answers), keep ones still open as explicit follow-ups.

## Example

Dev ticket: "User can mark a customer as VIP. Star badge appears in grid. VIP filter shows only VIP customers."

```
Scenario 1: Mark customer as VIP
  Given User is on the customer edit page for a non-VIP customer
  When User turns on the VIP toggle
  And User saves the record
  Then a success message appears
  And the star badge is visible next to the customer name in the grid

Scenario 2: Unmark a VIP customer
  Given User is on the customer edit page for a VIP customer
  When User turns off the VIP toggle
  And User saves the record
  Then a success message appears
  And the star badge is no longer visible in the grid

Scenario 3: VIP filter shows only VIP customers
  Given User is on the customers grid
  And the grid contains both VIP and non-VIP customers
  When User turns on the VIP-only filter switch
  Then only customers with the star badge are displayed
  And the count reflects only the VIP customers
  [QUESTION: Does the filter persist on page reload, or reset to default?]
```

## What This Skill Does NOT Do

- **No test code.** This skill produces ticket text only. To implement the tests, invoke `/pw-kit:new-test` after the QA ticket is created.
- **No POM design.** No mention of page object methods or locators.
- **No file paths.** Where the tests will live is a separate decision.
- **No automation framework details.** The Gherkin text should be agnostic to Playwright/TypeScript specifics.

## Common Mistakes

| Mistake | Fix |
|---|---|
| Including code blocks in the output | Strip all code; this is for a QA ticket, not a developer ticket |
| One test case per data variant (10 scenarios for 10 inputs) | Merge with `[Data variants: ...]` annotation |
| Multiple `When` steps per scenario | Split into multiple scenarios |
| Generic step text like "User performs the action" | Use specific verbs: "User clicks Save", "User enters an invalid email" |
| Skipping the calibration phase | Always check what similar features look like before drafting |
| Filling in `[QUESTION:]` with a guess | Leave ambiguity flagged for the user; resolved questions become real step text |

## Further Reading


Additional reference docs (recipes, deep-dives, edge cases) will be added based on team feedback. PRs welcome.
