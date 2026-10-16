import { test } from "node:test";
import assert from "node:assert/strict";
import { PNG } from "pngjs";
import { pngFromSolidColor, pngFromTwoTone } from "../lib/texture-gen.mjs";

const PNG_SIGNATURE = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);

test("pngFromSolidColor produces a valid 16x16 PNG", () => {
  const buf = pngFromSolidColor("#8B5A2B");
  assert.ok(buf.subarray(0, 8).equals(PNG_SIGNATURE));
  const png = PNG.sync.read(buf);
  assert.equal(png.width, 16);
  assert.equal(png.height, 16);
});

test("pngFromTwoTone produces a valid 16x16 PNG", () => {
  const buf = pngFromTwoTone("#8B5A2B", "#5C3A1E");
  const png = PNG.sync.read(buf);
  assert.equal(png.width, 16);
  assert.equal(png.height, 16);
});

test("rejects malformed hex colors", () => {
  assert.throws(() => pngFromSolidColor("not-a-color"));
  assert.throws(() => pngFromTwoTone("#fff", "#5C3A1E"));
});
