// Smoke test for the plugin layer: mount it against a fake registry and check the contract.
//
//   node test/smoke.mjs
//
// No framework, no dependencies. It proves the module exports what cordis expects, that
// ctx.skills.register receives a valid runtime skill, and that the injected DSH runtime note
// points at a real directory.
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const mod = await import(new URL('../index.js', import.meta.url).href)

const checks = []
const check = (label, condition, detail = '') => {
  checks.push({ label, ok: Boolean(condition), detail })
  if (!condition) {
    console.error(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  } else {
    console.log(`ok    ${label}`)
  }
}

check('exports a plugin name', typeof mod.name === 'string' && mod.name.length > 0, String(mod.name))
check('injects the skills service', Array.isArray(mod.inject) && mod.inject.includes('skills'))
check('exports apply()', typeof mod.apply === 'function')

const registered = []
const ctx = {
  skills: {
    register(skill) {
      registered.push(skill)
      return () => {}
    },
  },
  logger: { warn: console.warn, info: () => {}, error: console.error },
}

mod.apply(ctx)

check('registers exactly one skill', registered.length === 1, `got ${registered.length}`)
const skill = registered[0] ?? {}

check('skill name is kebab-case', /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill.name ?? ''), String(skill.name))
check('description present and under the 500-char catalog cap', typeof skill.description === 'string' && skill.description.length > 0 && skill.description.length <= 500, `${skill.description?.length ?? 0} chars`)
check('whenToUse is a string', typeof skill.whenToUse === 'string')
// dsh-skill validates these when the skill is LOADED, not when it is registered: a missing source
// still lists in the catalog and then fails `skill(name)` with "loaded skill ... source must be a string".
check('source is a non-empty string (load-time requirement)', typeof skill.source === 'string' && skill.source.length > 0, JSON.stringify(skill.source))
check('provider is a string when supplied', skill.provider === undefined || (typeof skill.provider === 'string' && skill.provider.length > 0), JSON.stringify(skill.provider))
check('invocation policy is valid when supplied', skill.invocation === undefined || (typeof skill.invocation === 'object' && skill.invocation !== null && typeof skill.invocation.modelInvocable === 'boolean' && typeof skill.invocation.userInvocable === 'boolean'))
check('content is the SKILL.md body', typeof skill.content === 'string' && skill.content.startsWith('# tasteskill v2'))
check('frontmatter stripped', !(skill.content ?? '').startsWith('---'))
check('content keeps the run sections', (skill.content ?? '').includes('### 7. Gate') && (skill.content ?? '').includes('## House rules'))
check('DSH runtime note appended', (skill.content ?? '').includes('## DSH runtime (DeepSeek Harness)'))
check('note names the resource directory', (skill.content ?? '').includes(skill.resourceBase?.path ?? '\u0000'))

const base = skill.resourceBase
check('resourceBase is a directory of this package', base?.kind === 'directory' && base.path.startsWith(root), base?.path)
check('resource base exists', Boolean(base?.path) && existsSync(base.path) && statSync(base.path).isDirectory())
check('SKILL.md ships with the payload', existsSync(join(base?.path ?? '', 'SKILL.md')))
check('references ship with the payload', existsSync(join(base?.path ?? '', 'references', 'critique.md')))
check('library ships with the payload', existsSync(join(base?.path ?? '', 'library', 'directions.json')))
check('scripts ship with the payload', existsSync(join(base?.path ?? '', 'scripts', 'inspect.mjs')))
check('browser-check helper ships with the payload', existsSync(join(base?.path ?? '', 'scripts', 'browser-check.mjs')))

// Mirror dsh-skill's LOAD-time validation (`validateDefinition`) on the definition the registry
// stores. register() fills the invocation and provider defaults, but `source` must already be there:
// without it the skill still lists in the catalog and then fails `skill(name)` with
// `loaded skill "<name>" source must be a string`. This assertion is the regression guard for that.
const loadDefinition = {
  ...skill,
  invocation: skill.invocation ?? { modelInvocable: true, userInvocable: true },
  provider: skill.provider ?? 'runtime',
}
const loadProblems = []
if (typeof loadDefinition.name !== 'string') loadProblems.push('name')
if (typeof loadDefinition.description !== 'string' || loadDefinition.description.length === 0) loadProblems.push('description')
if (typeof loadDefinition.source !== 'string') loadProblems.push('source')
if (typeof loadDefinition.provider !== 'string') loadProblems.push('provider')
if (typeof loadDefinition.content !== 'string') loadProblems.push('content')
check('passes dsh-skill load-time validation (source / provider / content)', loadProblems.length === 0, loadProblems.join(', '))

// The runtime note must not promise a browser this host does not have.
const hasChrome = /a browser was found at/.test(skill.content ?? '')
const noteSaysNoBrowser = /no Chrome \/ Edge \/ Chromium was found at load time/.test(skill.content ?? '')
check('browser probe is reported honestly', hasChrome !== noteSaysNoBrowser, hasChrome ? 'browser found' : 'no browser found')

const failed = checks.filter((c) => !c.ok)
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`)
if (failed.length > 0) process.exit(1)
