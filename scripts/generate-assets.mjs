import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import opentype from "opentype.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const fontsDir = path.join(root, ".fonts")
const outDir = path.join(root, "assets")

const display = opentype.parse(
  fs.readFileSync(path.join(fontsDir, "Fraunces72ptSoft-SemiBold.ttf")).buffer
)
const mono = opentype.parse(
  fs.readFileSync(path.join(fontsDir, "IBMPlexMono-Text.ttf")).buffer
)

const palette = {
  light: {
    ink: "#1A1714",
    muted: "#6F675E",
    copper: "#9A6B3F",
    rule: "#C4B5A0",
  },
  dark: {
    ink: "#F2EDE6",
    muted: "#A8A096",
    copper: "#D4A574",
    rule: "#5C5348",
  },
}

function roundPath(d) {
  return d.replace(/-?\d+\.\d+/g, (n) => Number.parseFloat(n).toFixed(2))
}

function drawText(font, text, x, y, size, tracking = 0) {
  let cursor = x
  const parts = []
  for (const ch of text) {
    const glyph = font.charToGlyph(ch)
    const glyphPath = glyph.getPath(cursor, y, size)
    const d = roundPath(glyphPath.toPathData(2))
    if (d) parts.push(d)
    cursor += (glyph.advanceWidth / font.unitsPerEm) * size + tracking
  }
  return { d: parts.join(" "), width: cursor - x }
}

function svgWrap({ width, height, body }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title">
${body}
</svg>
`
}

function masthead(theme) {
  const c = palette[theme]
  const kicker = drawText(mono, "NOVA BRIDGE TECHNOLOGIES  /  LOS ANGELES", 28, 36, 11, 1.15)
  const name = drawText(display, "Angel Cruz", 28, 96, 54, 0)
  const width = Math.ceil(Math.max(kicker.width, name.width) + 56)
  const height = 126
  const ruleY = 114
  const markX = 8
  const markY = 30

  const body = `  <title id="title">Angel Cruz</title>
  <rect x="${markX}" y="${markY}" width="7" height="7" fill="${c.copper}"/>
  <path d="${kicker.d}" fill="${c.muted}"/>
  <path d="${name.d}" fill="${c.ink}"/>
  <rect x="28" y="${ruleY}" width="${Math.max(name.width, 220).toFixed(2)}" height="1" fill="${c.copper}"/>
`

  return svgWrap({ width, height, body })
}

function label(theme, index, text) {
  const c = palette[theme]
  const idx = drawText(mono, index, 0, 16, 12, 1.4)
  const title = drawText(mono, text, idx.width + 14, 16, 12, 1.8)
  const width = Math.ceil(idx.width + 14 + title.width + 4)
  const height = 22
  const body = `  <title id="title">${text}</title>
  <path d="${idx.d}" fill="${c.copper}"/>
  <path d="${title.d}" fill="${c.muted}"/>
`
  return svgWrap({ width, height, body })
}

function rule(theme) {
  const c = palette[theme]
  return svgWrap({
    width: 720,
    height: 8,
    body: `  <title id="title">rule</title>
  <rect x="0" y="3" width="72" height="1" fill="${c.copper}"/>
  <rect x="80" y="3" width="640" height="1" fill="${c.rule}"/>
`,
  })
}

fs.mkdirSync(outDir, { recursive: true })

const files = {
  "masthead-light.svg": masthead("light"),
  "masthead-dark.svg": masthead("dark"),
  "rule-light.svg": rule("light"),
  "rule-dark.svg": rule("dark"),
  "label-about-light.svg": label("light", "01", "ABOUT"),
  "label-about-dark.svg": label("dark", "01", "ABOUT"),
  "label-stack-light.svg": label("light", "02", "STACK"),
  "label-stack-dark.svg": label("dark", "02", "STACK"),
  "label-work-light.svg": label("light", "03", "WORK"),
  "label-work-dark.svg": label("dark", "03", "WORK"),
  "label-connect-light.svg": label("light", "04", "CONNECT"),
  "label-connect-dark.svg": label("dark", "04", "CONNECT"),
}

for (const [name, contents] of Object.entries(files)) {
  fs.writeFileSync(path.join(outDir, name), contents)
  console.log("wrote", name)
}
