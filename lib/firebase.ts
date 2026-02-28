import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let authInstance: Auth | null = null

export function getFirebaseAuth() {
  if (typeof window === 'undefined') return null
  if (authInstance) return authInstance

  const hasRequiredConfig = Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  )

  if (!hasRequiredConfig) {
    return null
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  authInstance = getAuth(app)
  return authInstance
}
