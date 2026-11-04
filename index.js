// dsh-taste-skill — DeepSeek Harness plugin layer.
//
// Registers tasteskill v2 (skill name: design-taste-frontend) as a native DSH skill.
// The skill payload ships inside this package under skills/design-taste-frontend/, and is
// exposed through `resourceBase` so relative paths in the instructions resolve.
//
// What this layer adds to the upstream skill: the host facts DSH can know and the model
// would otherwise have to guess — the absolute skill directory, a Node 22+ interpreter,
// the draw-history location inside the workspace, and a load-time browser probe.

import { readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

// The inspector's own locator, reused so the plugin note and the script can never disagree.
import { findChrome } from './skills/design-taste-frontend/scripts/lib/cdp.mjs'

export const name = 'taste-skill'
export const inject = ['skills']

const SKILL_NAME = 'design-taste-frontend'
const SKILL_DIR = fileURLToPath(new URL('./skills/design-taste-frontend/', import.meta.url)).replace(/[\\/]+$/, '')
const SKILL_MD = join(SKILL_DIR, 'SKILL.md')

// Catalog summary (rendered to the model, capped at 500 chars by dsh-tool-skill).
const DESCRIPTION =
  'Use when building, designing, redesigning, restyling, polishing or reviewing a public-facing web page (landing page, marketing site, portfolio, product page, one-pager, hero) or an app screen (dashboard, admin, analytics, settings, inbox), in any stack. Deals a researched art direction instead of the average landing page, finds real openly licensed pictures, enforces a strict no-slop house style, and checks the result in a real browser.'

const WHEN_TO_USE =
  'The user wants a page or app screen designed, redesigned, restyled, polished or reviewed, or says it looks generic, templated, "AI-made", sloppy, or asks for premium / award-level / designed-looking work.'

function present(path) {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

/** Pick the newest available Node (the inspector needs >= 22 for its built-in WebSocket). */
function resolveNode() {
  const version = process.versions?.node ?? '0.0.0'
  const major = Number.parseInt(version.split('.')[0] ?? '0', 10)
  if (process.env.TASTE_SKILL_NODE && present(process.env.TASTE_SKILL_NODE)) {
    return { path: process.env.TASTE_SKILL_NODE, source: 'TASTE_SKILL_NODE' }
  }
  if (process.versions?.electron === undefined && major >= 22) {
    return { path: process.execPath, source: `host process, Node ${version}` }
  }
  const bundled = join(
    homedir(),
    '.dsh',
    'dsh-runtimes',
    'dsh-primary-runtime',
    'dependencies',
    'node',
    'bin',
    'node',
  )
  if (present(bundled)) return { path: bundled, source: 'DSH bundled runtime' }
  const appRuntime =
    '/Applications/DeepSeek Harness.app/Contents/Resources/runtime/primary-runtime/dependencies/node/bin/node'
  if (present(appRuntime)) return { path: appRuntime, source: 'DSH app runtime' }
  return null
}

/** Probe for Chrome/Edge/Chromium without starting it. */
function probeBrowser() {
  try {
    return findChrome()
  } catch {
    return null
  }
}

function stripFrontmatter(markdown) {
  if (!markdown.startsWith('---')) return markdown
  const end = markdown.indexOf('\n---', 3)
  return end === -1 ? markdown : markdown.slice(end + 4).trimStart()
}

function runtimeNote() {
  const skillDir = SKILL_DIR.split(sep).join('/')
  const node = resolveNode()
  const browser = probeBrowser()
  const nodeLine = node
    ? `\`${node.path.split(sep).join('/')}\` (${node.source})`
    : 'not resolved at load time'
  const browserLine = browser
    ? `a browser was found at \`${browser.split(sep).join('/')}\`.`
    : '**no Chrome / Edge / Chromium was found at load time.**'
  return [
    '---',
    '',
    '## DSH runtime (DeepSeek Harness)',
    '',
    'This skill runs inside DeepSeek Harness. The facts below replace guessing about the host; they do not change the run.',
    '',
    `- **This skill's folder.** The \`<skill>\` in every command above is exactly this directory: \`${skillDir}\`. Resolve \`references/\`, \`scripts/\`, \`library/\` and \`assets/\` against it. The session workspace — your current working directory — is where the built page and \`.taste-skill/\` go.`,
    `- **Node.** Every script needs Node 22+ (the inspector uses Node's built-in WebSocket; Node 20 cannot run it). Use ${nodeLine}. If \`node -v\` prints 20 or older, call the scripts with that absolute path instead, for example \`"${node ? node.path.split(sep).join('/') : '<node>'}" "${skillDir}/scripts/draw.mjs" --list sectors\`. If no path is listed above, call \`load_workspace_dependencies\` and use the \`node\` path it returns.`,
    '- **Working files.** Run the commands from the session workspace; the direction sheet, screenshots and draw history all land in `.taste-skill/` there. Never write outside the workspace.',
    `- **Browser.** \`inspect.mjs\` and \`scenes.mjs\` drive an installed Chrome / Edge / Chromium over the DevTools protocol. On this host, ${browserLine} Probe again before you rely on it: \`"${node ? node.path.split(sep).join('/') : '<node>'}" "${skillDir}/scripts/browser-check.mjs"\`. If it exits 1, follow **No Chrome or Node 22** below: run \`lint.mjs\`, say in the report that the inspector could not run, and tell the user to install Chrome / Chromium or point \`CHROME_PATH\` at an existing executable.`,
    '- **Looking at your own work.** Open the screenshots the inspector writes with the `read_image` tool — do not describe them from memory or from a text dump of the report.',
    '- **Delivery.** Keep the page and its screenshots in the workspace; hand the main file over with `present` and keep the images out of the reply unless the user asks.',
    '- **Network.** Only `assets.mjs` needs it (open image and footage collections). Nothing installs and no API key is used.',
    '',
  ].join('\n')
}

/**
 * Mount the skill.
 * @param ctx - Cordis context carrying the skill registry.
 */
export function apply(ctx) {
  const body = stripFrontmatter(readFileSync(SKILL_MD, 'utf8'))
  ctx.skills.register({
    name: SKILL_NAME,
    description: DESCRIPTION,
    whenToUse: WHEN_TO_USE,
    // `source` and `provider` are validated on load, not on registration: the catalog lists a skill
    // without them, but `skill(name)` throws "loaded skill <name> source must be a string" if the
    // runtime registration does not carry a source label.
    source: 'plugin',
    content: `${body.trimEnd()}\n\n${runtimeNote()}`,
    resourceBase: { kind: 'directory', path: SKILL_DIR.split(sep).join('/') },
  })
}
