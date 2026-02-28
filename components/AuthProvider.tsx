'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { signOut as nextAuthSignOut, useSession } from 'next-auth/react'

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
  signInWithEmail: (email: string) => void
  signUpWithEmail: (fullName: string, email: string) => void
  signInWithGoogle: () => void
  signOut: () => void
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
  const { data: session, status } = useSession()
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
    if (status === 'loading') return

    if (!session?.user?.email) {
      return
    }

    const googleUser: AuthUser = {
      id: session.user.email,
      fullName: session.user.name || session.user.email.split('@')[0],
      email: session.user.email,
      avatarDataUrl: session.user.image || undefined,
      provider: 'google',
    }

    setUser((current) => {
      if (!current) return googleUser
      if (current.email !== googleUser.email || current.provider !== 'google') {
        return { ...googleUser, avatarDataUrl: current.avatarDataUrl || googleUser.avatarDataUrl }
      }
      return { ...current, ...googleUser, avatarDataUrl: current.avatarDataUrl || googleUser.avatarDataUrl }
    })

    setProfile((current) => {
      if (!current) {
        return {
          fullName: googleUser.fullName,
          email: googleUser.email,
          phone: '',
          address: '',
          dateOfBirth: '',
          idType: 'birth-registration',
          idNumber: '',
          profilePhotoDataUrl: '',
          idDocumentPhotoDataUrl: '',
        }
      }

      if (current.email === googleUser.email) {
        return {
          ...current,
          fullName: current.fullName || googleUser.fullName,
          email: googleUser.email,
        }
      }

      return {
        fullName: googleUser.fullName,
        email: googleUser.email,
        phone: '',
        address: '',
        dateOfBirth: '',
        idType: 'birth-registration',
        idNumber: '',
        profilePhotoDataUrl: '',
        idDocumentPhotoDataUrl: '',
      }
    })
  }, [session, status])

  const signInWithEmail = (email: string) => {
    setUser((current) => ({
      id: current?.id ?? makeId(),
      fullName: current?.fullName ?? email.split('@')[0],
      email,
      avatarDataUrl: current?.avatarDataUrl,
      provider: 'email',
    }))
  }

  const signUpWithEmail = (fullName: string, email: string) => {
    const createdUser: AuthUser = {
      id: makeId(),
      fullName,
      email,
      provider: 'email',
    }

    setUser(createdUser)
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
  }

  const signInWithGoogle = () => undefined

  const signOut = () => {
    setUser(null)
    nextAuthSignOut({ redirect: false })
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
        signInWithGoogle,
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
