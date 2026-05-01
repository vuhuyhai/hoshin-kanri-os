/**
 * UI smoke test: /onboarding/setup-org form (M-OrgUX-1).
 * Verifies the form calls /api/orgs/check-similar and renders the
 * duplicate-warning interaction correctly.
 *
 * Run:  npx tsx scripts/smoke-test-orgs-setup-org-ui.ts
 *       DEBUG_HEADED=1 npx tsx scripts/smoke-test-orgs-setup-org-ui.ts
 *
 * Requires dev server on http://localhost:3000 and a seeded org named
 * "Ladysfit" in city "Hà Nội" for SCENARIO 3 to find a match.
 *
 * Submit endpoint is /api/settings/org (NOT /api/orgs/create) — the spec
 * file said /api/orgs/create but the actual handler in app/api/settings/org
 * is what the form posts to. We intercept the real one defensively, even
 * though the form's submit handler short-circuits before calling the API
 * when there are unacknowledged duplicates.
 */

import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
  type Route,
} from 'playwright'

// ---------- CONFIG ----------
const BASE_URL = 'http://localhost:3000'
const TEST_EMAIL = 'smoke-test-orgs-ui@hoshin-test.local'
const TEST_PASSWORD = 'SmokeTestPass123!@#'
const PROJECT_REF = 'cnbsrlhhgrfbdhisizgg'
const COOKIE_NAME = `sb-${PROJECT_REF}-auth-token`
const SCENARIO_TIMEOUT_MS = 30_000
const HEADED = process.env.DEBUG_HEADED === '1'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = resolve(__dirname, '..')
const ENV_PATH = resolve(REPO_ROOT, '.env.local')
const SCREENSHOT_DIR = resolve(REPO_ROOT, 'scripts', 'screenshots')

// ---------- TYPES ----------
type Env = {
  supabaseUrl: string
  serviceKey: string
  anonKey: string
}

type SupabaseSession = {
  access_token: string
  refresh_token: string
  expires_at?: number
  expires_in?: number
  token_type?: string
  user?: { id: string; email?: string }
}

type ScenarioResult = { id: number; name: string; pass: boolean; note?: string }

// ---------- LOG HELPERS ----------
const log = {
  header: (text: string) => console.log(`\n═══ ${text} ═══`),
  pre: (text: string, ok: boolean) =>
    console.log(`[PRE-CHECK] ${text}: ${ok ? '✅' : '❌'}`),
  scenario: (n: number, name: string) => console.log(`\n[SCENARIO ${n}] ${name}`),
  pass: (msg: string) => console.log(`  ✅ PASS — ${msg}`),
  fail: (msg: string) => console.log(`  ❌ FAIL — ${msg}`),
  info: (msg: string) => console.log(`  ${msg}`),
  err: (msg: string) => console.error(`  ⚠️  ${msg}`),
}

// ---------- ENV PARSING ----------
function parseEnvLocal(path: string): Env {
  if (!existsSync(path)) {
    throw new Error(`.env.local not found at ${path}`)
  }
  const content = readFileSync(path, 'utf8')
  const get = (key: string): string => {
    const re = new RegExp(`^${key}=(.*)$`, 'm')
    const m = content.match(re)
    if (!m) throw new Error(`Missing ${key} in .env.local`)
    return m[1].trim().replace(/^["']|["']$/g, '')
  }
  return {
    supabaseUrl: get('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: get('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceKey: get('SUPABASE_SERVICE_ROLE_KEY'),
  }
}

// ---------- SUPABASE HELPERS ----------
async function ensureTestUser(env: Env): Promise<void> {
  const res = await fetch(`${env.supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.serviceKey}`,
      'apikey': env.serviceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    }),
  })
  if (res.ok) return
  // 409/422/400 = already exists; treat as OK
  if ([400, 409, 422].includes(res.status)) return
  const body = await res.text()
  throw new Error(`admin create user failed HTTP ${res.status}: ${body.slice(0, 200)}`)
}

async function signIn(env: Env): Promise<SupabaseSession> {
  const res = await fetch(
    `${env.supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: { 'apikey': env.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    },
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`sign-in failed HTTP ${res.status}: ${body.slice(0, 200)}`)
  }
  const session = (await res.json()) as SupabaseSession
  if (!session.access_token || !session.user?.id) {
    throw new Error('sign-in response missing access_token or user.id')
  }
  return session
}

async function getOrgIdsForUser(
  env: Env,
  userId: string,
): Promise<string[]> {
  const res = await fetch(
    `${env.supabaseUrl}/rest/v1/org_members?select=org_id&user_id=eq.${userId}`,
    {
      headers: {
        'apikey': env.serviceKey,
        'Authorization': `Bearer ${env.serviceKey}`,
      },
    },
  )
  if (!res.ok) {
    throw new Error(`fetch org_members failed HTTP ${res.status}`)
  }
  const rows = (await res.json()) as Array<{ org_id: string }>
  return rows.map((r) => r.org_id)
}

async function deleteUserOrgs(env: Env, userId: string): Promise<number> {
  const orgIds = await getOrgIdsForUser(env, userId)
  if (orgIds.length === 0) return 0

  const memDel = await fetch(
    `${env.supabaseUrl}/rest/v1/org_members?user_id=eq.${userId}`,
    {
      method: 'DELETE',
      headers: {
        'apikey': env.serviceKey,
        'Authorization': `Bearer ${env.serviceKey}`,
        'Prefer': 'return=minimal',
      },
    },
  )
  if (!memDel.ok && memDel.status !== 204) {
    throw new Error(`delete org_members failed HTTP ${memDel.status}`)
  }

  const orgFilter = `id=in.(${orgIds.join(',')})`
  const orgDel = await fetch(
    `${env.supabaseUrl}/rest/v1/organizations?${orgFilter}`,
    {
      method: 'DELETE',
      headers: {
        'apikey': env.serviceKey,
        'Authorization': `Bearer ${env.serviceKey}`,
        'Prefer': 'return=minimal',
      },
    },
  )
  if (!orgDel.ok && orgDel.status !== 204) {
    throw new Error(`delete organizations failed HTTP ${orgDel.status}`)
  }
  return orgIds.length
}

async function promptYes(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((res) => {
    rl.question(question, (ans) => {
      rl.close()
      res(ans.trim().toLowerCase() === 'yes')
    })
  })
}

// ---------- COOKIE FORGE (matches @supabase/ssr) ----------
function base64UrlEncode(text: string): string {
  return Buffer.from(text, 'utf8')
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function forgeAuthCookieValue(session: SupabaseSession): string {
  return 'base64-' + base64UrlEncode(JSON.stringify(session))
}

// ---------- DEV SERVER PRECHECK ----------
async function pingDevServer(): Promise<boolean> {
  try {
    const res = await fetch(BASE_URL, { method: 'HEAD', redirect: 'manual' })
    return res.status === 200 || res.status === 307 || res.status === 308
  } catch {
    return false
  }
}

// ---------- PLAYWRIGHT HELPERS ----------
async function selectRadixOption(
  page: Page,
  triggerLocator: string,
  optionText: string,
): Promise<void> {
  await page.locator(triggerLocator).click()
  await page.getByRole('option', { name: optionText, exact: true }).click()
}

async function screenshot(page: Page, file: string): Promise<string> {
  if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true })
  const path = resolve(SCREENSHOT_DIR, file)
  await page.screenshot({ path, fullPage: true })
  return `scripts/screenshots/${file}`
}

// ---------- SCENARIOS ----------
async function scenario1FormLoads(page: Page): Promise<ScenarioResult> {
  log.scenario(1, 'Form loads correctly')
  try {
    await page.goto(`${BASE_URL}/onboarding/setup-org`, {
      waitUntil: 'networkidle',
      timeout: SCENARIO_TIMEOUT_MS,
    })
    const url = page.url()
    if (!url.includes('/onboarding/setup-org')) {
      log.fail(`redirected to ${url} — cookie injection likely failed`)
      const shot = await screenshot(page, '01-form-empty-FAIL.png')
      return { id: 1, name: 'Form loads', pass: false, note: shot }
    }
    // CardTitle renders as <div>, not <h*>, so role="heading" doesn't match.
    await page.getByText('Thiết lập công ty', { exact: true }).first().waitFor({
      timeout: 5_000,
    })
    // Assert M-OrgUX-1's duplicate-warning specifically isn't shown yet.
    // Avoids false positives from Sonner's announcer, Next dev indicator,
    // analytics overlays, etc.
    const warningCount = await page
      .locator('[role="alert"]:visible:has-text("công ty tương tự")')
      .count()
    if (warningCount > 0) {
      log.fail(`duplicate-warning rendered before any name typed`)
      const shot = await screenshot(page, '01-form-empty-FAIL.png')
      return { id: 1, name: 'Form loads', pass: false, note: shot }
    }
    const shot = await screenshot(page, '01-form-empty.png')
    log.pass(`screenshot: ${shot}`)
    return { id: 1, name: 'Form loads', pass: true, note: shot }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    log.fail(msg)
    const shot = await screenshot(page, '01-form-empty-ERR.png').catch(() => '')
    return { id: 1, name: 'Form loads', pass: false, note: shot }
  }
}

async function scenario2NoApiOnSingleChar(
  page: Page,
): Promise<ScenarioResult> {
  log.scenario(2, 'Type 1 char → no API call')
  let apiCalls = 0
  const handler = async (route: Route): Promise<void> => {
    apiCalls++
    await route.continue()
  }
  await page.route('**/api/orgs/check-similar', handler)
  try {
    await page.locator('#name').fill('L')
    await page.waitForTimeout(1_000)
    if (apiCalls === 0) {
      log.pass(`0 requests in 1000ms window`)
      return { id: 2, name: '1-char → no API', pass: true }
    }
    log.fail(`${apiCalls} requests fired (expected 0)`)
    return { id: 2, name: '1-char → no API', pass: false }
  } finally {
    await page.unroute('**/api/orgs/check-similar', handler)
    await page.locator('#name').fill('')
  }
}

async function scenario3WarningRenders(
  page: Page,
): Promise<ScenarioResult> {
  log.scenario(3, 'Type valid name + city default → API call + warning')
  let apiCalls = 0
  const handler = async (route: Route): Promise<void> => {
    apiCalls++
    await route.continue()
  }
  await page.route('**/api/orgs/check-similar', handler)
  try {
    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/orgs/check-similar') && r.request().method() === 'POST',
      { timeout: 5_000 },
    )
    await page.locator('#name').fill('Ladysfit')

    const response = await responsePromise
    if (response.status() !== 200) {
      log.fail(`API returned ${response.status()}`)
      const shot = await screenshot(page, '02-warning-shown-FAIL.png')
      return { id: 3, name: 'Warning renders', pass: false, note: shot }
    }
    const body = (await response.json()) as {
      hasMatches: boolean
      matches: Array<{ name: string; city: string; industry: string }>
    }
    if (!body.hasMatches || body.matches.length < 1) {
      log.fail(`API returned hasMatches=${body.hasMatches} matches=${body.matches.length} — Ladysfit/Hà Nội may not be seeded`)
      const shot = await screenshot(page, '02-warning-shown-NOMATCH.png')
      return { id: 3, name: 'Warning renders', pass: false, note: shot }
    }
    log.info(`API: hasMatches=${body.hasMatches}, matches=${body.matches.length}`)

    // Match by text to be consistent with SCENARIO 1 — avoids picking up
    // Sonner / Next dev indicator / analytics overlays that also use role=alert.
    const warning = page.locator('[role="alert"]:visible:has-text("công ty tương tự")')
    try {
      await warning.waitFor({ timeout: 2_000 })
    } catch {
      log.fail(`duplicate-warning element not visible after API match`)
      const shot = await screenshot(page, '02-warning-shown-NOWARN.png')
      return { id: 3, name: 'Warning renders', pass: false, note: shot }
    }
    const checkbox = page.locator('#ack-duplicate')
    if ((await checkbox.count()) !== 1) {
      log.fail(`ack-duplicate checkbox not found`)
      return { id: 3, name: 'Warning renders', pass: false }
    }
    if (await checkbox.isChecked()) {
      log.fail(`ack-duplicate checkbox checked by default (should be unchecked)`)
      return { id: 3, name: 'Warning renders', pass: false }
    }

    if (apiCalls < 1) {
      log.fail(`route handler counted ${apiCalls} calls (expected ≥1)`)
      return { id: 3, name: 'Warning renders', pass: false }
    }

    const shot = await screenshot(page, '02-warning-shown.png')
    log.pass(`alert visible, checkbox unchecked, screenshot: ${shot}`)
    return { id: 3, name: 'Warning renders', pass: true, note: shot }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    log.fail(msg)
    const shot = await screenshot(page, '02-warning-shown-ERR.png').catch(() => '')
    return { id: 3, name: 'Warning renders', pass: false, note: shot }
  } finally {
    await page.unroute('**/api/orgs/check-similar', handler)
  }
}

async function scenario4SubmitBlocked(
  page: Page,
): Promise<ScenarioResult> {
  log.scenario(4, 'Submit blocked without ack')
  let createCalls = 0
  const createHandler = async (route: Route): Promise<void> => {
    createCalls++
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ org: { id: 'mock-id' } }),
    })
  }
  // Real submit endpoint is /api/settings/org, not /api/orgs/create.
  await page.route('**/api/settings/org', createHandler)
  await page.route('**/api/orgs/create', createHandler)
  try {
    await selectRadixOption(
      page,
      'button[role="combobox"]:has-text("Chọn ngành nghề"), button[role="combobox"]:has-text("Fitness")',
      'Fitness',
    )

    const startUrl = page.url()
    const submitBtn = page.getByRole('button', { name: /Tạo công ty/i })
    await submitBtn.click()
    await page.waitForTimeout(1_000)

    const stillOnForm = page.url() === startUrl && page.url().includes('/onboarding/setup-org')
    if (!stillOnForm) {
      log.fail(`navigated to ${page.url()} (expected to stay on form)`)
      const shot = await screenshot(page, '03-submit-blocked-FAIL.png')
      return { id: 4, name: 'Submit blocked', pass: false, note: shot }
    }
    if (createCalls > 0) {
      log.fail(`create endpoint hit ${createCalls} time(s) (expected 0 — handler should short-circuit)`)
      const shot = await screenshot(page, '03-submit-blocked-LEAK.png')
      return { id: 4, name: 'Submit blocked', pass: false, note: shot }
    }
    // Sonner toast appears as li[data-sonner-toast]
    const toastFound = await page
      .locator('[data-sonner-toast], [role="status"]:has-text("xác nhận"), [role="alert"]:has-text("xác nhận")')
      .first()
      .waitFor({ timeout: 3_000 })
      .then(() => true)
      .catch(() => false)
    if (!toastFound) {
      log.fail(`expected toast/error mentioning 'xác nhận' not found`)
      const shot = await screenshot(page, '03-submit-blocked-NOTOAST.png')
      return { id: 4, name: 'Submit blocked', pass: false, note: shot }
    }
    const shot = await screenshot(page, '03-submit-blocked.png')
    log.pass(`stayed on form, no create call, toast shown: ${shot}`)
    return { id: 4, name: 'Submit blocked', pass: true, note: shot }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    log.fail(msg)
    const shot = await screenshot(page, '03-submit-blocked-ERR.png').catch(() => '')
    return { id: 4, name: 'Submit blocked', pass: false, note: shot }
  } finally {
    await page.unroute('**/api/settings/org', createHandler)
    await page.unroute('**/api/orgs/create', createHandler)
  }
}

async function scenario5SubmitAllowed(
  page: Page,
): Promise<ScenarioResult> {
  log.scenario(5, 'Submit allowed after ack')
  let createCalls = 0
  const createHandler = async (route: Route): Promise<void> => {
    createCalls++
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ org: { id: 'mock-id' } }),
    })
  }
  await page.route('**/api/settings/org', createHandler)
  await page.route('**/api/orgs/create', createHandler)
  try {
    const checkbox = page.locator('#ack-duplicate')
    await checkbox.check()
    if (!(await checkbox.isChecked())) {
      log.fail(`checkbox failed to check`)
      return { id: 5, name: 'Submit allowed', pass: false }
    }
    const submitBtn = page.getByRole('button', { name: /Tạo công ty|Đang tạo/i })
    await submitBtn.click()

    // Either nav away or button shows loading state
    const navOrLoading = await Promise.race([
      page
        .waitForURL((url) => !url.toString().includes('/onboarding/setup-org'), {
          timeout: 5_000,
        })
        .then(() => 'nav' as const)
        .catch(() => null),
      page
        .getByRole('button', { name: /Đang tạo/i })
        .waitFor({ timeout: 5_000 })
        .then(() => 'loading' as const)
        .catch(() => null),
    ])

    if (createCalls < 1) {
      log.fail(`create endpoint not hit after ack (expected ≥1, got ${createCalls})`)
      const shot = await screenshot(page, '04-submit-allowed-NOCALL.png')
      return { id: 5, name: 'Submit allowed', pass: false, note: shot }
    }
    if (!navOrLoading) {
      log.fail(`no navigation or loading state observed within 5s`)
      const shot = await screenshot(page, '04-submit-allowed-STUCK.png')
      return { id: 5, name: 'Submit allowed', pass: false, note: shot }
    }
    const shot = await screenshot(page, '04-submit-allowed.png')
    log.pass(`create called ${createCalls}× (mocked), state=${navOrLoading}, screenshot: ${shot}`)
    return { id: 5, name: 'Submit allowed', pass: true, note: shot }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    log.fail(msg)
    const shot = await screenshot(page, '04-submit-allowed-ERR.png').catch(() => '')
    return { id: 5, name: 'Submit allowed', pass: false, note: shot }
  } finally {
    await page.unroute('**/api/settings/org', createHandler)
    await page.unroute('**/api/orgs/create', createHandler)
  }
}

// ---------- MAIN ----------
async function main(): Promise<void> {
  log.header('UI Smoke Test /onboarding/setup-org (M-OrgUX-1)')

  // Pre-checks
  let env: Env
  try {
    env = parseEnvLocal(ENV_PATH)
    log.pre('Env vars loaded from .env.local', true)
  } catch (e) {
    log.pre('Env vars loaded from .env.local', false)
    log.err(e instanceof Error ? e.message : String(e))
    process.exit(1)
  }

  const alive = await pingDevServer()
  log.pre(`Dev server alive (${BASE_URL})`, alive)
  if (!alive) {
    log.err(`Run 'npm run dev' first.`)
    process.exit(1)
  }

  let session: SupabaseSession
  try {
    await ensureTestUser(env)
    session = await signIn(env)
    log.pre(`Test user signed in (${TEST_EMAIL})`, true)
  } catch (e) {
    log.pre(`Test user signed in (${TEST_EMAIL})`, false)
    log.err(e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
  const userId = session.user!.id

  // Cleanup any existing org for the test user (dry-run gated)
  let existingOrgs: string[] = []
  try {
    existingOrgs = await getOrgIdsForUser(env, userId)
  } catch (e) {
    log.err(`failed to query existing orgs: ${e instanceof Error ? e.message : String(e)}`)
    process.exit(1)
  }

  if (existingOrgs.length > 0) {
    console.log(`\n⚠️  Test user has ${existingOrgs.length} existing org(s). Will execute DELETE statements:`)
    console.log(`  DELETE FROM org_members WHERE user_id = '${userId}';`)
    console.log(`  DELETE FROM organizations WHERE id IN (${existingOrgs.map((id) => `'${id}'`).join(', ')});`)
    const confirmed = await promptYes('  Type "yes" to proceed: ')
    if (!confirmed) {
      log.err('User declined cleanup. Aborting — test requires no existing org.')
      process.exit(1)
    }
    const n = await deleteUserOrgs(env, userId)
    log.pre(`Test user org cleanup (deleted ${n})`, true)
  } else {
    log.pre('Test user org cleanup (none to delete)', true)
  }

  // Launch browser
  let browser: Browser | null = null
  let context: BrowserContext | null = null
  const results: ScenarioResult[] = []
  try {
    browser = await chromium.launch({ headless: !HEADED })
    context = await browser.newContext()

    const cookieValue = forgeAuthCookieValue(session)
    await context.addCookies([
      {
        name: COOKIE_NAME,
        value: cookieValue,
        url: BASE_URL,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])
    log.pre(`Auth cookie injected (${COOKIE_NAME}, ${cookieValue.length} chars)`, true)

    const page = await context.newPage()
    page.setDefaultTimeout(SCENARIO_TIMEOUT_MS)

    results.push(await scenario1FormLoads(page))
    if (results[0].pass) {
      results.push(await scenario2NoApiOnSingleChar(page))
      results.push(await scenario3WarningRenders(page))
      if (results[results.length - 1].pass) {
        results.push(await scenario4SubmitBlocked(page))
        results.push(await scenario5SubmitAllowed(page))
      } else {
        log.err('Skipping scenarios 4-5 (warning never rendered)')
      }
    } else {
      log.err('Skipping scenarios 2-5 (form did not load)')
    }
  } finally {
    if (context) await context.close().catch(() => {})
    if (browser) await browser.close().catch(() => {})
  }

  // Summary
  log.header('Summary')
  for (const r of results) {
    console.log(`  ${r.pass ? '✅' : '❌'} SCENARIO ${r.id} — ${r.name}${r.note ? ` (${r.note})` : ''}`)
  }
  const passed = results.filter((r) => r.pass).length
  console.log(`\n  Total: ${passed}/${results.length} PASS`)

  console.log(`\nTest user '${TEST_EMAIL}' is NOT auto-deleted (rerun-friendly).`)
  console.log(`  To remove manually:`)
  console.log(`    DELETE FROM org_members WHERE user_id = '${userId}';`)
  console.log(`    DELETE FROM organizations WHERE id IN (SELECT org_id FROM org_members WHERE user_id = '${userId}');`)
  console.log(`    DELETE FROM auth.users WHERE email = '${TEST_EMAIL}';`)

  process.exit(passed === results.length && results.length === 5 ? 0 : 1)
}

main().catch((e) => {
  console.error('\nFATAL:', e instanceof Error ? e.stack : e)
  process.exit(1)
})
