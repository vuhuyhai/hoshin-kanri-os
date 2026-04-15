#!/usr/bin/env node
// Apply a single migration file to the linked Supabase project via
// the Management API. Avoids needing the Supabase CLI or the raw DB
// password — only a Personal Access Token is required.
//
// Usage:
//   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-migration.mjs 022_blog_posts.sql
//
// Get a token at https://supabase.com/dashboard/account/tokens
// Project ref is read from NEXT_PUBLIC_SUPABASE_URL in .env.local.

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

function loadEnvLocal() {
  const file = join(ROOT, '.env.local')
  if (!existsSync(file)) return
  const content = readFileSync(file, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvLocal()

const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error('ERROR: SUPABASE_ACCESS_TOKEN env var is required.')
  console.error('Get one at https://supabase.com/dashboard/account/tokens')
  console.error(
    'Then run: SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-migration.mjs 022_blog_posts.sql'
  )
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!url) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL missing from .env.local')
  process.exit(1)
}
const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)
if (!match) {
  console.error(`ERROR: cannot extract project ref from URL: ${url}`)
  process.exit(1)
}
const projectRef = match[1]

const fileName = process.argv[2]
if (!fileName) {
  console.error('ERROR: missing migration filename argument')
  console.error('Usage: node scripts/apply-migration.mjs 022_blog_posts.sql')
  process.exit(1)
}

const migrationPath = join(ROOT, 'supabase', 'migrations', fileName)
if (!existsSync(migrationPath)) {
  console.error(`ERROR: migration not found at ${migrationPath}`)
  process.exit(1)
}

const sql = readFileSync(migrationPath, 'utf8')

console.log(`→ Project:   ${projectRef}`)
console.log(`→ Migration: ${fileName}`)
console.log(`→ Size:      ${sql.length} bytes`)
console.log()

const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
})

const body = await response.text()

if (!response.ok) {
  console.error(`FAILED: HTTP ${response.status}`)
  console.error(body)
  process.exit(1)
}

console.log(`✓ Applied successfully (HTTP ${response.status})`)
if (body && body !== '[]') {
  console.log('Response:', body)
}
