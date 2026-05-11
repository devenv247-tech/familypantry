#!/usr/bin/env node
/**
 * fix-modals.cjs
 * Nooka — Modal bottom-sheet migration script
 *
 * What it does:
 *   • Converts all modals to bottom-sheet on mobile, centered on sm+
 *   • Overlays:  items-center justify-center p-4  →  items-end sm:items-center sm:p-4
 *   • Inner box: rounded-card  →  rounded-t-2xl sm:rounded-card
 *
 * Usage:
 *   node fix-modals.cjs            ← dry run, safe to run anytime
 *   node fix-modals.cjs --apply    ← writes changes after confirmation
 *   node fix-modals.cjs --apply --yes  ← no prompt (CI)
 */

const fs       = require('fs')
const path     = require('path')
const readline = require('readline')

// ─── Config ───────────────────────────────────────────────────────────────────

const SRC_DIR    = path.resolve(__dirname, 'src')
const BACKUP_DIR = path.resolve(__dirname, '.modal-backups')

const SKIP_FILES = [
  'CookingLoader.jsx',  // full-screen loader, not a modal
  'BarcodeScanner.jsx', // full-screen camera UI
]

// ─── Replacements ─────────────────────────────────────────────────────────────

const REPLACEMENTS = [
  {
    description: 'Overlay (backdrop-blur): center → bottom-sheet',
    find:    /fixed inset-0 (bg-black\/\d+) z-50 flex items-center justify-center p-4 backdrop-blur-sm/g,
    replace: 'fixed inset-0 $1 z-50 flex items-end sm:items-center sm:p-4 backdrop-blur-sm',
  },
  {
    description: 'Overlay (no backdrop): center → bottom-sheet',
    find:    /fixed inset-0 (bg-black\/\d+) z-50 flex items-center justify-center p-4(?! backdrop)/g,
    replace: 'fixed inset-0 $1 z-50 flex items-end sm:items-center sm:p-4',
  },
  {
    description: 'Inner box (max-h): add rounded-t-2xl sm:rounded-card',
    find:    /bg-white rounded-card shadow-xl w-full (max-w-(?:sm|md|lg)) (max-h-\[\d+vh\]) overflow-y-auto/g,
    replace: 'bg-white w-full $1 $2 overflow-y-auto rounded-t-2xl sm:rounded-card shadow-xl',
  },
  {
    description: 'Inner box (p-6 relative): add rounded-t-2xl sm:rounded-card',
    find:    /bg-white rounded-card shadow-xl w-full (max-w-(?:sm|md|lg)) p-6 relative/g,
    replace: 'bg-white w-full $1 rounded-t-2xl sm:rounded-card shadow-xl p-6 relative',
  },
  {
    description: 'Inner box (plain p-6): add rounded-t-2xl sm:rounded-card',
    find:    /bg-white rounded-card shadow-xl w-full (max-w-(?:sm|md|lg)) p-6(?=[^-\w])/g,
    replace: 'bg-white w-full $1 rounded-t-2xl sm:rounded-card shadow-xl p-6',
  },
]

// ─── Colours ──────────────────────────────────────────────────────────────────

const R = '\x1b[0m'
const BOLD   = '\x1b[1m'
const DIM    = '\x1b[2m'
const RED    = '\x1b[31m'
const GREEN  = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN   = '\x1b[36m'

const log     = m => console.log(m)
const ok      = m => console.log(`${GREEN}  ✓${R}  ${m}`)
const fail    = m => console.log(`${RED}  ✗${R}  ${m}`)
const heading = m => console.log(`\n${BOLD}${CYAN}${m}${R}`)
const dim     = m => console.log(`${DIM}${m}${R}`)

// ─── Validation ───────────────────────────────────────────────────────────────
//
// Strategy: instead of trying to parse JSX (hard), we validate that our
// replacements didn't CHANGE the bracket balance. We compare the balance
// of the original vs the transformed file. If they're equal, we're safe.
// This avoids all false-positives from template literals and JSX attributes.

function bracketBalance(content) {
  // Strip single-line comments
  let s = content.replace(/\/\/[^\n]*/g, ' ')
  // Strip block comments
  s = s.replace(/\/\*[\s\S]*?\*\//g, ' ')

  // Strip strings char-by-char to handle multiline template literals
  let result = ''
  let i = 0
  while (i < s.length) {
    const ch = s[i]

    // Double-quoted string
    if (ch === '"') {
      result += '"'
      i++
      while (i < s.length && s[i] !== '"') {
        if (s[i] === '\\') i++ // skip escape
        i++
      }
      result += '"'
      i++
      continue
    }

    // Single-quoted string
    if (ch === "'") {
      result += "'"
      i++
      while (i < s.length && s[i] !== "'") {
        if (s[i] === '\\') i++
        i++
      }
      result += "'"
      i++
      continue
    }

    // Template literal — skip entire content including nested ${...}
    if (ch === '`') {
      result += '`'
      i++
      let depth = 0
      while (i < s.length) {
        if (s[i] === '\\') { i += 2; continue }
        if (s[i] === '`' && depth === 0) { result += '`'; i++; break }
        if (s[i] === '$' && s[i+1] === '{') { depth++; i += 2; continue }
        if (s[i] === '}' && depth > 0)      { depth--; i++;    continue }
        i++
      }
      continue
    }

    result += ch
    i++
  }

  // Count brackets in cleaned string
  const counts = { '{': 0, '}': 0, '(': 0, ')': 0 }
  for (const ch of result) {
    if (ch in counts) counts[ch]++
  }

  return {
    curly: counts['{'] - counts['}'],
    paren: counts['('] - counts[')'],
  }
}

function validateTransform(original, transformed) {
  const before = bracketBalance(original)
  const after  = bracketBalance(transformed)
  const errors = []

  if (before.curly !== after.curly) {
    errors.push(`Curly brace balance changed: was ${before.curly}, now ${after.curly}`)
  }
  if (before.paren !== after.paren) {
    errors.push(`Parenthesis balance changed: was ${before.paren}, now ${after.paren}`)
  }

  // Check none of our replacement strings appear in a broken form
  // (e.g. the class string got cut off mid-replacement)
  if (transformed.includes('rounded-t-2xl sm:rounded-card shadow-xl p-6\n')) {
    // fine — this is correct multiline JSX
  }
  if ((transformed.match(/rounded-t-2xl/g) || []).length !==
      (transformed.match(/sm:rounded-card/g) || []).length) {
    errors.push('Mismatch: rounded-t-2xl count !== sm:rounded-card count — partial replacement')
  }

  return errors
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findJSX(dir, results = []) {
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory())            findJSX(full, results)
    else if (entry.name.endsWith('.jsx')) results.push(full)
  }
  return results
}

function applyReplacements(original) {
  let content    = original
  let matchCount = 0
  for (const { find, replace } of REPLACEMENTS) {
    const before = content
    content = content.replace(find, replace)
    if (content !== before) matchCount++
  }
  return { content, matchCount }
}

function showDiff(original, updated) {
  const oLines = original.split('\n')
  const nLines = updated.split('\n')
  const max    = Math.max(oLines.length, nLines.length)
  for (let i = 0; i < max; i++) {
    const o = oLines[i] ?? ''
    const n = nLines[i] ?? ''
    if (o !== n) {
      log(`  ${DIM}L${i+1}${R}  ${RED}-${R} ${o.trim()}`)
      log(`       ${GREEN}+${R} ${n.trim()}`)
    }
  }
}

function backup(filepath) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  const rel  = path.relative(__dirname, filepath).replace(/[\\/]/g, '__')
  const ts   = new Date().toISOString().replace(/[:.]/g, '-')
  const dest = path.join(BACKUP_DIR, `${ts}__${rel}`)
  fs.copyFileSync(filepath, dest)
  return dest
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans) }))
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args     = process.argv.slice(2)
  const doApply  = args.includes('--apply')
  const noPrompt = args.includes('--yes')

  heading('═══════════════════════════════════════════════')
  heading('  Nooka — Modal bottom-sheet migration')
  heading('═══════════════════════════════════════════════')

  if (!doApply) {
    log(`\n${YELLOW}${BOLD}DRY RUN${R} — no files will be changed. Pass ${BOLD}--apply${R} to write.\n`)
  } else {
    log(`\n${RED}${BOLD}APPLY mode${R} — files will be modified (backups created first).\n`)
  }

  const allFiles = findJSX(SRC_DIR)
  if (allFiles.length === 0) {
    fail(`No .jsx files found under: ${SRC_DIR}`)
    fail('Run this script from your project root (~/Desktop/familypantry)')
    process.exit(1)
  }

  dim(`Scanning ${allFiles.length} JSX files...\n`)

  const toChange = []
  const skipped  = []
  const noChange = []
  const failures = []

  for (const filepath of allFiles) {
    const filename = path.basename(filepath)

    if (SKIP_FILES.includes(filename)) {
      skipped.push(filename)
      continue
    }

    const original = fs.readFileSync(filepath, 'utf8')
    const { content, matchCount } = applyReplacements(original)

    if (content === original) {
      noChange.push(filename)
      continue
    }

    const errors = validateTransform(original, content)
    if (errors.length > 0) {
      failures.push({ filename, errors })
      fail(`VALIDATION FAILED: ${filename}`)
      errors.forEach(e => log(`     ${RED}→ ${e}${R}`))
      continue
    }

    toChange.push({ filename, filepath, original, content, matchCount })
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  heading('── Scan results ─────────────────────────────────')

  if (skipped.length) {
    log(`\n${YELLOW}Intentionally skipped:${R}`)
    skipped.forEach(f => dim(`  • ${f}`))
  }

  if (noChange.length) {
    log(`\n${DIM}No changes needed (${noChange.length} files):${R}`)
    noChange.forEach(f => dim(`  • ${f}`))
  }

  if (failures.length) {
    log(`\n${RED}${BOLD}Validation failures — skipped (${failures.length}):${R}`)
    failures.forEach(({ filename }) => fail(`  ${filename}`))
  }

  if (toChange.length === 0) {
    log(`\n${GREEN}${BOLD}Nothing to change — all modals already up to date!${R}\n`)
    process.exit(0)
  }

  heading(`── Changes to apply (${toChange.length} files) ──────────────────────`)

  for (const { filename, original, content, matchCount } of toChange) {
    log(`\n${BOLD}${filename}${R}  ${DIM}(${matchCount} pattern${matchCount > 1 ? 's' : ''} matched)${R}`)
    showDiff(original, content)
  }

  if (!doApply) {
    log(`\n${YELLOW}────────────────────────────────────────────────────${R}`)
    log(`${YELLOW}Dry run complete. ${toChange.length} file(s) would be changed.${R}`)
    log(`Run with ${BOLD}--apply${R} to write.\n`)
    process.exit(0)
  }

  // ── Confirm & write ────────────────────────────────────────────────────────

  if (!noPrompt) {
    const ans = await ask(
      `\n${YELLOW}${BOLD}Write changes to ${toChange.length} file(s)? Backups go to .modal-backups/ [y/N]: ${R}`
    )
    if (ans.trim().toLowerCase() !== 'y') {
      log('\nAborted — no files changed.\n')
      process.exit(0)
    }
  }

  heading('── Writing ──────────────────────────────────────')
  log('')

  let written = 0
  for (const { filename, filepath, content } of toChange) {
    try {
      const bk = backup(filepath)
      fs.writeFileSync(filepath, content, 'utf8')
      ok(`${filename}  ${DIM}← backup: ${path.relative(__dirname, bk)}${R}`)
      written++
    } catch (e) {
      fail(`Failed to write ${filename}: ${e.message}`)
    }
  }

  heading('── Done ─────────────────────────────────────────')
  log(`\n${GREEN}${BOLD}${written}/${toChange.length} files updated.${R}`)
  log(`\nBackups saved to: ${BOLD}.modal-backups/${R}`)
  log(`\n${BOLD}Next steps:${R}`)
  log(`  git add -A`)
  log(`  git commit -m "fix: all modals bottom-sheet on mobile, centered on tablet/desktop"`)
  log(`  git push origin main\n`)
}

main().catch(e => {
  console.error(`\n${RED}Unexpected error: ${e.message}${R}`)
  process.exit(1)
})
