import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hhmmToFormParts } from "./time.js";

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
