'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getFirebaseAuth, getFirestoreDb } from '../lib/firebase'

const SUPER_ADMIN_EMAIL = 'rakibul.rir06@gmail.com'
const ADMIN_ROLES_DOC = 'roles'

function isAdminEmail(email: string) {
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL
}

function defaultVerificationByEmail(email: string): UserProfile['verificationStatus'] {
  return isAdminEmail(email) ? 'verified' : 'pending'
}

type IdType = 'birth-registration' | 'passport'

interface AuthUser {
  id: string
  fullName: string
  email: string
  avatarDataUrl?: string
  provider: 'email' | 'google'
}

interface UserProfile {
  fullName: string
  email: string
  phone: string
  educationLevel: string
  instituteName: string
  address: string
  dateOfBirth: string
  idType: IdType
  idNumber: string
  profilePhotoDataUrl: string
  idDocumentPhotoDataUrl: string
  verificationStatus: 'pending' | 'verified' | 'cancelled'
  verificationReason?: string
  verificationUpdatedAt?: number
}

interface CompetitionRegistration {
  competitionId: number
  competitionName: string
  competitionDate: string
  teamName: string
  instituteName: string
  emergencyContact: string
  note: string
  submittedAt: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  adminEmails: string[]
  profile: UserProfile | null
  registrations: CompetitionRegistration[]
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (fullName: string, email: string, password: string, educationLevel?: string, instituteName?: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (profile: UserProfile) => Promise<void>
  addRegistration: (registration: CompetitionRegistration) => Promise<void>
  grantAdminAccess: (email: string) => Promise<void>
  revokeAdminAccess: (email: string) => Promise<void>
  isProfileComplete: boolean
  isRegisteredForCompetition: (competitionId: number) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminEmails, setAdminEmails] = useState<string[]>([SUPER_ADMIN_EMAIL])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [registrations, setRegistrations] = useState<CompetitionRegistration[]>([])

  useEffect(() => {
    const firebaseAuth = getFirebaseAuth()
    if (!firebaseAuth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      void (async () => {
        try {
          if (!firebaseUser?.email) {
            setUser(null)
            setProfile(null)
            setRegistrations([])
            return
          }

      const syncedUser: AuthUser = {
        id: firebaseUser.uid,
        fullName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        email: firebaseUser.email,
        avatarDataUrl: firebaseUser.photoURL || undefined,
        provider: 'email',
      }

      setUser(syncedUser)

      const db = getFirestoreDb()
      if (!db) {
        const defaultVerification = defaultVerificationByEmail(syncedUser.email)
        setProfile({
          fullName: syncedUser.fullName,
          email: syncedUser.email,
          phone: '',
          educationLevel: '',
          instituteName: '',
          address: '',
          dateOfBirth: '',
          idType: 'birth-registration',
          idNumber: '',
          profilePhotoDataUrl: '',
          idDocumentPhotoDataUrl: '',
          verificationStatus: defaultVerification,
          verificationReason: '',
          verificationUpdatedAt: Date.now(),
        })
        setRegistrations([])
        return
      }

          const profileRef = doc(db, 'profiles', syncedUser.id)
          const registrationRef = doc(db, 'userRegistrations', syncedUser.id)
          const adminRolesRef = doc(db, 'adminSettings', ADMIN_ROLES_DOC)

          let profileSnap, registrationSnap, adminRolesSnap
          try {
            ;[profileSnap, registrationSnap, adminRolesSnap] = await Promise.all([
              getDoc(profileRef),
              getDoc(registrationRef),
              getDoc(adminRolesRef),
            ])
          } catch (readError) {
            console.error('[AuthProvider] Firestore read failed — check your Firestore security rules:', readError)
            const defaultVerification = defaultVerificationByEmail(syncedUser.email)
            setProfile({
              fullName: syncedUser.fullName,
              email: syncedUser.email,
              phone: '',
              educationLevel: '',
              instituteName: '',
              address: '',
              dateOfBirth: '',
              idType: 'birth-registration',
              idNumber: '',
              profilePhotoDataUrl: '',
              idDocumentPhotoDataUrl: '',
              verificationStatus: defaultVerification,
              verificationReason: '',
              verificationUpdatedAt: Date.now(),
            })
            setRegistrations([])
            return
          }

          const storedAdmins = adminRolesSnap.exists()
        ? ((adminRolesSnap.data().emails as string[] | undefined) ?? [])
            .map((email) => email.trim().toLowerCase())
            .filter(Boolean)
        : []

      if (!storedAdmins.includes(SUPER_ADMIN_EMAIL)) {
        const nextAdmins = Array.from(new Set([SUPER_ADMIN_EMAIL, ...storedAdmins]))
        setAdminEmails(nextAdmins)
        await setDoc(adminRolesRef, { emails: nextAdmins, updatedAt: Date.now() }, { merge: true })
      } else {
        setAdminEmails(Array.from(new Set(storedAdmins)))
      }

      if (profileSnap.exists()) {
        const profileData = profileSnap.data() as Partial<UserProfile>
        const shouldForceVerified = isAdminEmail(syncedUser.email)
        const resolvedVerificationStatus = shouldForceVerified
          ? 'verified'
          : (profileData.verificationStatus || 'pending')
        const resolvedVerificationReason = shouldForceVerified
          ? ''
          : (profileData.verificationReason || '')
        const resolvedVerificationUpdatedAt = shouldForceVerified
          ? Date.now()
          : (profileData.verificationUpdatedAt || Date.now())

        setProfile({
          fullName: profileData.fullName || syncedUser.fullName,
          email: syncedUser.email,
          phone: profileData.phone || '',
          educationLevel: profileData.educationLevel || '',
          instituteName: profileData.instituteName || '',
          address: profileData.address || '',
          dateOfBirth: profileData.dateOfBirth || '',
          idType: profileData.idType || 'birth-registration',
          idNumber: profileData.idNumber || '',
          profilePhotoDataUrl: profileData.profilePhotoDataUrl || '',
          idDocumentPhotoDataUrl: profileData.idDocumentPhotoDataUrl || '',
          verificationStatus: resolvedVerificationStatus,
          verificationReason: resolvedVerificationReason,
          verificationUpdatedAt: resolvedVerificationUpdatedAt,
        })

        if (shouldForceVerified && profileData.verificationStatus !== 'verified') {
          await setDoc(
            profileRef,
            {
              verificationStatus: 'verified',
              verificationReason: '',
              verificationUpdatedAt: Date.now(),
              updatedAt: Date.now(),
            },
            { merge: true },
          )
        }
      } else {
        const defaultVerification = defaultVerificationByEmail(syncedUser.email)
        setProfile({
          fullName: syncedUser.fullName,
          email: syncedUser.email,
          phone: '',
          educationLevel: '',
          instituteName: '',
          address: '',
          dateOfBirth: '',
          idType: 'birth-registration',
          idNumber: '',
          profilePhotoDataUrl: '',
          idDocumentPhotoDataUrl: '',
          verificationStatus: defaultVerification,
          verificationReason: '',
          verificationUpdatedAt: Date.now(),
        })

        if (defaultVerification === 'verified') {
          await setDoc(
            profileRef,
            {
              fullName: syncedUser.fullName,
              email: syncedUser.email,
              verificationStatus: 'verified',
              verificationReason: '',
              verificationUpdatedAt: Date.now(),
              updatedAt: Date.now(),
            },
            { merge: true },
          )
        }
      }

      if (registrationSnap.exists()) {
        const registrationData = registrationSnap.data() as { items?: CompetitionRegistration[] }
        setRegistrations(registrationData.items ?? [])
      } else {
        setRegistrations([])
      }

        } catch (unexpectedError) {
          console.error('[AuthProvider] Unexpected error in auth state handler:', unexpectedError)
        } finally {
          setLoading(false)
        }
      })()
    })

    return () => unsubscribe()
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    const firebaseAuth = getFirebaseAuth()
    if (!firebaseAuth) throw new Error('Firebase is not configured')

    await signInWithEmailAndPassword(firebaseAuth, email, password)
  }

  const signUpWithEmail = async (fullName: string, email: string, password: string, educationLevel = '', instituteName = '') => {
    const firebaseAuth = getFirebaseAuth()
    if (!firebaseAuth) throw new Error('Firebase is not configured')

    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)

    if (firebaseAuth.currentUser) {
      await updateFirebaseProfile(firebaseAuth.currentUser, { displayName: fullName })
    }

    const defaultVerification = defaultVerificationByEmail(email)
    const now = Date.now()
    const createdProfile: UserProfile = {
      fullName,
      email,
      phone: '',
      educationLevel,
      instituteName,
      address: '',
      dateOfBirth: '',
      idType: 'birth-registration',
      idNumber: '',
      profilePhotoDataUrl: '',
      idDocumentPhotoDataUrl: '',
      verificationStatus: defaultVerification,
      verificationReason: '',
      verificationUpdatedAt: now,
    }

    const db = getFirestoreDb()
    if (db) {
      await Promise.all([
        setDoc(
          doc(db, 'profiles', credential.user.uid),
          {
            ...createdProfile,
            updatedAt: now,
          },
          { merge: true },
        ),
        setDoc(
          doc(db, 'userRegistrations', credential.user.uid),
          {
            items: [],
            updatedAt: now,
          },
          { merge: true },
        ),
      ])
    }

    setProfile(createdProfile)
    setUser({
      id: credential.user.uid,
      fullName,
      email,
      avatarDataUrl: credential.user.photoURL || undefined,
      provider: 'email',
    })
    setRegistrations([])
  }

  const signOut = async () => {
    const firebaseAuth = getFirebaseAuth()
    setUser(null)
    setProfile(null)
    setRegistrations([])
    if (firebaseAuth) {
      await firebaseSignOut(firebaseAuth)
    }
  }

  const updateProfile = async (nextProfile: UserProfile) => {
    const normalizedProfile = isAdminEmail(nextProfile.email)
      ? {
          ...nextProfile,
          verificationStatus: 'verified' as const,
          verificationReason: '',
          verificationUpdatedAt: Date.now(),
        }
      : nextProfile

    if (!user) {
      throw new Error('No authenticated user found.')
    }

    const db = getFirestoreDb()
    if (!db) {
      throw new Error('Firestore is not configured. Check Firebase environment variables on Vercel.')
    }

    try {
      await setDoc(
        doc(db, 'profiles', user.id),
        {
          ...normalizedProfile,
          updatedAt: Date.now(),
        },
        { merge: true }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to write profile to Firestore.'
      throw new Error(message)
    }

    // Only update local state after Firestore confirms the write
    setProfile(normalizedProfile)
    setUser((current) => {
      if (!current) return current
      return {
        ...current,
        fullName: normalizedProfile.fullName,
        email: normalizedProfile.email,
        avatarDataUrl: normalizedProfile.profilePhotoDataUrl || current.avatarDataUrl,
      }
    })
  }

  const addRegistration = async (registration: CompetitionRegistration) => {
    if (!user) {
      throw new Error('No authenticated user found.')
    }

    const db = getFirestoreDb()
    if (!db) {
      throw new Error('Firestore is not configured. Check Firebase environment variables on Vercel.')
    }

    const registrationRef = doc(db, 'userRegistrations', user.id)
    const registrationSnap = await getDoc(registrationRef)
    const currentItems = registrationSnap.exists()
      ? ((registrationSnap.data() as { items?: CompetitionRegistration[] }).items ?? [])
      : []

    if (currentItems.some((entry) => entry.competitionId === registration.competitionId)) {
      setRegistrations(currentItems)
      return
    }

    const nextItems = [registration, ...currentItems]

    await setDoc(
      registrationRef,
      {
        items: nextItems,
        updatedAt: Date.now(),
      },
      { merge: true }
    )

    setRegistrations(nextItems)
  }

  const grantAdminAccess = async (email: string) => {
    if (!user?.email || user.email.toLowerCase() !== SUPER_ADMIN_EMAIL) {
      throw new Error('Only super admin can assign admin access.')
    }

    const normalized = email.trim().toLowerCase()
    if (!normalized) {
      throw new Error('Admin email is required.')
    }

    const db = getFirestoreDb()
    if (!db) {
      throw new Error('Firestore is not configured.')
    }

    const nextAdmins = Array.from(new Set([...adminEmails, normalized, SUPER_ADMIN_EMAIL]))
    await setDoc(
      doc(db, 'adminSettings', ADMIN_ROLES_DOC),
      {
        emails: nextAdmins,
        updatedAt: Date.now(),
      },
      { merge: true },
    )
    setAdminEmails(nextAdmins)
  }

  const revokeAdminAccess = async (email: string) => {
    if (!user?.email || user.email.toLowerCase() !== SUPER_ADMIN_EMAIL) {
      throw new Error('Only super admin can remove admin access.')
    }

    const normalized = email.trim().toLowerCase()
    if (!normalized || normalized === SUPER_ADMIN_EMAIL) {
      throw new Error('Super admin access cannot be removed.')
    }

    const db = getFirestoreDb()
    if (!db) {
      throw new Error('Firestore is not configured.')
    }

    const nextAdmins = adminEmails.filter((item) => item !== normalized)
    await setDoc(
      doc(db, 'adminSettings', ADMIN_ROLES_DOC),
      {
        emails: nextAdmins,
        updatedAt: Date.now(),
      },
      { merge: true },
    )
    setAdminEmails(nextAdmins)
  }

  const isSuperAdmin = user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL
  const isAdmin = Boolean(user?.email && (isSuperAdmin || adminEmails.includes(user.email.toLowerCase())))

  const isProfileComplete = useMemo(() => {
    if (!profile) return false

    return Boolean(
      profile.fullName &&
        profile.email &&
        profile.phone &&
        profile.educationLevel &&
        profile.instituteName &&
        profile.address &&
        profile.dateOfBirth &&
        profile.idType &&
        profile.idNumber &&
        profile.profilePhotoDataUrl &&
        profile.idDocumentPhotoDataUrl
    )
  }, [profile])

  const isRegisteredForCompetition = (competitionId: number) => {
    return registrations.some((entry) => entry.competitionId === competitionId)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isSuperAdmin,
        adminEmails,
        profile,
        registrations,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updateProfile,
        addRegistration,
        grantAdminAccess,
        revokeAdminAccess,
        isProfileComplete,
        isRegisteredForCompetition,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export type { UserProfile, CompetitionRegistration }
