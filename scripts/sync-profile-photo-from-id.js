#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const admin = require('firebase-admin')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex <= 0) continue

    const key = trimmed.slice(0, eqIndex).trim()
    const rawValue = trimmed.slice(eqIndex + 1).trim()

    if (!key || process.env[key]) continue

    let value = rawValue
    const startsWithQuote = value.startsWith('"') || value.startsWith("'")
    const endsWithQuote = value.endsWith('"') || value.endsWith("'")

    if (startsWithQuote && endsWithQuote && value.length >= 2) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

function getPrivateKey() {
  const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  if (!raw) return ''

  return raw.replace(/\\n/g, '\n').replace(/\r/g, '')
}

async function main() {
  const emailArg = (process.argv[2] || '').trim().toLowerCase()
  if (!emailArg) {
    throw new Error('Usage: node scripts/sync-profile-photo-from-id.js <email>')
  }

  loadEnvFile(path.join(process.cwd(), '.env.local'))

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = getPrivateKey()

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin env values in .env.local')
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  }

  const db = admin.firestore()
  const snap = await db.collection('profiles').where('email', '==', emailArg).limit(1).get()

  if (snap.empty) {
    throw new Error(`No profile found for ${emailArg}`)
  }

  const profileDoc = snap.docs[0]
  const data = profileDoc.data() || {}
  const idDoc = String(data.idDocumentPhotoDataUrl || '')

  if (!idDoc) {
    throw new Error(`Profile ${emailArg} has no idDocumentPhotoDataUrl`) 
  }

  await profileDoc.ref.set(
    {
      profilePhotoDataUrl: idDoc,
      updatedAt: Date.now(),
    },
    { merge: true },
  )

  console.log(`Updated profilePhotoDataUrl from idDocumentPhotoDataUrl for ${emailArg} (doc: ${profileDoc.id})`)
}

main().catch((error) => {
  console.error(error.message || String(error))
  process.exit(1)
})
