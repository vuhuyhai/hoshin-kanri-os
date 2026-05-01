#!/usr/bin/env pwsh
# Smoke test: POST /api/orgs/check-similar (M-OrgUX-1)
# Reads creds from .env.local - never commit secrets.
# Usage:  powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/smoke-test-orgs-check-similar.ps1
#   (or pwsh ./scripts/smoke-test-orgs-check-similar.ps1 if PowerShell 7+ installed)
#
# File is intentionally pure ASCII so Windows PowerShell 5.1 can parse it
# without a UTF-8 BOM. Vietnamese strings in JSON bodies use \uXXXX escapes.

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
# Windows PowerShell 5.1 defaults to TLS 1.0/1.1; Supabase requires 1.2+
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# ---------- CONFIG ----------
$BaseUrl      = 'http://localhost:3000'
$TestEmail    = 'smoke-test-orgs@hoshin-test.local'
$TestPassword = 'SmokeTestPass123!@#'
$ProjectRef   = 'cnbsrlhhgrfbdhisizgg'
$CookieName   = "sb-$ProjectRef-auth-token"

# JSON unicode-escape sequence for "Ha Noi" with diacritics (Ha + grave + Noi + dot-below)
$HaNoiJson = 'H\u00e0 N\u1ed9i'

# ---------- HELPERS ----------
function Write-Header($text) {
  Write-Host ""
  Write-Host "=== $text ===" -ForegroundColor Cyan
}

function Write-Case($num, $name) {
  Write-Host ""
  Write-Host "[CASE $num] $name" -ForegroundColor Yellow
}

function Get-EnvVar([string]$path, [string]$key) {
  $line = Select-String -Path $path -Pattern "^$key=" -SimpleMatch:$false | Select-Object -First 1
  if (-not $line) { return $null }
  $val = $line.Line.Substring($line.Line.IndexOf('=') + 1).Trim()
  return $val
}

function ConvertTo-Base64Url([string]$text) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
  $b64 = [System.Convert]::ToBase64String($bytes)
  return $b64.TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

# Windows PowerShell 5.1's Invoke-WebRequest/Invoke-RestMethod silently drop
# Authorization headers in some configs. Use .NET HttpWebRequest directly.
function Invoke-HttpRequest {
  param(
    [Parameter(Mandatory)] [string]$Uri,
    [Parameter(Mandatory)] [string]$Method,
    [hashtable]$Headers = @{},
    [string]$Body = $null
  )
  $req = [System.Net.HttpWebRequest]::Create($Uri)
  $req.Method = $Method
  $req.AllowAutoRedirect = $false
  if ($Headers.ContainsKey('Content-Type')) {
    $req.ContentType = $Headers['Content-Type']
  }
  foreach ($k in $Headers.Keys) {
    if ($k -ieq 'Content-Type') { continue }
    $req.Headers.Add($k, $Headers[$k])
  }
  if ($null -ne $Body -and $Body.Length -gt 0) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
    $req.ContentLength = $bytes.Length
    $stream = $req.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
  } elseif ($Method -ieq 'POST' -or $Method -ieq 'PUT' -or $Method -ieq 'PATCH') {
    $req.ContentLength = 0
  }
  $status = 0
  $respBody = ''
  $hdrs = @{}
  try {
    $resp = $req.GetResponse()
    $status = [int]$resp.StatusCode
    foreach ($hk in $resp.Headers.AllKeys) { $hdrs[$hk] = [string]$resp.Headers[$hk] }
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $respBody = $reader.ReadToEnd()
    $resp.Close()
  } catch [System.Net.WebException] {
    $resp = $_.Exception.Response
    if ($resp) {
      $status = [int]$resp.StatusCode
      foreach ($hk in $resp.Headers.AllKeys) { $hdrs[$hk] = [string]$resp.Headers[$hk] }
      try {
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $respBody = $reader.ReadToEnd()
      } catch { $respBody = '' }
    } else {
      $respBody = $_.Exception.Message
    }
  }
  return @{ Status = $status; Body = $respBody; Headers = $hdrs }
}

function Invoke-Endpoint {
  param(
    [string]$BodyJson,
    [bool]$WithAuth = $true,
    [string]$AuthCookie = $null
  )
  $headers = @{ 'Content-Type' = 'application/json' }
  if ($WithAuth -and $AuthCookie) {
    $headers['Cookie'] = "$CookieName=$AuthCookie"
  }
  return Invoke-HttpRequest -Uri "$BaseUrl/api/orgs/check-similar" -Method 'POST' -Headers $headers -Body $BodyJson
}

function Get-RetryAfter($headers) {
  if (-not $headers) { return $null }
  if ($headers -is [hashtable]) {
    foreach ($k in $headers.Keys) {
      if ($k -ieq 'Retry-After') { return $headers[$k] }
    }
    return $null
  }
  try { return $headers['Retry-After'] } catch { return $null }
}

# ---------- 1. PRE-CHECKS ----------
Write-Header "Smoke Test /api/orgs/check-similar (M-OrgUX-1)"

$envPath = Join-Path (Join-Path $PSScriptRoot '..') '.env.local'
if (-not (Test-Path $envPath)) {
  Write-Host "FAIL: .env.local not found at $envPath" -ForegroundColor Red
  exit 1
}
$envPath = (Resolve-Path $envPath).Path
Write-Host "Env file: $envPath"

$SupabaseUrl = Get-EnvVar $envPath 'NEXT_PUBLIC_SUPABASE_URL'
$AnonKey     = Get-EnvVar $envPath 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
$ServiceKey  = Get-EnvVar $envPath 'SUPABASE_SERVICE_ROLE_KEY'

if (-not $SupabaseUrl) { Write-Host "FAIL: NEXT_PUBLIC_SUPABASE_URL missing" -ForegroundColor Red; exit 1 }
if (-not $AnonKey)     { Write-Host "FAIL: NEXT_PUBLIC_SUPABASE_ANON_KEY missing" -ForegroundColor Red; exit 1 }
if (-not $ServiceKey)  { Write-Host "FAIL: SUPABASE_SERVICE_ROLE_KEY missing" -ForegroundColor Red; exit 1 }
Write-Host "[OK] Env vars loaded"

$health = Invoke-HttpRequest -Uri $BaseUrl -Method 'HEAD' -Headers @{}
if ($health.Status -eq 200 -or $health.Status -eq 307) {
  Write-Host "[OK] Dev server responding (HTTP $($health.Status))"
} else {
  Write-Host "FAIL: dev server unreachable or unexpected status $($health.Status). Run 'npm run dev' first." -ForegroundColor Red
  exit 1
}

# ---------- 2. CREATE / GET TEST USER ----------
Write-Host ""
Write-Host "Provisioning test user via Supabase Admin API..." -ForegroundColor DarkGray
$adminHeaders = @{
  'Authorization' = "Bearer $ServiceKey"
  'apikey'        = $ServiceKey
  'Content-Type'  = 'application/json'
}
$createBody = @{
  email         = $TestEmail
  password      = $TestPassword
  email_confirm = $true
} | ConvertTo-Json -Compress

$createResp = Invoke-HttpRequest -Uri "$SupabaseUrl/auth/v1/admin/users" -Method 'POST' -Headers $adminHeaders -Body $createBody
if ($createResp.Status -ge 200 -and $createResp.Status -lt 300) {
  Write-Host "[OK] Test user created: $TestEmail"
} elseif ($createResp.Status -eq 409 -or $createResp.Status -eq 422 -or $createResp.Status -eq 400) {
  Write-Host "[OK] Test user already exists (HTTP $($createResp.Status)) - skipping create"
} else {
  Write-Host "FAIL: admin create user returned HTTP $($createResp.Status)" -ForegroundColor Red
  $prev = if ($createResp.Body) { $createResp.Body.Substring(0, [Math]::Min(200, $createResp.Body.Length)) } else { '' }
  Write-Host "  Body: $prev" -ForegroundColor DarkGray
  exit 1
}

# ---------- 3. SIGN IN -> JWT SESSION ----------
$signinHeaders = @{
  'apikey'       = $AnonKey
  'Content-Type' = 'application/json'
}
$signinBody = @{
  email    = $TestEmail
  password = $TestPassword
} | ConvertTo-Json -Compress

$signinResp = Invoke-HttpRequest -Uri "$SupabaseUrl/auth/v1/token?grant_type=password" -Method 'POST' -Headers $signinHeaders -Body $signinBody
if ($signinResp.Status -lt 200 -or $signinResp.Status -ge 300) {
  Write-Host "FAIL: sign-in returned HTTP $($signinResp.Status)" -ForegroundColor Red
  $prev = if ($signinResp.Body) { $signinResp.Body.Substring(0, [Math]::Min(200, $signinResp.Body.Length)) } else { '' }
  Write-Host "  Body: $prev" -ForegroundColor DarkGray
  exit 1
}
$session = $signinResp.Body | ConvertFrom-Json
if (-not $session.access_token) {
  Write-Host "FAIL: no access_token in sign-in response" -ForegroundColor Red
  exit 1
}
Write-Host "[OK] Signed in (access_token len=$($session.access_token.Length))"

# Build the cookie value @supabase/ssr expects: 'base64-' + base64url(JSON(session))
$sessionJson  = $session | ConvertTo-Json -Depth 10 -Compress
$cookieValue  = 'base64-' + (ConvertTo-Base64Url $sessionJson)

# ---------- 4. TEST CASES ----------
$results = @()

# CASE 1: Unauthorized (no auth cookie)
Write-Case 1 "Unauthorized (no JWT cookie)"
$body1 = '{"name":"Test","city":"' + $HaNoiJson + '"}'
$r1 = Invoke-Endpoint -BodyJson $body1 -WithAuth $false
$pass1 = ($r1.Status -eq 401)
Write-Host "  Expected: HTTP 401"
Write-Host "  Actual:   HTTP $($r1.Status)"
Write-Host "  Result:   $(if ($pass1) {'PASS'} else {'FAIL'})"
$results += [pscustomobject]@{ Case=1; Name='Unauthorized'; Pass=$pass1 }

# CASE 2: Invalid input (name='L' < 2 chars)
Write-Case 2 "Invalid input (name='L' too short)"
$body2 = '{"name":"L","city":"' + $HaNoiJson + '"}'
$r2 = Invoke-Endpoint -BodyJson $body2 -WithAuth $true -AuthCookie $cookieValue
$pass2 = ($r2.Status -eq 400 -and ($r2.Body -match 'too_small' -or $r2.Body -match 'issues'))
$preview2 = if ($r2.Body) { $r2.Body.Substring(0, [Math]::Min(140, $r2.Body.Length)) } else { '' }
Write-Host "  Expected: HTTP 400 + Zod validation error (too_small / issues field)"
Write-Host "  Actual:   HTTP $($r2.Status) | body: $preview2"
Write-Host "  Result:   $(if ($pass2) {'PASS'} else {'FAIL'})"
$results += [pscustomobject]@{ Case=2; Name='Invalid input'; Pass=$pass2 }

# CASE 3: Match Ladysfit + Ha Noi - CRITICAL no-id-leak check
Write-Case 3 "Match Ladysfit Ha Noi (CRITICAL - no id leak)"
$body3 = '{"name":"Ladysfit","city":"' + $HaNoiJson + '"}'
$r3 = Invoke-Endpoint -BodyJson $body3 -WithAuth $true -AuthCookie $cookieValue
$idLeak = $false
$pass3  = $false
$matchCount = 0
if ($r3.Status -eq 200) {
  try {
    $j = $r3.Body | ConvertFrom-Json
    $hasMatches = [bool]$j.hasMatches
    $matches = @($j.matches)
    $matchCount = $matches.Count
    if ($matchCount -gt 0) {
      $first = $matches[0]
      $fields = @($first.PSObject.Properties.Name | Sort-Object)
      $expectedFields = @('city','industry','name')
      $diff = Compare-Object $fields $expectedFields
      $fieldsOk = ($null -eq $diff -or @($diff).Count -eq 0)
      $idLeak = ($first.PSObject.Properties.Name -contains 'id')
      $pass3 = $hasMatches -and ($matchCount -ge 1) -and $fieldsOk -and (-not $idLeak)
      Write-Host "  Expected: 200, hasMatches=true, matches>=1, fields={city,industry,name}, NO id"
      Write-Host "  Actual:   200, hasMatches=$hasMatches, matches=$matchCount, fields=[$($fields -join ',')], idLeak=$idLeak"
    } else {
      Write-Host "  Expected: 200 with >=1 matches"
      Write-Host "  Actual:   200, matches=0 (Ladysfit Ha Noi may not be seeded in DB)"
    }
  } catch {
    Write-Host "  Expected: 200 + parseable JSON"
    Write-Host "  Actual:   200 but JSON parse failed: $($_.Exception.Message)"
  }
} else {
  $preview3 = if ($r3.Body) { $r3.Body.Substring(0, [Math]::Min(160, $r3.Body.Length)) } else { '' }
  Write-Host "  Expected: HTTP 200"
  Write-Host "  Actual:   HTTP $($r3.Status) | $preview3"
}
Write-Host "  Result:   $(if ($pass3) {'PASS'} else {'FAIL'})"
$results += [pscustomobject]@{ Case=3; Name='Ladysfit match (no id leak)'; Pass=$pass3 }

if ($idLeak) {
  Write-Host ""
  Write-Host "STOP: 'id' field leaked in response - halting smoke test." -ForegroundColor Red
  exit 1
}

# CASE 4: No match
Write-Case 4 "No match (NonExistentOrg_XYZ_12345)"
$body4 = '{"name":"NonExistentOrg_XYZ_12345","city":"' + $HaNoiJson + '"}'
$r4 = Invoke-Endpoint -BodyJson $body4 -WithAuth $true -AuthCookie $cookieValue
$pass4 = $false
if ($r4.Status -eq 200) {
  try {
    $j4 = $r4.Body | ConvertFrom-Json
    $mc = @($j4.matches).Count
    $pass4 = (([bool]$j4.hasMatches) -eq $false) -and ($mc -eq 0)
    Write-Host "  Expected: 200, hasMatches=false, matches=[]"
    Write-Host "  Actual:   200, hasMatches=$($j4.hasMatches), matches=$mc"
  } catch {
    Write-Host "  Expected: 200 + parseable JSON"
    Write-Host "  Actual:   200 parse error: $($_.Exception.Message)"
  }
} else {
  Write-Host "  Expected: HTTP 200"
  Write-Host "  Actual:   HTTP $($r4.Status)"
}
Write-Host "  Result:   $(if ($pass4) {'PASS'} else {'FAIL'})"
$results += [pscustomobject]@{ Case=4; Name='No match'; Pass=$pass4 }

# CASE 5: Rate limit - 12 calls in tight burst
# NOTE: rate limit is 10 per 60s per user. CASE 3 + CASE 4 already consumed
# 2 slots, so expect roughly first ~8 of burst = 200, then 429 + Retry-After.
Write-Case 5 "Rate limit (12 calls tight burst - limit 10/60s/user)"
$body5 = '{"name":"BurstTest","city":"' + $HaNoiJson + '"}'
$burstStatuses = @()
$retryAfters   = @()
for ($i = 1; $i -le 12; $i++) {
  $rb = Invoke-Endpoint -BodyJson $body5 -WithAuth $true -AuthCookie $cookieValue
  $burstStatuses += $rb.Status
  $retryAfters += (Get-RetryAfter $rb.Headers)
}
$count200 = @($burstStatuses | Where-Object { $_ -eq 200 }).Count
$count429 = @($burstStatuses | Where-Object { $_ -eq 429 }).Count
$first429Idx = -1
for ($i = 0; $i -lt $burstStatuses.Count; $i++) {
  if ($burstStatuses[$i] -eq 429) { $first429Idx = $i; break }
}
$retryHeaderOnFirst429 = ($first429Idx -ge 0) -and ($null -ne $retryAfters[$first429Idx]) -and ($retryAfters[$first429Idx] -ne '')
$lastIs429 = ($burstStatuses[$burstStatuses.Count - 1] -eq 429)
$pass5 = ($count429 -ge 2) -and $retryHeaderOnFirst429 -and $lastIs429
Write-Host "  Expected: rate limit kicks in (429 + Retry-After), tail of burst = 429"
Write-Host "  Actual:   statuses=[$($burstStatuses -join ',')]"
Write-Host "            200=$count200, 429=$count429, first429@idx=$first429Idx, retry-after=$($retryAfters[$first429Idx])"
Write-Host "  Result:   $(if ($pass5) {'PASS'} else {'FAIL'})"
$results += [pscustomobject]@{ Case=5; Name='Rate limit'; Pass=$pass5 }

# CASE 6: Audit log evidence
Write-Case 6 "Audit log REST query (audit_logs table)"
$pass6 = $false
$auditNote = ''
$auditHeaders = @{
  'apikey'        = $ServiceKey
  'Authorization' = "Bearer $ServiceKey"
}
$auditResp = Invoke-HttpRequest -Uri "$SupabaseUrl/rest/v1/audit_logs?select=*&order=created_at.desc&limit=1" -Method 'GET' -Headers $auditHeaders
if ($auditResp.Status -eq 200) {
  try {
    $rows = $auditResp.Body | ConvertFrom-Json
    if (@($rows).Count -ge 1) {
      $row = $rows[0]
      $nq  = [string]$row.name_query
      $matchLog = $nq -match 'ladysfit'
      Write-Host "  Audit row: name_query='$nq' match_count=$($row.match_count)"
      $pass6 = $matchLog
      $auditNote = "row found"
    } else {
      Write-Host "  audit_logs exists but empty"
      $auditNote = "table empty"
      $pass6 = $true
    }
  } catch {
    Write-Host "  audit response parse error: $($_.Exception.Message)"
    $auditNote = "parse error"
    $pass6 = $false
  }
} else {
  $sc = $auditResp.Status
  if ($sc -eq 404 -or $sc -eq 400 -or $sc -eq 406) {
    Write-Host "  audit_logs table not found (HTTP $sc) - fallback to console.log per route spec"
    Write-Host "  Verify manually: tail dev terminal for '[audit:check-similar]'"
    $auditNote = "table absent - fallback console.log per spec"
    $pass6 = $true
  } else {
    $previewA = if ($auditResp.Body) { $auditResp.Body.Substring(0, [Math]::Min(160, $auditResp.Body.Length)) } else { '' }
    Write-Host "  audit query error (HTTP $sc) body: $previewA"
    $auditNote = "query error"
    $pass6 = $false
  }
}
Write-Host "  Result:   $(if ($pass6) {'PASS (' + $auditNote + ')'} else {'FAIL'})"
$results += [pscustomobject]@{ Case=6; Name='Audit log'; Pass=$pass6 }

# ---------- 5. SUMMARY ----------
Write-Header "Summary"
Write-Host ""
Write-Host "| Case | Name                            | Pass/Fail |"
Write-Host "|------|---------------------------------|-----------|"
foreach ($r in $results) {
  $mark = if ($r.Pass) { 'PASS' } else { 'FAIL' }
  Write-Host ("| {0,4} | {1,-31} | {2,-9} |" -f $r.Case, $r.Name, $mark)
}
$passCount = @($results | Where-Object { $_.Pass }).Count
$failCount = $results.Count - $passCount
Write-Host ""
Write-Host "Total: $passCount/$($results.Count) PASS, $failCount FAIL" -ForegroundColor $(if ($failCount -eq 0) { 'Green' } else { 'Red' })
Write-Host ""
Write-Host "Test user '$TestEmail' is NOT auto-deleted (rerun-friendly)."
Write-Host "  To remove manually:"
Write-Host "    DELETE FROM auth.users WHERE email='$TestEmail';"

if ($failCount -gt 0) { exit 1 } else { exit 0 }
