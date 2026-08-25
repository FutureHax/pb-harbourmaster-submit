import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hhmmToFormParts, shortTimeZoneName } from "./time.js";

describe("hhmmToFormParts", () => {
  it("maps midnight to 12 AM", () => {
    assert.deepEqual(hhmmToFormParts("00:00"), {
      hour12: 12,
      minute: "00",
      period: "AM",
    });
  });

  it("maps noon to 12 PM", () => {
    assert.deepEqual(hhmmToFormParts("12:00"), {
      hour12: 12,
      minute: "00",
      period: "PM",
    });
  });

  it("maps afternoon hours without leading zero", () => {
    assert.deepEqual(hhmmToFormParts("16:00"), {
      hour12: 4,
      minute: "00",
      period: "PM",
    });
  });

  it("maps morning hours and minutes", () => {
    assert.deepEqual(hhmmToFormParts("11:30"), {
      hour12: 11,
      minute: "30",
      period: "AM",
    });
  });

  it("maps 13:05 to 1 PM", () => {
    assert.deepEqual(hhmmToFormParts("13:05"), {
      hour12: 1,
      minute: "05",
      period: "PM",
    });
  });

  it("rejects invalid input", () => {
    assert.throws(() => hhmmToFormParts("25:00"));
    assert.throws(() => hhmmToFormParts("12"));
  });
});

describe("shortTimeZoneName", () => {
  it("uses the daylight abbreviation for a summer session", () => {
    assert.equal(
      shortTimeZoneName("2026-09-10T22:00:00.000Z", "America/New_York"),
      "EDT",
    );
  });

  it("uses the standard abbreviation for a winter session", () => {
    assert.equal(
      shortTimeZoneName("2026-01-15T23:00:00.000Z", "America/New_York"),
      "EST",
    );
  });

  it("rejects invalid input", () => {
    assert.throws(() => shortTimeZoneName("not-a-date", "America/New_York"));
  });
});
