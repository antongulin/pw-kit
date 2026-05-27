# Date Input Recipes

Patterns for the date scenarios that come up most often.

## Date range (from / to)

```ts
const fromDate = `0101${page.thisYear}`;
const toDate = `1231${page.thisYear}`;
await page.typeDateValue(reportPage.startDateInput, fromDate);
await page.typeDateValue(reportPage.endDateInput, toDate);
await reportPage.clickSearchButton();
```

## Relative date (today + N days)

If the application accepts "X days from now" style relative dates:

```ts
const futureDate = page.getDateNDaysFromNow(30);   // e.g., '04142024'
await page.typeDateValue(scheduledJobPage.runOnInput, futureDate);
```

Or use the `futureDateString` fixture from the central registry, which is today + 3 days by default.

## Reading the current value to assert

For inputs that show the locale-formatted date:

```ts
const expected = page.formatDateByLocale(`0315${page.thisYear}`);
await expect(orderEditPage.startDateInput).toHaveValue(expected);
```

For inputs that show ISO format:

```ts
await expect(orderEditPage.startDateInput).toHaveValue(`${page.thisYear}-03-15`);
```

## Date picker calendar — clicking a day

Use the helpers provided by BasePage:

```ts
// Single date
await page.openDatePicker(orderEditPage.startDateInput);
await page.selectDateFromCalendar(`0315${page.thisYear}`);

// Date range
await page.openDateRange(orderEditPage.dateRangeContainer);
await page.selectDateRangeFromCalendar(
  `0101${page.thisYear}`,
  `1231${page.thisYear}`
);
```

`selectDateFromCalendar()` navigates day → month → year as needed by clicking month/year navigation buttons in the calendar popup, then clicks the day.

## Scheduler date

For Kendo-style scheduler toolbars:

```ts
await page.selectDateFromScheduler(
  `0315${page.thisYear}`,
  schedulerPage,
  schedulerPage.currentDateButton
);
```

This handles decade → year → month → day navigation in the toolbar's date picker.

## Asserting a date range filter result

If a grid is filtered by a date range, assert all visible rows fall in range:

```ts
const fromDate = `0101${page.thisYear}`;
const toDate = `1231${page.thisYear}`;
await page.typeDateValue(ordersPage.startDateFilter, fromDate);
await page.typeDateValue(ordersPage.endDateFilter, toDate);
await ordersPage.clickSearchButton();
await ordersPage.verifyIfGridContainsRecordsInRange('Order Date', fromDate, toDate);
```

## Validating "future date required"

```ts
test('PREFIX-NNNNN: Job end date must be in the future', async ({ jobEditPage }) => {
  await test.step('When User enters a past date', async () => {
    const pastDate = `0101${page.lastYear}`;
    await page.typeDateValue(jobEditPage.endDateInput, pastDate);
  });
  await test.step('Then a validation alert appears', async () => {
    await page.verifyValidationAlert(jobEditPage.endDateValidationAlert, 'End date must be in the future');
  });
});
```

## Random date for variety

```ts
const randomDate = page.getRandomDateInRange(
  Number(page.thisYear) - 2,
  Number(page.thisYear) + 2
);  // returns 'MM/DD/YYYY'
const digitsOnly = randomDate.replace(/\D/g, '');
await page.typeDateValue(input, digitsOnly);
```

## Locale-aware date strings

Different locales format dates differently. The skill uses the application's configured locale (`page.culture`) to convert:

```ts
// digits-only YYYY/MM/DD → locale string
const localized = page.formatDateByLocale(`${page.thisYear}0315`);
// en-US: "03/15/2024"
// en-GB: "15/03/2024"
// de-DE: "15.03.2024"
```

Never hardcode locale-specific date strings in assertions; always go through `formatDateByLocale()`.
