import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = JSON.parse(readFileSync(join(root, 'content/role-reference.json'), 'utf8'))
const bundle = JSON.parse(readFileSync(join(root, 'reference-bundle.json'), 'utf8'))
const publishedRoles = source.roles.filter(role => role.availability !== 'deferred')

test('bundle is generated from the editorial source', () => {
  assert.equal(bundle.roles.length, 68)
  assert.deepEqual(bundle.roles, publishedRoles)
  assert.equal(bundle.checksum, createHash('sha256').update(JSON.stringify(publishedRoles)).digest('hex'))
  assert.ok(!bundle.roles.some(role => role.id === 'trapper'))
})

test('all role links resolve and Fenrir keeps the old Alpha Wolf link', () => {
  for (const role of bundle.roles) assert.ok(existsSync(join(root, role.legacyPath)), role.legacyPath)
  assert.ok(bundle.roles.find(role => role.name === 'Fenrir').aliases.includes('The Oliver'))
  assert.ok(existsSync(join(root, 'roles/fenrir.html')))
  const trapperPage = readFileSync(join(root, 'roles/trapper.html'), 'utf8')
  assert.match(trapperPage, /Deferred — unavailable for new games/)
  assert.ok(!trapperPage.includes('Storyteller procedure'))
})

test('slideshow bundle contains no storyteller procedure', () => {
  const publicBundle = JSON.parse(readFileSync(join(root, 'kiosk/roles-public.json'), 'utf8'))
  assert.equal(publicBundle.roles.length, 68)
  assert.equal(publicBundle.checksum, bundle.checksum)
  assert.ok(publicBundle.roles.every(role => !('howToRun' in role) && !('sourceNotes' in role)))
})

test('legacy JSON is valid and release remains gated until every role is approved', () => {
  const legacy = JSON.parse(readFileSync(join(root, 'roles.json'), 'utf8'))
  assert.equal(Object.values(legacy).flat().length, 68)
  const run = spawnSync(process.execPath, [join(root, 'scripts/build-reference.mjs'), '--release'], { encoding: 'utf8' })
  const allApproved = publishedRoles.every(role => role.reviewStatus === 'approved' && role.reviewedBy && role.reviewedAt && role.reviewNotes.length === 0)
  assert.equal(run.status === 0, allApproved)
})
