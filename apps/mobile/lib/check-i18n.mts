import assert from "node:assert/strict"

import { resolveLanguageTag, translate } from "./i18n.ts"

assert.equal(resolveLanguageTag("fr-FR"), "fr")
assert.equal(resolveLanguageTag("pt-BR"), "pt-BR")
assert.equal(resolveLanguageTag("pt-PT"), "en")
assert.equal(resolveLanguageTag("zh-Hans-CN"), "zh-Hans")
assert.equal(resolveLanguageTag("zh-SG"), "zh-Hans")
assert.equal(resolveLanguageTag("zh-Hant-TW"), "en")
assert.equal(resolveLanguageTag("ar-SA"), "en")
assert.equal(translate("ja", "today.level", { level: 4 }), "レベル 4")

console.log("i18n checks passed")
