# Gap Analysis Checklist (Phase 7)

Walk this checklist after the test passes and the pre-PR checklist is clean. Present findings in the structured table format below.

## Categories to Check

### 1. Untested UI Controls
Look at the page under test and list every interactive control. Mark each as Tested / Not tested / Out of scope.

- Switches (toggle behavior, default state, conditional enable/disable)
- Dropdowns (selection, search, sort order, inactive option visibility)
- Buttons (action behavior, disabled states, tooltips)
- Input fields (validation, max length, special characters)
- Checkboxes / radio buttons
- Date pickers (manual entry, calendar picker, range selection)
- Tabs (if applicable, each tab's content)
- Pagination controls (next/prev/first/last/page-size)

### 2. Boundary Conditions
- Empty values (required field left blank → validation appears)
- Maximum length values (`'A'.repeat(255)` → save succeeds)
- Special characters (`& < > " '` → round-trip fidelity)
- Whitespace handling (leading/trailing trimmed?)
- Numeric extremes (0, negative, very large)
- Date extremes (far past, far future, leap year, DST boundary)

### 3. Empty / Zero-Data States
- Zero records: what does the user see? Empty-state messaging? Filter cleared?
- Search with no matches: correct empty message?
- Newly created entity with no associations yet?

### 4. Data Variants
- Active vs inactive records
- Records owned by current user vs other users
- Records with vs without optional fields populated
- Different locale formats (en-US, en-GB, de-DE, etc.) if applicable
- Different permission levels (admin sees X, regular user sees Y)

### 5. Weak Assertions
For each `test.step`:
- Does a `Then` step actually assert something with `expect`?
- Is the assertion specific (`toHaveText('Saved')`) or vague (`toBeVisible()`)?
- Are negative cases tested too (record disappears when filtered out)?

### 6. Error States (where testable)
- Invalid input → validation error appears, error message text is correct?
- Save with conflicting data → conflict error?
- Delete confirmation cancelled → record still exists?

(Do not mock the primary application API to simulate server errors — only mock external/third-party services.)

### 7. Cleanup Edge Cases
- What if create succeeds but a follow-up step fails — does cleanup still run?
- What if cleanup itself fails — is there a log/warning?
- Does cleanup work in parallel runs (unique data identifiers)?

### 8. Permission-Adjacent Tests
- Does this feature need permission tests? (If yes, they belong in `tests/user-group-permissions/`, not this file.)
- View-only state, add-only, edit-only, delete-only, full rights?

## Presentation Format

After walking the checklist, present findings as a table:

```
| Gap | Type | Rationale | Recommend |
|---|---|---|---|
| Inactive switch behavior not tested | UI control | Switch exists but no test asserts toggling effect | Add scenario or TODO |
| Empty grid state untested | Empty state | What does user see with zero rows? | New test in same file |
| `Then` step has no expect on cleanup verify | Weak assertion | Step body is empty | Add assertion or remove step |
| Permission tests for this feature | Permissions | Add/edit/delete rights testing not present | Create test in tests/user-group-permissions/ |
```

If **no gaps**, say so explicitly:

> Gap analysis complete. No untested controls, boundary conditions, empty states, or weak assertions identified. All ticket scenarios fully covered.

## Decision per Gap

For each gap, ask the user:

1. **Add to current test file** — implement now, extend the current PR.
2. **New test file in same feature** — implement now in a new file (e.g., `users-filters-test.spec.ts`).
3. **Defer with TODO** — add a `// TODO: PREFIX-NNNNN — Gap: <description>` comment in the test file, create a follow-up ticket.
4. **Out of scope, no action** — note in the gap analysis summary that this gap is intentionally not addressed.

Document the user's decision per gap. Apply any decided code changes before considering the task complete.
