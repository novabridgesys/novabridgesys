import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import opentype from "opentype.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const fontsDir = path.join(root, ".fonts")
const outDir = path.join(root, "assets")

function loadFont(filename) {
  const buf = fs.readFileSync(path.join(fontsDir, filename))
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
}

const display = loadFont("BricolageGrotesque-Bold.ttf")
const mono = loadFont("IBMPlexMono-Text.ttf")

const palette = {
  light: {
    ink: "#212932",
    muted: "#5B6172",
    accent: "#004AAD",
    rule: "#E2E4EC",
  },
  dark: {
    ink: "#F6F7FB",
    muted: "#9AA6BA",
    accent: "#8C52FF",
    rule: "#3D4654",
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
  <rect x="${markX}" y="${markY}" width="7" height="7" fill="${c.accent}"/>
  <path d="${kicker.d}" fill="${c.muted}"/>
  <path d="${name.d}" fill="${c.ink}"/>
  <rect x="28" y="${ruleY}" width="${Math.max(name.width, 220).toFixed(2)}" height="1" fill="${c.accent}"/>
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
  <path d="${idx.d}" fill="${c.accent}"/>
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
  <rect x="0" y="3" width="72" height="1" fill="${c.accent}"/>
  <rect x="80" y="3" width="640" height="1" fill="${c.rule}"/>
`,
  })
}

function statsCard(theme, stats) {
  const c = palette[theme]
  const rows = [
    ["Pull requests", stats.pullRequests],
    ["Contributions this year", stats.contributions],
    ["Repositories", stats.repositories],
  ]
  const rowSvg = rows
    .map(
      ([label, value], i) => {
        const y = 68 + i * 28
        return `<text x="20" y="${y}" fill="${c.muted}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12" letter-spacing="0.08em">${label.toUpperCase()}</text>
  <text x="380" y="${y}" text-anchor="end" fill="${c.ink}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="16">${value}</text>`
      }
    )
    .join("\n  ")
  const body = `  <title id="title">Nova Bridge GitHub activity</title>
  <rect x="12" y="22" width="7" height="7" fill="${c.accent}"/>
  <text x="24" y="29" fill="${c.muted}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" letter-spacing="0.12em">NOVA BRIDGE  /  ACTIVITY</text>
  <rect x="20" y="40" width="360" height="1" fill="${c.accent}"/>
  ${rowSvg}
`
  return svgWrap({ width: 400, height: 156, body })
}

function langsCard(theme, stats) {
  const c = palette[theme]
  const maxPct = Math.max(...stats.languages.map((lang) => lang.pct), 1)
  const rows = stats.languages
    .map((lang, i) => {
      const y = 68 + i * 26
      const barW = Math.max(4, (lang.pct / maxPct) * 168)
      return `<text x="20" y="${y}" fill="${c.ink}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12">${lang.name}</text>
  <rect x="148" y="${y - 10}" width="${barW.toFixed(1)}" height="6" fill="${c.accent}"/>
  <text x="380" y="${y}" text-anchor="end" fill="${c.muted}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12">${lang.pct}%</text>`
    })
    .join("\n  ")
  const height = 56 + stats.languages.length * 26
  const body = `  <title id="title">Nova Bridge languages</title>
  <rect x="12" y="22" width="7" height="7" fill="${c.accent}"/>
  <text x="24" y="29" fill="${c.muted}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" letter-spacing="0.12em">NOVA BRIDGE  /  LANGUAGES</text>
  <rect x="20" y="40" width="360" height="1" fill="${c.accent}"/>
  ${rows}
`
  return svgWrap({ width: 400, height, body })
}

fs.mkdirSync(outDir, { recursive: true })

const stats = JSON.parse(fs.readFileSync(path.join(outDir, "stats.json"), "utf8"))

const files = {
  "nb-masthead-light.svg": masthead("light"),
  "nb-masthead-dark.svg": masthead("dark"),
  "nb-rule-light.svg": rule("light"),
  "nb-rule-dark.svg": rule("dark"),
  "nb-label-about-light.svg": label("light", "01", "ABOUT"),
  "nb-label-about-dark.svg": label("dark", "01", "ABOUT"),
  "nb-label-stack-light.svg": label("light", "02", "STACK"),
  "nb-label-stack-dark.svg": label("dark", "02", "STACK"),
  "nb-label-work-light.svg": label("light", "03", "WORK"),
  "nb-label-work-dark.svg": label("dark", "03", "WORK"),
  "nb-label-connect-light.svg": label("light", "04", "CONNECT"),
  "nb-label-connect-dark.svg": label("dark", "04", "CONNECT"),
  "nb-stats-light.svg": statsCard("light", stats),
  "nb-stats-dark.svg": statsCard("dark", stats),
  "nb-langs-light.svg": langsCard("light", stats),
  "nb-langs-dark.svg": langsCard("dark", stats),
}

for (const [name, contents] of Object.entries(files)) {
  fs.writeFileSync(path.join(outDir, name), contents)
  console.log("wrote", name)
}
