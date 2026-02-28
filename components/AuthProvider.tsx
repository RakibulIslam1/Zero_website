'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth'
import { getFirebaseAuth } from '../lib/firebase'

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
  profile: UserProfile | null
  registrations: CompetitionRegistration[]
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (fullName: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (profile: UserProfile) => void
  addRegistration: (registration: CompetitionRegistration) => void
  isProfileComplete: boolean
  isRegisteredForCompetition: (competitionId: number) => boolean
}

const STORAGE_KEY = 'zero-competitions-auth-state'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [registrations, setRegistrations] = useState<CompetitionRegistration[]>([])

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as {
        user: AuthUser | null
        profile: UserProfile | null
        registrations: CompetitionRegistration[]
      }
      setUser(parsed.user)
      setProfile(parsed.profile)
      setRegistrations(parsed.registrations ?? [])
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user,
        profile,
        registrations,
      })
    )
  }, [user, profile, registrations])

  useEffect(() => {
    const firebaseAuth = getFirebaseAuth()
    if (!firebaseAuth) return

    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (!firebaseUser?.email) {
        setUser(null)
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

      setProfile((current) => {
        if (!current || current.email !== firebaseUser.email) {
          return {
            fullName: syncedUser.fullName,
            email: syncedUser.email,
            phone: '',
            address: '',
            dateOfBirth: '',
            idType: 'birth-registration',
            idNumber: '',
            profilePhotoDataUrl: '',
            idDocumentPhotoDataUrl: '',
          }
        }

        return {
          ...current,
          fullName: current.fullName || syncedUser.fullName,
          email: syncedUser.email,
        }
      })
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
    if (firebaseAuth) {
      await firebaseSignOut(firebaseAuth)
    }
  }

  const updateProfile = (nextProfile: UserProfile) => {
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
  }

  const addRegistration = (registration: CompetitionRegistration) => {
    setRegistrations((current) => {
      if (current.some((entry) => entry.competitionId === registration.competitionId)) {
        return current
      }
      return [registration, ...current]
    })
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
