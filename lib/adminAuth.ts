/**
 * Centralized admin authorization helpers for API routes.
 * All admin-only API routes should use these helpers for consistent
 * token validation and role checking.
 */

import { NextRequest } from 'next/server'
import { getFirebaseAdminAuth, getFirebaseAdminDb } from './firebaseAdmin'

export const runtime = 'nodejs'

const ADMIN_ROLES_DOC = 'roles'
const SUPER_ADMIN_EMAIL = 'rakibul.rir06@gmail.com'

export type AdminRole = 'admin' | 'superAdmin' | 'any'

export interface VerifiedAdmin {
  uid: string
  email: string
  isSuperAdmin: boolean
}

/**
 * Verifies the Firebase ID token from the Authorization header.
 * Returns the decoded token if valid, throws an error otherwise.
 */
export async function verifyIdToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }

  const token = authHeader.slice(7)
  const adminAuth = getFirebaseAdminAuth()
  const decoded = await adminAuth.verifyIdToken(token)
  return decoded
}

/**
 * Loads admin roles from Firestore (adminSettings/roles).
 * Returns { superAdmins, admins }.
 */
async function loadAdminRoles(): Promise<{ superAdmins: string[]; admins: string[] }> {
  const db = getFirebaseAdminDb()
  const rolesRef = db.collection('adminSettings').doc(ADMIN_ROLES_DOC)
  const snap = await rolesRef.get()

  if (!snap.exists) {
    return { superAdmins: [SUPER_ADMIN_EMAIL], admins: [] }
  }

  const data = snap.data() ?? {}
  const superAdmins: string[] = Array.isArray(data.superAdmins)
    ? (data.superAdmins as string[]).map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [SUPER_ADMIN_EMAIL]

  const admins: string[] = Array.isArray(data.admins)
    ? (data.admins as string[]).map((e) => e.trim().toLowerCase()).filter(Boolean)
    : []

  if (!superAdmins.includes(SUPER_ADMIN_EMAIL)) {
    superAdmins.push(SUPER_ADMIN_EMAIL)
  }

  return { superAdmins, admins }
}

/**
 * Verifies the request token and checks the required role.
 * - 'any': must be either a regular admin or super admin
 * - 'admin': must be a regular admin or super admin
 * - 'superAdmin': must be a super admin
 *
 * Throws an error if the user is not authorized.
 * Returns the verified admin info.
 */
export async function requireAdmin(req: NextRequest, role: AdminRole = 'any'): Promise<VerifiedAdmin> {
  const decoded = await verifyIdToken(req)
  const email = decoded.email?.toLowerCase() ?? ''

  const { superAdmins, admins } = await loadAdminRoles()
  const isSuperAdmin = superAdmins.includes(email)
  const isAdmin = isSuperAdmin || admins.includes(email)

  if (role === 'superAdmin' && !isSuperAdmin) {
    throw new Error('Super admin access required')
  }

  if ((role === 'admin' || role === 'any') && !isAdmin) {
    throw new Error('Admin access required')
  }

  return { uid: decoded.uid, email, isSuperAdmin }
}
