import { execFileSync, execSync } from 'node:child_process'
import { mkdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const browser = process.argv[2] || 'chrome'

if (!['chrome', 'firefox'].includes(browser)) {
  console.error('Usage: node scripts/build-zip.mjs [chrome|firefox]')
  process.exit(1)
}

// Read version from manifest
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf-8'))
const version = manifest.version

// Run build
const buildCmd = browser === 'firefox' ? 'npm run build:firefox' : 'npm run build'
console.log(`Building for ${browser}...`)
execSync(buildCmd, { cwd: root, stdio: 'inherit' })

// Create releases dir
const releasesDir = join(root, 'releases')
mkdirSync(releasesDir, { recursive: true })

const zipName = `plume-ai-${version}-${browser}.zip`
const zipPath = join(releasesDir, zipName)

// Use system zip command (available on macOS and Linux CI)
execFileSync('zip', ['-r', zipPath, '.', '-x', '*.map', '-x', '.DS_Store', '-x', '**/.DS_Store'], {
  cwd: join(root, 'dist'),
  stdio: 'inherit',
})

const size = statSync(zipPath).size
console.log(`\n✅ ${zipName} (${(size / 1024).toFixed(1)} KB)`)
console.log(`   ${zipPath}`)
