import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const login = process.env.STATS_LOGIN || "novabridgesys"

function ghJson(args) {
  const raw = execFileSync("gh", args, { encoding: "utf8" })
  return JSON.parse(raw)
}

const data = ghJson([
  "api",
  "graphql",
  "-f",
  `query=query($login: String!) {
    user(login: $login) {
      pullRequests { totalCount }
      repositories(first: 50, ownerAffiliations: OWNER, isFork: false) {
        totalCount
        nodes {
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
            edges { size node { name } }
          }
        }
      }
      contributionsCollection {
        contributionCalendar { totalContributions }
      }
    }
  }`,
  "-f",
  `login=${login}`,
])

const user = data.data.user
const bytes = new Map()

for (const repo of user.repositories.nodes) {
  for (const edge of repo.languages.edges) {
    const name = edge.node.name === "PLpgSQL" ? "SQL" : edge.node.name
    if (["PowerShell", "Shell"].includes(name)) continue
    bytes.set(name, (bytes.get(name) || 0) + edge.size)
  }
}

const totalBytes = [...bytes.values()].reduce((sum, n) => sum + n, 0)
const languages = [...bytes.entries()]
  .map(([name, size]) => ({
    name,
    pct: totalBytes ? Math.round((size / totalBytes) * 1000) / 10 : 0,
  }))
  .sort((a, b) => b.pct - a.pct)
  .slice(0, 5)

const stats = {
  login,
  pullRequests: user.pullRequests.totalCount,
  contributions: user.contributionsCollection.contributionCalendar.totalContributions,
  repositories: user.repositories.totalCount,
  languages,
  fetchedAt: new Date().toISOString(),
}

fs.writeFileSync(path.join(root, "assets", "stats.json"), `${JSON.stringify(stats, null, 2)}\n`)
console.log("wrote assets/stats.json", stats)
