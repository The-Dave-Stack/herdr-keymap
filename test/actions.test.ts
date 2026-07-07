import assert from "node:assert/strict";
import { ACTIONS, CATEGORY_ORDER } from "../src/actions.ts";
import { DEFAULTS } from "../src/config.ts";

// every action in the palette must have a known default key, or a typo would
// silently render as "(unassigned)" instead of failing loudly.
function testAllActionsHaveADefault() {
  const missing = Object.keys(ACTIONS).filter((name) => !(name in DEFAULTS));
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

testAllActionsHaveADefault();
testAllCategoriesAreKnown();
testEveryActionBelongsToExactlyOneCategory();
console.log("ok");
