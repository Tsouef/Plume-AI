// scripts/release.mjs
import { execFileSync, execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const bump = process.argv[2] || 'patch'

if (!['patch', 'minor', 'major'].includes(bump)) {
  console.error('Usage: node scripts/release.mjs [patch|minor|major]')
  process.exit(1)
}

// Ensure clean working tree
const status = execSync('git status --porcelain', { cwd: root, encoding: 'utf-8' }).trim()
if (status) {
  console.error('Working tree is not clean. Commit or stash changes first.')
  process.exit(1)
}

// Read current version from manifest
const manifestPath = join(root, 'manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
const [major, minor, patch] = manifest.version.split('.').map(Number)

// Compute new version
const newVersion =
  bump === 'major'
    ? `${major + 1}.0.0`
    : bump === 'minor'
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`

console.log(`Bumping ${manifest.version} → ${newVersion} (${bump})`)

// Update manifest.json
manifest.version = newVersion
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

// Update package.json
const pkgPath = join(root, 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
pkg.version = newVersion
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

// Generate changelog entry from commits since last tag
let lastTag
try {
  lastTag = execFileSync('git', ['describe', '--tags', '--abbrev=0'], { cwd: root, encoding: 'utf-8' }).trim()
} catch {
  lastTag = null
}

const range = lastTag ? `${lastTag}..HEAD` : 'HEAD'
const log = execFileSync(
  'git',
  ['log', range, '--pretty=format:- %s', '--no-merges'],
  { cwd: root, encoding: 'utf-8' }
).trim()

if (log) {
  const changelogPath = join(root, 'CHANGELOG.md')
  const changelog = readFileSync(changelogPath, 'utf-8')
  const today = new Date().toISOString().split('T')[0]
  const entry = `## [${newVersion}] - ${today}\n\n### Changed\n\n${log}\n\n`

  // Insert after the header (after first ## or after the preamble)
  const insertPoint = changelog.indexOf('\n## ')
  if (insertPoint !== -1) {
    const updated = changelog.slice(0, insertPoint + 1) + entry + changelog.slice(insertPoint + 1)
    writeFileSync(changelogPath, updated)
  } else {
    writeFileSync(changelogPath, changelog + '\n' + entry)
  }
  console.log('Updated CHANGELOG.md')
  execFileSync('git', ['add', 'CHANGELOG.md'], { cwd: root, stdio: 'inherit' })
}

// Commit, tag, push
execFileSync('git', ['add', 'manifest.json', 'package.json'], { cwd: root, stdio: 'inherit' })
execFileSync('git', ['commit', '-m', `release: v${newVersion}`], { cwd: root, stdio: 'inherit' })
execFileSync('git', ['tag', `v${newVersion}`], { cwd: root, stdio: 'inherit' })

console.log(`\nCreated tag v${newVersion}`)
console.log(`Run 'git push && git push --tags' to trigger the release workflow.`)
