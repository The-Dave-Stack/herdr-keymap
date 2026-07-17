import assert from "node:assert/strict";
import { ACTIONS, CATEGORY_ORDER } from "../src/actions.ts";
import { DEFAULTS } from "../src/config.ts";
import { HEADER } from "../src/herdr-cli.ts";

// every action in the palette must have a known default key, or a typo would
// silently render as "(unassigned)" instead of failing loudly.
function testAllActionsHaveADefault() {
  // noKey actions (agent category) are herdr commands, not keybindings, so
  // they intentionally have no DEFAULTS entry.
  const missing = Object.keys(ACTIONS).filter((name) => !ACTIONS[name].noKey && !(name in DEFAULTS));
  assert.deepEqual(missing, [], `ACTIONS entries missing from DEFAULTS: ${missing}`);
}

// every action's category must be a known one, or it would silently vanish
// from every category screen (nothing filters it in).
function testAllCategoriesAreKnown() {
  const unknown = Object.entries(ACTIONS)
    .filter(([, entry]) => !CATEGORY_ORDER.includes(entry.category))
    .map(([name]) => name);
  assert.deepEqual(unknown, [], `unknown categories on: ${unknown}`);
}

// the category screens partition ACTIONS — nothing lost, nothing duplicated.
function testEveryActionBelongsToExactlyOneCategory() {
  const total = Object.keys(ACTIONS).length;
  const sumPerCategory = CATEGORY_ORDER.reduce(
    (sum, cat) => sum + Object.values(ACTIONS).filter((e) => e.category === cat).length,
    0,
  );
  assert.equal(sumPerCategory, total);
}

// the special agent category carries commands, not keybindings — they must
// stay out of DEFAULTS, or they'd render a bogus key instead of "(cmd)".
function testNoKeyActionsAreNotInDefaults() {
  const leaked = Object.keys(ACTIONS).filter((n) => ACTIONS[n].noKey && n in DEFAULTS);
  assert.deepEqual(leaked, [], `noKey actions must not be in DEFAULTS: ${leaked}`);
}

// the header banner is a 3-line box naming the plugin (version filled in at
// runtime from herdr-plugin.toml; falls back to a bare name in tests).
function testHeaderIsABanner() {
  const lines = HEADER.split("\n");
  assert.equal(lines.length, 3, `header should be a 3-line box: ${JSON.stringify(HEADER)}`);
  assert.match(lines[1], /keymap/i, `header should name the plugin: ${lines[1]}`);
}

testAllActionsHaveADefault();
testAllCategoriesAreKnown();
testEveryActionBelongsToExactlyOneCategory();
testNoKeyActionsAreNotInDefaults();
testHeaderIsABanner();
console.log("ok");
