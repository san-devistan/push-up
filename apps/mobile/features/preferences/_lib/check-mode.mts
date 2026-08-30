import assert from "node:assert/strict"

import { resolvePreferences } from "./mode.ts"
import type { Preferences } from "./storage.ts"

const phone = {
  appearance: "system",
  clockFormat: "24",
  language: "en",
} satisfies Preferences
const debug = {
  appearance: "dark",
  clockFormat: "12",
  language: "fr",
} satisfies Preferences

assert.equal(resolvePreferences(false, phone, debug), phone)
assert.equal(resolvePreferences(true, phone, debug), debug)

console.log("preference mode checks passed")
