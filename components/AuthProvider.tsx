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
  profile: UserProfile | null
  registrations: CompetitionRegistration[]
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (fullName: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (profile: UserProfile) => Promise<void>
  addRegistration: (registration: CompetitionRegistration) => Promise<void>
  isProfileComplete: boolean
  isRegisteredForCompetition: (competitionId: number) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [registrations, setRegistrations] = useState<CompetitionRegistration[]>([])

  useEffect(() => {
    const firebaseAuth = getFirebaseAuth()
    if (!firebaseAuth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser?.email) {
        setUser(null)
        setProfile(null)
        setRegistrations([])
        setLoading(false)
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
        setProfile({
          fullName: syncedUser.fullName,
          email: syncedUser.email,
          phone: '',
          address: '',
          dateOfBirth: '',
          idType: 'birth-registration',
          idNumber: '',
          profilePhotoDataUrl: '',
          idDocumentPhotoDataUrl: '',
          verificationStatus: 'pending',
          verificationReason: '',
          verificationUpdatedAt: Date.now(),
        })
        setRegistrations([])
        setLoading(false)
        return
      }

      const profileRef = doc(db, 'profiles', syncedUser.id)
      const registrationRef = doc(db, 'userRegistrations', syncedUser.id)

      const [profileSnap, registrationSnap] = await Promise.all([
        getDoc(profileRef),
        getDoc(registrationRef),
      ])

      if (profileSnap.exists()) {
        const profileData = profileSnap.data() as Partial<UserProfile>
        setProfile({
          fullName: profileData.fullName || syncedUser.fullName,
          email: syncedUser.email,
          phone: profileData.phone || '',
          address: profileData.address || '',
          dateOfBirth: profileData.dateOfBirth || '',
          idType: profileData.idType || 'birth-registration',
          idNumber: profileData.idNumber || '',
          profilePhotoDataUrl: profileData.profilePhotoDataUrl || '',
          idDocumentPhotoDataUrl: profileData.idDocumentPhotoDataUrl || '',
          verificationStatus: profileData.verificationStatus || 'pending',
          verificationReason: profileData.verificationReason || '',
          verificationUpdatedAt: profileData.verificationUpdatedAt || Date.now(),
        })
      } else {
        setProfile({
          fullName: syncedUser.fullName,
          email: syncedUser.email,
          phone: '',
          address: '',
          dateOfBirth: '',
          idType: 'birth-registration',
          idNumber: '',
          profilePhotoDataUrl: '',
          idDocumentPhotoDataUrl: '',
          verificationStatus: 'pending',
          verificationReason: '',
          verificationUpdatedAt: Date.now(),
        })
      }

      if (registrationSnap.exists()) {
        const registrationData = registrationSnap.data() as { items?: CompetitionRegistration[] }
        setRegistrations(registrationData.items ?? [])
      } else {
        setRegistrations([])
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    const firebaseAuth = getFirebaseAuth()
    if (!firebaseAuth) throw new Error('Firebase is not configured')

    await signInWithEmailAndPassword(firebaseAuth, email, password)
  }

  const signUpWithEmail = async (fullName: string, email: string, password: string) => {
    const firebaseAuth = getFirebaseAuth()
    if (!firebaseAuth) throw new Error('Firebase is not configured')

    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)

    if (firebaseAuth.currentUser) {
      await updateFirebaseProfile(firebaseAuth.currentUser, { displayName: fullName })
    }

    setProfile((prev) => ({
      fullName,
      email,
      phone: prev?.phone ?? '',
      address: prev?.address ?? '',
      dateOfBirth: prev?.dateOfBirth ?? '',
      idType: prev?.idType ?? 'birth-registration',
      idNumber: prev?.idNumber ?? '',
      profilePhotoDataUrl: prev?.profilePhotoDataUrl ?? '',
      idDocumentPhotoDataUrl: prev?.idDocumentPhotoDataUrl ?? '',
      verificationStatus: prev?.verificationStatus ?? 'pending',
      verificationReason: prev?.verificationReason ?? '',
      verificationUpdatedAt: prev?.verificationUpdatedAt ?? Date.now(),
    }))
    setUser({
      id: credential.user.uid,
      fullName,
      email,
      avatarDataUrl: credential.user.photoURL || undefined,
      provider: 'email',
    })
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
    setProfile(nextProfile)
    setUser((current) => {
      if (!current) return current
      return {
        ...current,
        fullName: nextProfile.fullName,
        email: nextProfile.email,
        avatarDataUrl: nextProfile.profilePhotoDataUrl || current.avatarDataUrl,
      }
    })

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
          ...nextProfile,
          updatedAt: Date.now(),
        },
        { merge: true }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to write profile to Firestore.'
      throw new Error(message)
    }
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

  const isProfileComplete = useMemo(() => {
    if (!profile) return false

    return Boolean(
      profile.fullName &&
        profile.email &&
        profile.phone &&
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
        profile,
        registrations,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updateProfile,
        addRegistration,
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
