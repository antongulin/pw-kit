# Base Page Method Catalog

Reference list of recommended methods to implement on each base class. Use this as a checklist when authoring base classes — and as a lookup when deciding whether a method already exists.

## BasePage — Universal Foundation

### Properties (locators)

App frame: `userMenuButton`, `logoutButton`, `loadingIndicator`, `pageHeader`
Common buttons: `cancelButton`, `saveButton`, `saveAndCloseButton`, `deleteButton`, `duplicateButton`, `backButton`
Modal (scoped inside `[role="dialog"]`): `modalDialog`, `modalConfirmButton`, `modalCancelButton`, `modalCloseButton`, `modalDeleteButton`, `modalSaveButton`, `modalYesButton`, `modalNoButton`
Pagination: `firstPageButton`, `previousPageButton`, `nextPageButton`, `lastPageButton`, `currentPageButton`
Grid dynamic locators (use `gridPrefix`):
- `gridRowLocator(id)` → `data-testid="{prefix}-row-{id}"`
- `gridDetailsButtonLocator(id)` → `{prefix}-detailsBtn-{id}`
- `gridDeleteButtonLocator(id)` → `{prefix}-deleteBtn-{id}`
- `gridDuplicateButtonLocator(id)` → `{prefix}-duplicateBtn-{id}`
- `gridCheckboxLocator(id)` → `{prefix}-rowCheckbox-{id}`
- `gridColumnForRowLocator(id, column)` → row + column filter

Relative-year strings (populated by `initialize()`):
`thisYear`, `lastYear`, `yearBeforeLast`, `threeYearsAgo`, `nextYear`, `twoYearsHence`, etc.

### Methods — Navigation
- `visit(path)` — navigate to a path, wait for spinner
- `visitTab(tabName)` — click a tab by role/name, wait for spinner

### Methods — Forms
- `toggleSwitch(toBeEnabled: boolean, locator: Locator)` — idempotent; reads `aria-checked`, clicks only if state needs to change
- `filterSingleSelect(locator: Locator, option: string)` — open dropdown, scroll to option, click, press Tab
- `filterMultiSelectByLocator(options: string[], field: Locator)` — clear all, click each
- `unselectAll(multiSelectLocator)`, `selectAll(multiSelectLocator)`
- `getValuesFromDropdown(dropdownButton, closeAfter?)` — open and read all options
- `verifyDropdownContents(dropdownButton, content, contains?)` — assert option presence
- `verifyDropdownOptionsSortedAlphabetically(dropdownLocator)`
- `verifyValidationAlert(alert: Locator, alertText: string)` — clicks alert indicator, reads aria-labelledby, asserts text

### Methods — Dates
- `typeDateValue(dateLocator: Locator, dateString: string)` — **canonical date input**; uses `pressSequentially` with 50ms delay. Never use `fill()` for dates.
- `formatDateByLocale(dateString: string)` — convert `'yyyymmdd'` to locale-formatted string
- `getRelativeYear(years: number): string` — e.g., `getRelativeYear(-2)` returns year two ago
- `initialize()` — populates relative-year properties; call in `beforeEach`
- `getRandomDateInRange(startYear, endYear): string`
- `getFutureDate(daysToAdd?): Date`
- `formatDateToMMDDYYYY(date: Date): string`
- `isValidDateFormat(dateStr: string, isDateTime?: boolean): boolean`

### Methods — Random/utility
- `getRandomEmail(): string`
- `getRandomString(length?: number): string`
- `coinFlip(): boolean`
- `isNullOrEmpty(value): boolean`

### Methods — Loading / waiting
- `waitForSpinnerToDisappear()` — multi-strategy wait: domcontentloaded → loading indicators → animations → 150ms buffer
- `waitForElementWithRetry(locator, options?)` — retries with spinner wait between attempts

### Methods — Notifications
- `verifySuccess()` — reads last popup message, returns text, closes popup
- `verifyNotificationMessage(message: string)` — asserts visible, then closes
- `verifyNoNotificationMessage(message)` — asserts NOT visible
- `closePopups()` — close all visible popups

### Methods — Tables
- `sortByColumnName(columnName: string)` — click header, wait for spinner
- `getTotalVisibleRowsInCurrentPage(): Promise<number>`
- `getAllColumnValues(columnName, tableLocator?)` — returns `{ allRecords, inactiveRecords }`
- `verifyPaginationIsVisible(tableHasRows?: boolean)`

### Methods — Auth
- `relogin()`, `logout()`, `switchUserGroup(group: string)`

### Methods — Drag and drop
- `dragAndDrop(originSelector, destinationSelector)` — mouse-based drag primitive

### Methods — Action row
- `verifyActionRowOrder()` — asserts standard button order across the action row
- `clickCancelButton()`, `clickDeleteButton()`, `deleteAndConfirm()`, `deleteAndCancel()`

---

## BaseGridPage extends BasePage

### Properties
- `gridPrefix: string` (constructor param)
- `grid: Locator` — the table element, scoped to `data-testid="{gridPrefix}"`
- `searchButton`, `clearButton`, `addNewButton`, `refreshButton`
- `mineOnlySwitch`, `activeOnlySwitch`
- Pagination: `firstPageButton`, `prevPageButton`, `nextPageButton`, `lastPageButton`, `currentPageText`
- `columnValues(columnName)` — all cells in column

### Methods — Search/Filter
- `filterSearch(description: string)` — **canonical full-search sequence**: fills input + Enter + clicks Search + waits for spinner
- `filterNoSearchButton(description: string)` — live-filter variant using pressSequentially
- `clickSearchButton()` — clicks and waits for spinner
- `clickClearButton()`, `clickRefreshButton()`, `clickAddNewButton()`

### Methods — Row actions
- `editRow(index: number)` — clicks edit on nth row (0-based)
- `editRowByDescription(description: string)`
- `deleteRow(description: string)` — searches first, then deletes
- `deleteRowNoSearch(description: string)`
- `duplicateRowByDescription(description: string)`
- `selectRow(index: number)` — clicks the row itself (for selection)

### Methods — Verification
- `verifyExists(value: string)` — assert visible
- `verifyNotExists(value: string, locator?: Locator)` — assert hidden
- `verifyAddNewButton(description: string)` — visible + enabled + correct label
- `verifyColumnIsSorted(columnName, ascending?, isNumeric?, isDate?)`
- `verifyDetailRowsAreSortedWithinGroups(columnName, ascending?)` — grouped grids
- `verifyGridDataColumn(columnName, searchText)` — every row matches
- `verifyGridColumnNames(gridLocator, columnNames)` — exact column headers
- `verifyGridColumnTooltip(columnName)` — standard tooltip assertions (Edit, Delete, Duplicate, Reorder)
- `verifyNoRecordsFound()`
- `verifyInactiveColumn(activeOnly: boolean)`, `verifyMineOnlyFilter(mineOnly: boolean)`
- `verifyIfGridContainsRecordsInRange(columnName, startDate?, endDate?)` — date range
- `verifyColumnContentsAreNotLinks(columnName)` — for permission tests

### Methods — Permission states
- `verifyViewOnlyRightsState()`
- `verifyAddEditDeleteRightsState()`
- `verifyAddRightsState()`, `verifyEditRightsState()`, `verifyDeleteRightsState()`

### Methods — Rankable grid (if applicable)
- `dragTargetToPosition(record, toIndex)`
- `verifyRankableGridEditRightsState()`, `verifyRankableGridViewOnlyRightsState()`

---

## BaseEditPage extends BasePage

### Properties
- `moduleName: string`, `formName: string` (constructor params for data loading)
- `editHeader: Locator` — the "Adding..." / "Editing..." header
- `auditRow: Locator` — audit information row at bottom of form
- `descriptionInput`, `notesInput` (common form fields)
- `inactiveSwitch` (active/inactive toggle)

### Methods — Save variants (each is a distinct UX flow)
- `save()` — primary save, stays on page; waits for success popup
- `saveAndClose()` — save and return to grid
- `saveAndConfirm()` — save + click Yes in confirmation modal
- `saveAndCloseAndConfirm()` — save & close + confirm
- `saveAndCancel()` — trigger save, click Cancel in confirmation (rollback test)
- `cancelAndDontSave()` — cancel + Don't Save in unsaved-changes modal
- `back()` — back navigation; warns if unsaved changes

### Methods — Tab navigation
- `visitTab(tabName: string)` — inherited from BasePage
- `getActiveTab(): Promise<string>`
- `getTabPosition(tabName: string): Promise<number>`

### Methods — State verification
- `verifySaveIsAvailable()`, `verifySaveIsNotAvailable()`
- `verifyRecordIsSaved(description)` — assert `"{description} Saved."`
- `verifyRecordIsCopied(description)`
- `verifyRecordIsDeleted(description)`
- `verifySuccessMessageCreated(description)`, `verifySuccessMessageUpdated`, `verifySuccessMessageInactivated`, `verifySuccessMessageActivated`
- `getRecordId(): Promise<string>` — parses audit row for `ID: N`

### Methods — Validation
- `verifyMissingRequiredFieldRecordCreation()`
- `verifyButtonsWhenUnsetSetFields(fields)` — iterates required fields, clears each, asserts buttons disabled, restores, asserts enabled

### Methods — Delete
- `deleteAndConfirm()` — click Delete + click Yes in confirm modal
- `verifyDeleteOnlyOnEdit()` — assert Delete visible only when editing, not when adding
- `verifyDuplicateOnlyOnEdit()`
