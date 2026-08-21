import { execFile } from "node:child_process"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import { formatNumber, oklchToHsl } from "./design-system/color.mjs"
import { importAppliedTokens } from "./design-system/extract-applied-tokens.mjs"
import {
  COLOR_TOKENS,
  FONT_WEIGHT,
  expectRecord,
  validateTokens,
} from "./design-system/tokens.mjs"

const execFileAsync = promisify(execFile)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const TOKENS_FILE = path.join(ROOT, "packages/ui/src/tokens/design-tokens.json")
const WEB_CSS = path.join(ROOT, "packages/ui/src/styles/globals.css")
const MOBILE_CSS = path.join(ROOT, "apps/mobile/global.css")
const MOBILE_THEME = path.join(ROOT, "apps/mobile/lib/theme.ts")

function parseArgs(argv) {
  const options = {
    importAppliedCss: "auto",
  }

  for (const arg of argv) {
    if (arg === "--") {
      continue
    }

    if (arg === "--import-applied-css") {
      options.importAppliedCss = "always"
      continue
    }

    if (arg === "--no-import-applied-css") {
      options.importAppliedCss = "never"
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return options
}

async function hasGitChanges(filePath) {
  const relativePath = path.relative(ROOT, filePath)

  try {
    const { stdout } = await execFileAsync(
      "git",
      ["status", "--porcelain", "--", relativePath],
      { cwd: ROOT }
    )

    return stdout.trim().length > 0
  } catch {
    return false
  }
}

async function shouldImportAppliedCss(mode, generatedWebCss) {
  if (mode === "always") {
    return true
  }

  if (mode === "never") {
    return false
  }

  const currentWebCss = await readFile(WEB_CSS, "utf8")

  if (currentWebCss === generatedWebCss) {
    return false
  }

  const [tokensChanged, webCssChanged] = await Promise.all([
    hasGitChanges(TOKENS_FILE),
    hasGitChanges(WEB_CSS),
  ])

  if (tokensChanged) {
    if (webCssChanged) {
      console.warn(
        [
          "Both design-tokens.json and globals.css have uncommitted changes.",
          "Using design-tokens.json as the source of truth.",
          "Use --import-applied-css to accept globals.css instead.",
        ].join(" ")
      )
    }

    return false
  }

  return webCssChanged
}

async function readTokens() {
  const tokenJson = await readFile(TOKENS_FILE, "utf8")

  return validateTokens(JSON.parse(tokenJson))
}

function toCamelCase(token) {
  return token.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase())
}

function formatPropertyName(name) {
  return /^[A-Za-z_$][\w$]*$/u.test(name) ? name : JSON.stringify(name)
}

function formatTsValue(value, indent = 0) {
  if (typeof value === "string") {
    return JSON.stringify(value)
  }

  if (typeof value === "number") {
    return value.toString()
  }

  const record = expectRecord(value, "generated value")
  const indentation = " ".repeat(indent)
  const childIndentation = " ".repeat(indent + 2)
  const lines = ["{"]

  for (const [name, childValue] of Object.entries(record)) {
    lines.push(
      `${childIndentation}${formatPropertyName(name)}: ${formatTsValue(
        childValue,
        indent + 2
      )},`
    )
  }

  lines.push(`${indentation}}`)

  return lines.join("\n")
}

function pxToRem(value) {
  return `${formatNumber(value / 16)}rem`
}

function buildMobileColors(colors) {
  return Object.fromEntries(
    COLOR_TOKENS.map((token) => [token, oklchToHsl(colors[token])])
  )
}

function buildMobileColorVars(colors) {
  return Object.fromEntries(
    COLOR_TOKENS.map((token) => [`color-${token}`, `hsl(${colors[token]})`])
  )
}

function buildCssVars(vars, indent = 4) {
  const spaces = " ".repeat(indent)

  return Object.entries(vars)
    .map(([name, value]) => `${spaces}--${name}: ${String(value)};`)
    .join("\n")
}

function buildColorVars(colors) {
  return Object.fromEntries(COLOR_TOKENS.map((token) => [token, colors[token]]))
}

function buildRadiusVars(radius) {
  return {
    radius: radius.base,
    ...Object.fromEntries(
      Object.entries(radius.scale).map(([name, value]) => [
        `radius-${name}`,
        value,
      ])
    ),
  }
}

function buildFontVars(fonts) {
  return {
    "font-heading": fonts.web.heading,
    "font-mono": fonts.web.mono,
    "font-sans": fonts.web.sans,
  }
}

function buildMobileFontVars(fonts) {
  return {
    "font-bold": fonts.mobile.bold,
    "font-extrabold": fonts.mobile.extrabold,
    "font-heading": fonts.mobile.heading,
    "font-medium": fonts.mobile.medium,
    "font-mono": fonts.mobile.mono,
    "font-normal": fonts.mobile.regular,
    "font-sans": fonts.mobile.sans,
    "font-semibold": fonts.mobile.semibold,
  }
}

function buildMobileRadiusVars(radius) {
  const base = Number.parseFloat(radius.base) * 16

  return {
    "radius-xs": `${formatNumber(base * 0.4)}px`,
    ...Object.fromEntries(
      Object.entries(radius.scale).map(([name, value]) => {
        const factor = value.match(/\*\s*([\d.]+)\)/u)?.[1]
        const pixels = value === "var(--radius)" ? base : base * Number(factor)

        return [`radius-${name}`, `${formatNumber(pixels)}px`]
      })
    ),
  }
}

function buildMotionVars(motion) {
  return {
    ...Object.fromEntries(
      Object.entries(motion.durationMs).map(([name, value]) => [
        `duration-${name}`,
        `${String(value)}ms`,
      ])
    ),
    ...Object.fromEntries(
      Object.entries(motion.easing).map(([name, value]) => [
        `ease-${name}`,
        value,
      ])
    ),
  }
}

function buildShadowVars(shadow) {
  return Object.fromEntries(
    Object.entries(shadow).map(([name, value]) => [`shadow-${name}`, value])
  )
}

function buildTypographyVars(typography) {
  return Object.fromEntries(
    Object.entries(typography).flatMap(([name, token]) => [
      [`text-${name}-size`, pxToRem(token.fontSize)],
      [`text-${name}-line-height`, pxToRem(token.lineHeight)],
      [`text-${name}-font-weight`, FONT_WEIGHT[token.font].toString()],
    ])
  )
}

function buildThemeInlineVars(tokens) {
  return {
    ...buildFontVars(tokens.fonts),
    ...Object.fromEntries(
      COLOR_TOKENS.map((token) => [`color-${token}`, `var(--${token})`])
    ),
    ...Object.fromEntries(
      Object.keys(tokens.radius.scale).map((name) => [
        `radius-${name}`,
        tokens.radius.scale[name],
      ])
    ),
    ...Object.fromEntries(
      Object.keys(tokens.shadow).map((name) => [
        `shadow-${name}`,
        tokens.shadow[name],
      ])
    ),
  }
}

function buildWebFontImports(fonts) {
  return Object.values(fonts.web)
    .map((font) => font.match(/["']([^"']+)["']/)?.[1])
    .filter(Boolean)
    .map((font) => ({
      family: font.replace(/\s+Variable$/, ""),
      variable: font.endsWith(" Variable"),
    }))
    .map(({ family, variable }) => ({
      packageName: family
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      variable,
    }))
    .filter(Boolean)
    .filter(
      (font, index, fontEntries) =>
        fontEntries.findIndex(
          (candidate) => candidate.packageName === font.packageName
        ) === index
    )
    .map(
      ({ packageName, variable }) =>
        `@import "@fontsource${variable ? "-variable" : ""}/${packageName}";`
    )
    .join("\n")
}

function buildWebCss(tokens) {
  const fontImports = buildWebFontImports(tokens.fonts)
  const rootVars = {
    ...buildColorVars(tokens.colors.light),
    ...buildRadiusVars(tokens.radius),
    ...buildMotionVars(tokens.motion),
    ...buildShadowVars(tokens.shadow),
    ...buildTypographyVars(tokens.typography),
  }

  return `@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
${fontImports}

@custom-variant dark (&:is(.dark *));
@source "../../../apps/**/*.{ts,tsx}";
@source "../../../components/**/*.{ts,tsx}";
@source "../**/*.{ts,tsx}";

@theme inline {
${buildCssVars(buildThemeInlineVars(tokens), 2)}
}

:root {
${buildCssVars(rootVars, 2)}
}

.dark {
${buildCssVars(buildColorVars(tokens.colors.dark), 2)}
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  button:not(:disabled),
  [role="button"]:not(:disabled) {
    cursor: pointer;
  }
}
`
}

function buildMobileCss(tokens, lightTheme, darkTheme) {
  const themeVars = buildMobileFontVars(tokens.fonts)
  const radiusVars = buildMobileRadiusVars(tokens.radius)

  return `@import "tailwindcss";
@import "uniwind";
@import "panelui-native/theme.css";

@source "./app/**/*.{ts,tsx}";
@source "./components/**/*.{ts,tsx}";
@source "./features/**/*.{ts,tsx}";
@source "./hooks/**/*.{ts,tsx}";
@source "./lib/**/*.{ts,tsx}";
@source "./node_modules/panelui-native/src";

@theme {
${buildCssVars(themeVars, 2)}
  --radius-4xl: unset;
}

@layer theme {
  :root {
    @variant light {
${buildCssVars(buildMobileColorVars(lightTheme), 6)}
${buildCssVars(radiusVars, 6)}
    }

    @variant dark {
${buildCssVars(buildMobileColorVars(darkTheme), 6)}
${buildCssVars(radiusVars, 6)}
    }
  }
}
`
}

function buildThemeObject(theme, radius) {
  return [
    ...COLOR_TOKENS.map(
      (token) => `    ${toCamelCase(token)}: "hsl(${theme[token]})",`
    ),
    `    radius: "${radius.base}",`,
  ].join("\n")
}

function buildThemeTs(tokens, lightTheme, darkTheme) {
  return `import { DarkTheme, DefaultTheme, type Theme } from "expo-router"

export const FONT_FAMILY = ${formatTsValue(tokens.fonts.mobile)} as const

export const THEME = {
  light: {
${buildThemeObject(lightTheme, tokens.radius)}
  },
  dark: {
${buildThemeObject(darkTheme, tokens.radius)}
  },
} as const

export type ThemeName = keyof typeof THEME

export const NAV_THEME: Record<ThemeName, Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
}
`
}

const options = parseArgs(process.argv.slice(2))
let tokens = await readTokens()

if (
  await shouldImportAppliedCss(options.importAppliedCss, buildWebCss(tokens))
) {
  const changes = await importAppliedTokens({
    tokensFile: TOKENS_FILE,
    webCss: WEB_CSS,
  })

  if (changes.length > 0) {
    console.log(`Imported ${changes.length} token paths from globals.css`)
    tokens = await readTokens()
  }
}

const lightTheme = buildMobileColors(tokens.colors.light)
const darkTheme = buildMobileColors(tokens.colors.dark)

await writeFile(WEB_CSS, buildWebCss(tokens))
await writeFile(MOBILE_CSS, buildMobileCss(tokens, lightTheme, darkTheme))
await writeFile(MOBILE_THEME, buildThemeTs(tokens, lightTheme, darkTheme))
await execFileAsync(
  "pnpm",
  ["exec", "oxfmt", WEB_CSS, MOBILE_CSS, MOBILE_THEME],
  {
    cwd: ROOT,
  }
)
