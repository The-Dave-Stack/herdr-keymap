import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULTS, loadEffectiveKeys } from "../src/config.ts";

function testOverrideWinsOverDefault() {
  const dir = mkdtempSync(join(tmpdir(), "keymap-"));
  const path = join(dir, "config.toml");
  writeFileSync(path, '[keys]\nnew_tab = "prefix+shift+z"\n');
  const effective = loadEffectiveKeys(path);
  assert.equal(effective.new_tab, "prefix+shift+z");
  assert.equal(effective.close_pane, DEFAULTS.close_pane); // untouched default survives
}

function testMissingConfigFallsBackToDefaults() {
  const effective = loadEffectiveKeys(join(mkdtempSync(join(tmpdir(), "keymap-")), "missing.toml"));
  assert.deepEqual(effective, DEFAULTS);
  assert.equal(effective.previous_workspace, ""); // unset-by-default on stable
}

testOverrideWinsOverDefault();
testMissingConfigFallsBackToDefaults();
console.log("ok");
