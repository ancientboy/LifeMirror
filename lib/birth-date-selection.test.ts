import assert from "node:assert/strict";
import test from "node:test";
import { parseBirthDate, updateBirthDatePart } from "./birth-date-selection.js";

test("keeps partial birthday selections until all three fields are complete", () => {
  const selectedYear = updateBirthDatePart(parseBirthDate(""), "year", 1992);
  assert.deepEqual(selectedYear.parts, { year: 1992, month: 0, day: 0 });
  assert.equal(selectedYear.value, null);

  const selectedMonth = updateBirthDatePart(selectedYear.parts, "month", 8);
  assert.deepEqual(selectedMonth.parts, { year: 1992, month: 8, day: 0 });
  assert.equal(selectedMonth.value, null);

  const selectedDay = updateBirthDatePart(selectedMonth.parts, "day", 13);
  assert.deepEqual(selectedDay.parts, { year: 1992, month: 8, day: 13 });
  assert.equal(selectedDay.value, "1992-08-13");
});

test("clamps an existing day when year or month changes", () => {
  const leapDay = parseBirthDate("2024-02-29");
  assert.deepEqual(updateBirthDatePart(leapDay, "year", 2023), {
    parts: { year: 2023, month: 2, day: 28 },
    value: "2023-02-28",
  });
});
