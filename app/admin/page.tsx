'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { useAuth, UserProfile } from '@/components/AuthProvider'
import { getFirebaseAuth, getFirestoreDb } from '@/lib/firebase'
import { defaultSiteContactSettings } from '@/lib/siteContact'
import { defaultSiteFeatureBannerSettings } from '@/lib/siteFeatureBanner'
import {
  defaultHomepageModulesSettings,
  HomepageModulesSettings,
  PartnerLogo,
} from '@/lib/homepageModules'
import {
  defaultJoinUsSettings,
  isJoinUsFileAnswer,
  JoinUsAnswerValue,
  JoinUsField,
  JoinUsSettings,
} from '@/lib/joinUs'
import { useNotification } from '@/components/NotificationProvider'

type AdminProfileRow = UserProfile & { uid: string }
type AdminRegistration = {
  competitionId: number
  competitionName: string
  competitionDate: string
  teamName: string
  submittedAt: string
}
type ContactMessage = {
  id: string
  name?: string
  email?: string
  subject?: string
  createdAt?: number
  updatedAt?: number
  status?: string
  messages?: Array<{
    sender: 'user' | 'admin'
    text: string
    createdAt: number
    senderName?: string
  }>
}

type SiteContactSettings = {
  address: string
  phonePrimary: string
  phoneSecondary: string
  email: string
  officeHours: string
}

type SiteFeatureBannerSettings = {
  imageDataUrl: string
  linkUrl: string
}

type RecruitmentApplication = {
  id: string
  fullName?: string
  email?: string
  phone?: string
  photoUrl?: string
  photoStoragePath?: string
  photoDataUrl?: string
  answers?: Record<string, JoinUsAnswerValue>
  createdAt?: number
  status?: string
}

const defaultSiteContactFormValues: SiteContactSettings = {
  address: defaultSiteContactSettings.address,
  phonePrimary: defaultSiteContactSettings.phones[0] || '',
  phoneSecondary: defaultSiteContactSettings.phones[1] || '',
  email: defaultSiteContactSettings.email,
  officeHours: defaultSiteContactSettings.officeHours,
}

const SUPER_ADMIN_EMAIL = 'rakibul.rir06@gmail.com'

export default function AdminPage() {
  const router = useRouter()
  const {
    user,
    loading: authLoading,
    isAdmin,
    isSuperAdmin,
    adminEmails,
    grantAdminAccess,
    revokeAdminAccess,
  } = useAuth()
  const { notifyError, notifySuccess } = useNotification()

  const [rows, setRows] = useState<AdminProfileRow[]>([])
  const [loadingRows, setLoadingRows] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeUid, setActiveUid] = useState<string | null>(null)
  const [cancelReasons, setCancelReasons] = useState<Record<string, string>>({})
  const [selectedUid, setSelectedUid] = useState<string>('')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [adminActionMessage, setAdminActionMessage] = useState('')
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [lightboxAlt, setLightboxAlt] = useState('')
  const [activeTab, setActiveTab] = useState<'nonVerified' | 'verified' | null>(null)
  const [nameSearch, setNameSearch] = useState('')
  const [registrationsByUid, setRegistrationsByUid] = useState<Record<string, AdminRegistration[]>>({})
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [loadingContactMessages, setLoadingContactMessages] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'profiles' | 'messages' | 'contactSettings' | 'featureBanner' | 'homepageModules' | 'recruitment'>('overview')
  const [selectedContactId, setSelectedContactId] = useState('')
  const [replyDraft, setReplyDraft] = useState('')
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [siteContactSettings, setSiteContactSettings] = useState<SiteContactSettings>(defaultSiteContactFormValues)
  const [loadingSiteContactSettings, setLoadingSiteContactSettings] = useState(true)
  const [savingSiteContactSettings, setSavingSiteContactSettings] = useState(false)
  const [siteContactMessage, setSiteContactMessage] = useState('')
  const [siteFeatureBannerSettings, setSiteFeatureBannerSettings] = useState<SiteFeatureBannerSettings>(defaultSiteFeatureBannerSettings)
  const [loadingFeatureBannerSettings, setLoadingFeatureBannerSettings] = useState(true)
  const [savingFeatureBannerSettings, setSavingFeatureBannerSettings] = useState(false)
  const [featureBannerMessage, setFeatureBannerMessage] = useState('')
  const [featureBannerUploadError, setFeatureBannerUploadError] = useState('')
  const [homepageModulesSettings, setHomepageModulesSettings] = useState<HomepageModulesSettings>(defaultHomepageModulesSettings)
  const [loadingHomepageModulesSettings, setLoadingHomepageModulesSettings] = useState(true)
  const [savingHomepageModulesSettings, setSavingHomepageModulesSettings] = useState(false)
  const [homepageModulesMessage, setHomepageModulesMessage] = useState('')
  const [homepageModulesUploadError, setHomepageModulesUploadError] = useState('')
  const [isDeletingContact, setIsDeletingContact] = useState(false)
  const [joinUsSettings, setJoinUsSettings] = useState<JoinUsSettings>(defaultJoinUsSettings)
  const [loadingJoinUsData, setLoadingJoinUsData] = useState(true)
  const [savingJoinUsSettings, setSavingJoinUsSettings] = useState(false)
  const [joinUsMessage, setJoinUsMessage] = useState('')
  const [joinUsUploadError, setJoinUsUploadError] = useState('')
  const [recruitmentApplications, setRecruitmentApplications] = useState<RecruitmentApplication[]>([])
  const [selectedRecruitmentId, setSelectedRecruitmentId] = useState('')

  useEffect(() => {
    if (!error) return
    notifyError(error)
    setError(null)
  }, [error, notifyError])

  useEffect(() => {
    if (!adminActionMessage) return
    notifySuccess(adminActionMessage)
    setAdminActionMessage('')
  }, [adminActionMessage, notifySuccess])

  useEffect(() => {
    if (!siteContactMessage) return
    notifySuccess(siteContactMessage)
    setSiteContactMessage('')
  }, [siteContactMessage, notifySuccess])

  useEffect(() => {
    if (!featureBannerMessage) return
    notifySuccess(featureBannerMessage)
    setFeatureBannerMessage('')
  }, [featureBannerMessage, notifySuccess])

  useEffect(() => {
    if (!homepageModulesMessage) return
    notifySuccess(homepageModulesMessage)
    setHomepageModulesMessage('')
  }, [homepageModulesMessage, notifySuccess])

  useEffect(() => {
    if (!joinUsMessage) return
    notifySuccess(joinUsMessage)
    setJoinUsMessage('')
  }, [joinUsMessage, notifySuccess])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (authLoading || !user || !isAdmin) return

    const loadProfiles = async () => {
      setLoadingRows(true)
      setError(null)

      const db = getFirestoreDb()
      if (!db) {
        setError('Firestore is not configured. Set NEXT_PUBLIC_FIREBASE_* values.')
        setLoadingRows(false)
        return
      }

      try {
        const profilesRef = collection(db, 'profiles')
        const registrationsRef = collection(db, 'userRegistrations')
        const [snap, registrationsSnap] = await Promise.all([getDocs(profilesRef), getDocs(registrationsRef)])

        const items = snap.docs
          .map((item) => ({
            uid: item.id,
            ...(item.data() as UserProfile),
            educationLevel: (item.data().educationLevel as string) || '',
            instituteName: (item.data().instituteName as string) || '',
            verificationStatus: (item.data().verificationStatus as UserProfile['verificationStatus']) || 'pending',
            verificationReason: (item.data().verificationReason as string) || '',
            verificationUpdatedAt: (item.data().verificationUpdatedAt as number) || 0,
          }))
          .sort((a, b) => (b.verificationUpdatedAt || 0) - (a.verificationUpdatedAt || 0))

        const nextRegistrationsByUid: Record<string, AdminRegistration[]> = {}
        registrationsSnap.forEach((registrationDoc) => {
          const items = (registrationDoc.data().items as AdminRegistration[] | undefined) ?? []
          nextRegistrationsByUid[registrationDoc.id] = items
        })

        setRows(items)
        setRegistrationsByUid(nextRegistrationsByUid)
      } catch (err) {
        setError(toAdminError(err, 'Failed to load profiles.'))
      } finally {
        setLoadingRows(false)
      }
    }

    loadProfiles()
  }, [authLoading, user, isAdmin])

  useEffect(() => {
    if (authLoading || !user || !isAdmin) return

    const loadContactMessages = async () => {
      setLoadingContactMessages(true)

      try {
        const firebaseAuth = getFirebaseAuth()
        const token = await firebaseAuth?.currentUser?.getIdToken(true)
        if (!token) {
          setLoadingContactMessages(false)
          return
        }

        const response = await fetch('/api/admin/contact-messages', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(payload.error || 'Failed to load contact messages.')
        }

        const payload = (await response.json()) as { items?: ContactMessage[] }
        const items = payload.items ?? []
        setContactMessages(items)
        if (items.length > 0) {
          setSelectedContactId((current) => (current ? current : items[0].id))
        }
      } catch (err) {
        setError(toAdminError(err, 'Failed to load contact messages.'))
      } finally {
        setLoadingContactMessages(false)
      }
    }

    void loadContactMessages()
  }, [authLoading, user, isAdmin])

  useEffect(() => {
    if (authLoading || !user || !isAdmin) return

    const loadSiteContactSettings = async () => {
      setLoadingSiteContactSettings(true)

      try {
        const response = await fetch('/api/site-contact', {
          method: 'GET',
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(payload.error || 'Failed to load contact settings.')
        }

        const payload = (await response.json()) as {
          settings?: {
            address?: string
            phones?: string[]
            email?: string
            officeHours?: string
          }
        }

        const phones = payload.settings?.phones ?? []
        setSiteContactSettings({
          address: payload.settings?.address || defaultSiteContactFormValues.address,
          phonePrimary: phones[0] || defaultSiteContactFormValues.phonePrimary,
          phoneSecondary: phones[1] || '',
          email: payload.settings?.email || defaultSiteContactFormValues.email,
          officeHours: payload.settings?.officeHours || defaultSiteContactFormValues.officeHours,
        })
      } catch (err) {
        setError(toAdminError(err, 'Failed to load contact settings.'))
      } finally {
        setLoadingSiteContactSettings(false)
      }
    }

    void loadSiteContactSettings()
  }, [authLoading, user, isAdmin])

  useEffect(() => {
    if (authLoading || !user || !isAdmin) return

    const loadFeatureBannerSettings = async () => {
      setLoadingFeatureBannerSettings(true)

      try {
        const response = await fetch('/api/site-feature-banner', {
          method: 'GET',
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(payload.error || 'Failed to load feature banner settings.')
        }

        const payload = (await response.json()) as {
          settings?: {
            imageDataUrl?: string
            linkUrl?: string
          }
        }

        setSiteFeatureBannerSettings({
          imageDataUrl: payload.settings?.imageDataUrl || defaultSiteFeatureBannerSettings.imageDataUrl,
          linkUrl: payload.settings?.linkUrl || '',
        })
      } catch (err) {
        setError(toAdminError(err, 'Failed to load feature banner settings.'))
      } finally {
        setLoadingFeatureBannerSettings(false)
      }
    }

    void loadFeatureBannerSettings()
  }, [authLoading, user, isAdmin])

  useEffect(() => {
    if (authLoading || !user || !isAdmin) return

    const loadHomepageModulesSettings = async () => {
      setLoadingHomepageModulesSettings(true)

      try {
        const response = await fetch('/api/homepage-modules', {
          method: 'GET',
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(payload.error || 'Failed to load homepage modules settings.')
        }

        const payload = (await response.json()) as { settings?: HomepageModulesSettings }
        setHomepageModulesSettings(payload.settings || defaultHomepageModulesSettings)
      } catch (err) {
        setError(toAdminError(err, 'Failed to load homepage modules settings.'))
      } finally {
        setLoadingHomepageModulesSettings(false)
      }
    }

    void loadHomepageModulesSettings()
  }, [authLoading, user, isAdmin])

  useEffect(() => {
    if (authLoading || !user || !isAdmin) return

    const loadJoinUsData = async () => {
      setLoadingJoinUsData(true)

      try {
        const token = await getFirebaseAuth()?.currentUser?.getIdToken(true)
        if (!token) {
          setLoadingJoinUsData(false)
          return
        }

        const response = await fetch('/api/admin/join-us', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(payload.error || 'Failed to load recruitment data.')
        }

        const payload = (await response.json()) as {
          settings?: JoinUsSettings
          applications?: RecruitmentApplication[]
        }

        setJoinUsSettings(payload.settings || defaultJoinUsSettings)
        const items = payload.applications ?? []
        setRecruitmentApplications(items)
        if (items.length > 0) {
          setSelectedRecruitmentId((current) => current || items[0].id)
        }
      } catch (err) {
        setError(toAdminError(err, 'Failed to load recruitment data.'))
      } finally {
        setLoadingJoinUsData(false)
      }
    }

    void loadJoinUsData()
  }, [authLoading, user, isAdmin])

  const grouped = useMemo(() => {
    return {
      verified: rows.filter((row) => row.verificationStatus === 'verified'),
      nonVerified: rows.filter((row) => row.verificationStatus !== 'verified'),
      cancelled: rows.filter((row) => row.verificationStatus === 'cancelled'),
    }
  }, [rows])

  const selectedProfile = useMemo(
    () => rows.find((row) => row.uid === selectedUid) ?? null,
    [rows, selectedUid],
  )

  const selectedContact = useMemo(
    () => contactMessages.find((entry) => entry.id === selectedContactId) ?? null,
    [contactMessages, selectedContactId],
  )

  const selectedRecruitment = useMemo(
    () => recruitmentApplications.find((entry) => entry.id === selectedRecruitmentId) ?? null,
    [recruitmentApplications, selectedRecruitmentId],
  )

  const toAdminError = (error: unknown, fallback: string) => {
    if (error instanceof Error) {
      const lowered = error.message.toLowerCase()
      if (lowered.includes('permission-denied') || lowered.includes('missing or insufficient permissions')) {
        return 'Permission denied by Firestore rules. Please update Firestore rules to allow admin verify/cancel/delete actions.'
      }

      return error.message
    }

    return fallback
  }

  const updateStatus = async (target: AdminProfileRow, status: UserProfile['verificationStatus'], reason = '') => {
    if (target.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
      setError('Super admin account is permanently verified.')
      return
    }

    const db = getFirestoreDb()
    if (!db) {
      setError('Firestore is not configured.')
      return
    }

    setError(null)
    setActiveUid(target.uid)

    try {
      const now = Date.now()

      await updateDoc(doc(db, 'profiles', target.uid), {
        verificationStatus: status,
        verificationReason: reason,
        verificationUpdatedAt: now,
        updatedAt: now,
      })

      if (status === 'cancelled' && reason.trim()) {
        let cancellationMailStatus: 'sent' | 'failed' = 'sent'
        let cancellationMailError = ''

        try {
          const response = await fetch('/api/admin/rejection-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: target.email,
              fullName: target.fullName || 'Participant',
              reason,
            }),
          })

          if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as { error?: string }
            throw new Error(payload.error || 'Failed to send rejection email.')
          }
        } catch (mailError) {
          cancellationMailStatus = 'failed'
          cancellationMailError = mailError instanceof Error ? mailError.message : 'Failed to send rejection email.'
        }

        await setDoc(doc(db, 'userRegistrations', target.uid), {
          verificationStatus: 'cancelled',
          verificationReason: reason,
          verificationUpdatedAt: now,
          cancellationMailStatus,
          cancellationMailError,
          updatedAt: now,
        }, { merge: true })

        if (cancellationMailStatus === 'failed') {
          setError(`Verification cancelled but email sending failed: ${cancellationMailError}`)
        }
      }

      setRows((prev) =>
        prev.map((item) =>
          item.uid === target.uid
            ? {
                ...item,
                verificationStatus: status,
                verificationReason: reason,
                verificationUpdatedAt: now,
              }
            : item,
        ),
      )
    } catch (err) {
      const message = toAdminError(err, 'Failed to update verification status.')
      setError(message)
      throw new Error(message)
    } finally {
      setActiveUid(null)
      setCancelReasons((prev) => ({ ...prev, [target.uid]: '' }))
    }
  }

  const handleDeleteAccountData = async (target: AdminProfileRow) => {
    if (target.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
      setError('Super admin account data cannot be deleted from panel.')
      return
    }

    const status = target.verificationStatus || 'pending'
    const cancellationReason = (cancelReasons[target.uid] || '').trim()

    if (status !== 'verified') {
      if (!cancellationReason) {
        setError('Please provide a cancellation reason before deleting this account.')
        return
      }

      try {
        const response = await fetch('/api/admin/rejection-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: target.email,
            fullName: target.fullName || 'Participant',
            reason: cancellationReason,
          }),
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(payload.error || 'Failed to send rejection email.')
        }
      } catch (mailError) {
        setError(mailError instanceof Error ? mailError.message : 'Failed to send rejection email.')
        return
      }
    }

    const firebaseAuth = getFirebaseAuth()
    const token = await firebaseAuth?.currentUser?.getIdToken(true)
    if (!token) {
      setError('You must be logged in as admin to delete this account.')
      return
    }

    setActiveUid(target.uid)
    setError(null)

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: target.uid,
          email: target.email,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Failed to delete account.')
      }

      setRows((prev) => prev.filter((item) => item.uid !== target.uid))
      setRegistrationsByUid((prev) => {
        const next = { ...prev }
        delete next[target.uid]
        return next
      })
      setCancelReasons((prev) => {
        const next = { ...prev }
        delete next[target.uid]
        return next
      })
      setSelectedUid('')
    } catch (err) {
      setError(toAdminError(err, 'Failed to delete account data and auth user.'))
    } finally {
      setActiveUid(null)
    }
  }

  const handleAssignAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAdminActionMessage('')
    setError(null)

    const email = newAdminEmail.trim().toLowerCase()
    if (!email) {
      setError('Enter an email to assign admin access.')
      return
    }

    try {
      await grantAdminAccess(email)
      setAdminActionMessage('Admin access granted successfully.')
      setNewAdminEmail('')
    } catch (err) {
      setError(toAdminError(err, 'Failed to grant admin access.'))
    }
  }

  const handleRemoveAdmin = async (email: string) => {
    setAdminActionMessage('')
    setError(null)

    try {
      await revokeAdminAccess(email)
      setAdminActionMessage('Admin access removed successfully.')
    } catch (err) {
      setError(toAdminError(err, 'Failed to remove admin access.'))
    }
  }

  const handleSendContactReply = async () => {
    if (!selectedContact) {
      setError('Select a message thread to reply.')
      return
    }

    const text = replyDraft.trim()
    if (!text) {
      setError('Reply cannot be empty.')
      return
    }

    setError(null)
    setIsSendingReply(true)

    try {
      const token = await getFirebaseAuth()?.currentUser?.getIdToken(true)
      if (!token) {
        throw new Error('You must be logged in as admin to send replies.')
      }

      const response = await fetch('/api/admin/contact-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contactId: selectedContact.id,
          reply: text,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Failed to send reply.')
      }

      const now = Date.now()
      setContactMessages((prev) =>
        prev.map((entry) =>
          entry.id === selectedContact.id
            ? {
                ...entry,
                updatedAt: now,
                messages: [
                  ...(entry.messages ?? []),
                  {
                    sender: 'admin',
                    text,
                    createdAt: now,
                    senderName: user?.fullName || user?.email || 'Admin',
                  },
                ],
              }
            : entry,
        ),
      )
      setReplyDraft('')
    } catch (err) {
      setError(toAdminError(err, 'Failed to send reply.'))
    } finally {
      setIsSendingReply(false)
    }
  }

  const handleDeleteContactThread = async () => {
    if (!selectedContact) {
      setError('Select a message thread to delete.')
      return
    }

    if (!isSuperAdmin) {
      setError('Only super admin can delete chat threads.')
      return
    }

    setError(null)
    setIsDeletingContact(true)

    try {
      const token = await getFirebaseAuth()?.currentUser?.getIdToken(true)
      if (!token) {
        throw new Error('You must be logged in as super admin to delete chats.')
      }

      const response = await fetch('/api/admin/contact-messages', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contactId: selectedContact.id,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Failed to delete conversation.')
      }

      const deletedId = selectedContact.id
      const nextItems = contactMessages.filter((entry) => entry.id !== deletedId)
      setContactMessages(nextItems)
      setSelectedContactId(nextItems[0]?.id || '')
      setReplyDraft('')
      notifySuccess('Conversation deleted successfully.')
    } catch (err) {
      setError(toAdminError(err, 'Failed to delete conversation.'))
    } finally {
      setIsDeletingContact(false)
    }
  }

  const handleSaveSiteContactSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSiteContactMessage('')
    setSavingSiteContactSettings(true)

    try {
      const token = await getFirebaseAuth()?.currentUser?.getIdToken(true)
      if (!token) {
        throw new Error('You must be logged in as admin to update contact settings.')
      }

      const phones = [siteContactSettings.phonePrimary, siteContactSettings.phoneSecondary]
        .map((phone) => phone.trim())
        .filter(Boolean)

      const response = await fetch('/api/site-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address: siteContactSettings.address,
          phones,
          email: siteContactSettings.email,
          officeHours: siteContactSettings.officeHours,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Failed to update contact settings.')
      }

      setSiteContactMessage('Contact information updated successfully.')
    } catch (err) {
      setError(toAdminError(err, 'Failed to update contact settings.'))
    } finally {
      setSavingSiteContactSettings(false)
    }
  }

  const handleFeatureBannerFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setFeatureBannerUploadError('')

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setFeatureBannerUploadError('Please upload an image file only.')
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      setFeatureBannerUploadError('Image size must be 3MB or less.')
      return
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Failed to read image file.'))
      reader.readAsDataURL(file)
    }).catch(() => '')

    if (!dataUrl) {
      setFeatureBannerUploadError('Failed to process image file.')
      return
    }

    setSiteFeatureBannerSettings((prev) => ({
      ...prev,
      imageDataUrl: dataUrl,
    }))
  }

  const handleSaveFeatureBannerSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setFeatureBannerMessage('')
    setFeatureBannerUploadError('')
    setSavingFeatureBannerSettings(true)

    try {
      const token = await getFirebaseAuth()?.currentUser?.getIdToken(true)
      if (!token) {
        throw new Error('You must be logged in as admin to update feature banner.')
      }

      if (!siteFeatureBannerSettings.imageDataUrl.trim()) {
        throw new Error('Banner image is required.')
      }

      const response = await fetch('/api/site-feature-banner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageDataUrl: siteFeatureBannerSettings.imageDataUrl,
          linkUrl: siteFeatureBannerSettings.linkUrl,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Failed to update feature banner settings.')
      }

      setFeatureBannerMessage('Feature banner updated successfully.')
    } catch (err) {
      setError(toAdminError(err, 'Failed to update feature banner settings.'))
    } finally {
      setSavingFeatureBannerSettings(false)
    }
  }

  const handleAddPartner = () => {
    const next: PartnerLogo = {
      id: `partner_${Date.now()}`,
      name: 'New Partner',
      imageDataUrl: '',
    }
    setHomepageModulesSettings((prev) => ({
      ...prev,
      partners: [...prev.partners, next],
    }))
  }

  const handleRemovePartner = (id: string) => {
    setHomepageModulesSettings((prev) => ({
      ...prev,
      partners: prev.partners.filter((entry) => entry.id !== id),
    }))
  }

  const handlePartnerNameChange = (id: string, name: string) => {
    setHomepageModulesSettings((prev) => ({
      ...prev,
      partners: prev.partners.map((entry) => (entry.id === id ? { ...entry, name } : entry)),
    }))
  }

  const handlePartnerImageChange = async (id: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setHomepageModulesUploadError('')

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setHomepageModulesUploadError('Please upload an image file only.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setHomepageModulesUploadError('Logo image size must be 2MB or less.')
      return
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Failed to read image file.'))
      reader.readAsDataURL(file)
    }).catch(() => '')

    if (!dataUrl) {
      setHomepageModulesUploadError('Failed to process logo image.')
      return
    }

    setHomepageModulesSettings((prev) => ({
      ...prev,
      partners: prev.partners.map((entry) => (entry.id === id ? { ...entry, imageDataUrl: dataUrl } : entry)),
    }))
  }

  const handleSaveHomepageModulesSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setHomepageModulesMessage('')
    setHomepageModulesUploadError('')
    setSavingHomepageModulesSettings(true)

    try {
      const token = await getFirebaseAuth()?.currentUser?.getIdToken(true)
      if (!token) {
        throw new Error('You must be logged in as admin to update homepage modules.')
      }

      const response = await fetch('/api/homepage-modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(homepageModulesSettings),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Failed to update homepage modules settings.')
      }

      setHomepageModulesMessage('Homepage modules updated successfully.')
    } catch (err) {
      setError(toAdminError(err, 'Failed to update homepage modules settings.'))
    } finally {
      setSavingHomepageModulesSettings(false)
    }
  }

  const handleJoinUsHeaderImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setJoinUsUploadError('')

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setJoinUsUploadError('Please upload an image file only.')
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      setJoinUsUploadError('Image size must be 3MB or less.')
      return
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Failed to read image file.'))
      reader.readAsDataURL(file)
    }).catch(() => '')

    if (!dataUrl) {
      setJoinUsUploadError('Failed to process image file.')
      return
    }

    setJoinUsSettings((prev) => ({ ...prev, headerImageDataUrl: dataUrl }))
  }

  const handleJoinUsFieldChange = <K extends keyof JoinUsField>(index: number, key: K, value: JoinUsField[K]) => {
    setJoinUsSettings((prev) => ({
      ...prev,
      fields: prev.fields.map((field, fieldIndex) => (fieldIndex === index ? { ...field, [key]: value } : field)),
    }))
  }

  const handleAddJoinUsField = () => {
    setJoinUsSettings((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          id: `field_${Date.now()}`,
          label: 'New Field',
          type: 'text',
          required: false,
          options: [],
        },
      ],
    }))
  }

  const handleRemoveJoinUsField = (index: number) => {
    setJoinUsSettings((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, fieldIndex) => fieldIndex !== index),
    }))
  }

  const handleSaveJoinUsSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setJoinUsMessage('')
    setSavingJoinUsSettings(true)

    try {
      const token = await getFirebaseAuth()?.currentUser?.getIdToken(true)
      if (!token) {
        throw new Error('You must be logged in as admin to update recruitment form.')
      }

      const response = await fetch('/api/admin/join-us', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(joinUsSettings),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Failed to save recruitment form settings.')
      }

      setJoinUsMessage('Recruitment form settings updated successfully.')
    } catch (err) {
      setError(toAdminError(err, 'Failed to save recruitment form settings.'))
    } finally {
      setSavingJoinUsSettings(false)
    }
  }

  const handleDownloadRecruitmentCsv = () => {
    const header = ['Name', 'Email', 'Phone', 'Applied At', ...joinUsSettings.fields.map((field) => field.label)]
    const rows = recruitmentApplications.map((entry) => {
      const appliedAt = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ''
      const answerCells = joinUsSettings.fields.map((field) => {
        const value = entry.answers?.[field.id]
        if (isJoinUsFileAnswer(value)) {
          return value.fileName || 'Uploaded file'
        }
        return String(value || '')
      })
      return [
        String(entry.fullName || ''),
        String(entry.email || ''),
        String(entry.phone || ''),
        appliedAt,
        ...answerCells,
      ]
    })

    const csvLines = [header, ...rows]
      .map((cells) => cells.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvLines], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'join-us-applications.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (authLoading) {
    return (
      <main className="pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#e8cfc9] shadow-sm p-8 text-center text-gray-600">
          Checking admin access…
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#e8cfc9] shadow-sm p-8 text-center text-gray-600">
          Redirecting to login…
        </div>
      </main>
    )
  }

  if (user && !isAdmin) {
    return (
      <main className="pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#e8cfc9] shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Access Required</h1>
          <p className="text-gray-600 mt-2">This page is only available for the authorized admin account.</p>
          <Link href="/" className="inline-flex mt-6 px-5 py-2.5 rounded-2xl bg-accent text-white font-semibold hover:bg-accent-dark transition-colors">
            Back to Home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Admin Verification Panel</h1>
          <p className="text-gray-600 mt-2">
            Review all accounts, open any profile, verify/cancel, and delete account data when needed.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-[#edf9f0] border border-[#cdebd4] text-green-700">Verified: {grouped.verified.length}</span>
            <span className="px-3 py-1 rounded-full bg-[#fff4ef] border border-[#f1d9d2] text-accent">Non-Verified: {grouped.nonVerified.length}</span>
            <span className="px-3 py-1 rounded-full bg-[#fff0f0] border border-[#f5d1d1] text-red-700">Cancelled: {grouped.cancelled.length}</span>
          </div>
        </section>

        {isSuperAdmin && (
          <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Admin Access Management</h2>
            <p className="text-sm text-gray-600 mt-1">Only super admin can add or remove admin users.</p>

            <form onSubmit={handleAssignAdmin} className="mt-4 flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={newAdminEmail}
                onChange={(event) => setNewAdminEmail(event.target.value)}
                placeholder="Enter email to make admin"
                className="flex-1 px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-accent text-white font-semibold hover:bg-accent/90 transition-colors"
              >
                Add Admin
              </button>
            </form>

            <div className="mt-4 space-y-2">
              {adminEmails.map((email) => {
                const isSuper = email === SUPER_ADMIN_EMAIL
                return (
                  <div key={email} className="flex items-center justify-between rounded-2xl border border-[#efd6d1] bg-[#fff9f8] px-4 py-3">
                    <p className="text-sm text-gray-700">{email}{isSuper ? ' (Super Admin)' : ''}</p>
                    {!isSuper && (
                      <button
                        type="button"
                        onClick={() => void handleRemoveAdmin(email)}
                        className="text-sm px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
          {activeSection === 'overview' ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900">Choose Section</h2>
              <p className="text-sm text-gray-600 mt-1">Open one section at a time for focused review.</p>
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveSection('profiles')}
                    className="rounded-2xl border border-[#efd6d1] bg-[#fff4ef] px-5 py-4 text-left hover:bg-[#ffe8e0] transition-colors"
                  >
                    <p className="text-base font-semibold text-gray-900">Profile Section</p>
                    <p className="text-xs text-gray-600 mt-1">Verify, cancel, and manage profile records.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('messages')}
                    className="rounded-2xl border border-[#cdebd4] bg-[#edf9f0] px-5 py-4 text-left hover:bg-[#dff5e7] transition-colors"
                  >
                    <p className="text-base font-semibold text-gray-900">Message Section</p>
                    <p className="text-xs text-gray-600 mt-1">Read contact threads and send admin replies.</p>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveSection('contactSettings')}
                    className="rounded-2xl border border-[#d7dff5] bg-[#eef3ff] px-5 py-4 text-left hover:bg-[#e2ebff] transition-colors"
                  >
                    <p className="text-base font-semibold text-gray-900">Contact Settings Section</p>
                    <p className="text-xs text-gray-600 mt-1">Update phone, email, office hours, and address shown on Contact Us page.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('featureBanner')}
                    className="rounded-2xl border border-[#f2d9a5] bg-[#fff6e8] px-5 py-4 text-left hover:bg-[#ffeccc] transition-colors"
                  >
                    <p className="text-base font-semibold text-gray-900">Feature Banner Section</p>
                    <p className="text-xs text-gray-600 mt-1">Upload the homepage banner and set redirect link when users click it.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('homepageModules')}
                    className="rounded-2xl border border-[#d2e5f2] bg-[#ecf7ff] px-5 py-4 text-left hover:bg-[#deefff] transition-colors"
                  >
                    <p className="text-base font-semibold text-gray-900">Homepage Modules Section</p>
                    <p className="text-xs text-gray-600 mt-1">Enable/disable Stats and Partners slider, and manage partner logos.</p>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveSection('recruitment')}
                    className="rounded-2xl border border-[#d8ead0] bg-[#eff9e8] px-5 py-4 text-left hover:bg-[#e3f4d8] transition-colors"
                  >
                    <p className="text-base font-semibold text-gray-900">Recruitment Section</p>
                    <p className="text-xs text-gray-600 mt-1">Edit Join Us form, review applicants, export CSV, and download photos.</p>
                  </button>
                  <Link
                    href="/admin/competition-registration"
                    className="rounded-2xl border border-[#d8d9f2] bg-[#f1f2ff] px-5 py-4 text-left hover:bg-[#e6e8ff] transition-colors"
                  >
                    <p className="text-base font-semibold text-gray-900">Competition Registration Section</p>
                    <p className="text-xs text-gray-600 mt-1">Create per-competition forms and manage each competition's registrations.</p>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href="/admin/competitions-cms"
                    className="rounded-2xl border border-[#f0d7be] bg-[#fff4e9] px-5 py-4 text-left hover:bg-[#ffe9d0] transition-colors"
                  >
                    <p className="text-base font-semibold text-gray-900">Competitions CMS</p>
                    <p className="text-xs text-gray-600 mt-1">Create/delete competitions, design pages, upload mini banners, and reorder page sections.</p>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {activeSection === 'profiles'
                    ? 'Profile Section'
                    : activeSection === 'messages'
                      ? 'Message Section'
                      : activeSection === 'contactSettings'
                        ? 'Contact Settings Section'
                        : activeSection === 'homepageModules'
                          ? 'Homepage Modules Section'
                        : activeSection === 'featureBanner'
                          ? 'Feature Banner Section'
                          : 'Recruitment Section'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {activeSection === 'profiles'
                    ? 'Review verification and account details.'
                    : activeSection === 'messages'
                      ? 'Reply to users and continue conversation threads.'
                      : activeSection === 'contactSettings'
                        ? 'Edit public contact and address details at any time.'
                        : activeSection === 'homepageModules'
                          ? 'Control homepage stats and partners slider visibility and content.'
                        : activeSection === 'featureBanner'
                          ? 'Upload and link the feature banner shown on homepage.'
                          : 'Manage Join Us form and applicant submissions.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('overview')}
                className="px-4 py-2 rounded-xl border border-[#e8cfc9] bg-white text-sm font-semibold text-gray-700 hover:bg-[#fff4ef] transition-colors"
              >
                Back
              </button>
            </div>
          )}
        </section>

        {activeSection === 'messages' && (
          <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
            <h3 className="text-xl font-bold text-gray-900">Contact Messages</h3>
            <p className="text-sm text-gray-600 mt-1">Messages submitted from the website Contact Us form.</p>

            {loadingContactMessages ? (
              <p className="text-sm text-gray-600 mt-4">Loading contact messages...</p>
            ) : contactMessages.length === 0 ? (
              <p className="text-sm text-gray-600 mt-4">No contact messages yet.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2 max-h-[380px] overflow-auto pr-1">
                  {contactMessages.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setSelectedContactId(entry.id)}
                      className={`w-full text-left rounded-2xl border px-4 py-3 transition-colors ${
                        selectedContactId === entry.id
                          ? 'border-accent bg-[#fff4ef]'
                          : 'border-[#efd6d1] bg-[#fff9f8] hover:bg-[#fff4ef]'
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900">{entry.subject || 'No subject'}</p>
                      <p className="text-xs text-gray-600 mt-1">{entry.name || 'Unknown'} | {entry.email || 'No email'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {entry.updatedAt || entry.createdAt
                          ? new Date(entry.updatedAt || entry.createdAt || 0).toLocaleString()
                          : 'Unknown date'}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-4">
                  {!selectedContact ? (
                    <p className="text-sm text-gray-600">Select a thread to view and reply.</p>
                  ) : (
                    <>
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-gray-900">{selectedContact.subject || 'No subject'}</p>
                        <p className="text-xs text-gray-600 mt-1">{selectedContact.name || 'Unknown'} | {selectedContact.email || 'No email'}</p>
                      </div>

                      <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
                        {(selectedContact.messages ?? []).map((entry, index) => (
                          <div
                            key={`${entry.createdAt}-${index}`}
                            className={`rounded-xl px-3 py-2 text-sm ${
                              entry.sender === 'admin'
                                ? 'bg-[#edf9f0] text-green-800 border border-[#cdebd4]'
                                : 'bg-white text-gray-800 border border-[#efd6d1]'
                            }`}
                          >
                            <p className="text-xs font-semibold mb-1">{entry.sender === 'admin' ? 'Admin' : 'User'}</p>
                            <p className="whitespace-pre-wrap">{entry.text}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={replyDraft}
                          onChange={(event) => setReplyDraft(event.target.value)}
                          placeholder="Write admin reply..."
                          className="flex-1 px-3 py-2 rounded-xl border border-[#e8cfc9] text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                        <button
                          type="button"
                          onClick={() => void handleSendContactReply()}
                          disabled={isSendingReply}
                          className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 disabled:opacity-60"
                        >
                          {isSendingReply ? 'Sending...' : 'Reply'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteContactThread()}
                          disabled={isDeletingContact || !isSuperAdmin}
                          className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
                          title={isSuperAdmin ? 'Delete this full conversation' : 'Only super admin can delete chats'}
                        >
                          {isDeletingContact ? 'Deleting...' : 'Delete Chat'}
                        </button>
                      </div>
                      {!isSuperAdmin && (
                        <p className="mt-2 text-xs text-gray-500">Only super admin can delete chat threads.</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {activeSection === 'contactSettings' && (
          <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
            {loadingSiteContactSettings ? (
              <p className="text-sm text-gray-600">Loading contact settings...</p>
            ) : (
              <form onSubmit={handleSaveSiteContactSettings} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={siteContactSettings.address}
                    onChange={(event) =>
                      setSiteContactSettings((prev) => ({ ...prev, address: event.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                    placeholder="Office address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone 1</label>
                    <input
                      type="text"
                      value={siteContactSettings.phonePrimary}
                      onChange={(event) =>
                        setSiteContactSettings((prev) => ({ ...prev, phonePrimary: event.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="Primary phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone 2</label>
                    <input
                      type="text"
                      value={siteContactSettings.phoneSecondary}
                      onChange={(event) =>
                        setSiteContactSettings((prev) => ({ ...prev, phoneSecondary: event.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="Secondary phone number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={siteContactSettings.email}
                      onChange={(event) =>
                        setSiteContactSettings((prev) => ({ ...prev, email: event.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="Public contact email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Office Hours</label>
                    <input
                      type="text"
                      value={siteContactSettings.officeHours}
                      onChange={(event) =>
                        setSiteContactSettings((prev) => ({ ...prev, officeHours: event.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="Office hours"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingSiteContactSettings}
                    className="px-5 py-2.5 rounded-2xl bg-accent text-white font-semibold hover:bg-accent/90 disabled:opacity-60 transition-colors"
                  >
                    {savingSiteContactSettings ? 'Saving...' : 'Save Contact Settings'}
                  </button>
                  {siteContactMessage && <p className="text-sm text-green-700">{siteContactMessage}</p>}
                </div>
              </form>
            )}
          </section>
        )}

        {activeSection === 'featureBanner' && (
          <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
            {loadingFeatureBannerSettings ? (
              <p className="text-sm text-gray-600">Loading feature banner settings...</p>
            ) : (
              <form onSubmit={handleSaveFeatureBannerSettings} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banner Link</label>
                  <input
                    type="text"
                    value={siteFeatureBannerSettings.linkUrl}
                    onChange={(event) =>
                      setSiteFeatureBannerSettings((prev) => ({ ...prev, linkUrl: event.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                    placeholder="https://example.com or /competitions"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Banner Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => void handleFeatureBannerFileChange(event)}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-accent/90"
                  />
                  <p className="text-xs text-gray-500 mt-2">Recommended wide image. Max size: 3MB.</p>
                  {featureBannerUploadError && <p className="text-sm text-red-700 mt-2">{featureBannerUploadError}</p>}
                </div>

                <div className="rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Banner Preview</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={siteFeatureBannerSettings.imageDataUrl || defaultSiteFeatureBannerSettings.imageDataUrl}
                    alt="Feature banner preview"
                    className="w-full rounded-xl border border-[#e8cfc9]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingFeatureBannerSettings}
                    className="px-5 py-2.5 rounded-2xl bg-accent text-white font-semibold hover:bg-accent/90 disabled:opacity-60 transition-colors"
                  >
                    {savingFeatureBannerSettings ? 'Saving...' : 'Save Feature Banner'}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {activeSection === 'homepageModules' && (
          <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
            {loadingHomepageModulesSettings ? (
              <p className="text-sm text-gray-600">Loading homepage module settings...</p>
            ) : (
              <form onSubmit={handleSaveHomepageModulesSettings} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="rounded-2xl border border-[#d4e6f5] bg-[#f2f9ff] px-4 py-3 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={homepageModulesSettings.showStats}
                      onChange={(event) =>
                        setHomepageModulesSettings((prev) => ({ ...prev, showStats: event.target.checked }))
                      }
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Show Stats Section</p>
                      <p className="text-xs text-gray-600">Enable/disable counting statistics on homepage.</p>
                    </div>
                  </label>

                  <label className="rounded-2xl border border-[#d4e6f5] bg-[#f2f9ff] px-4 py-3 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={homepageModulesSettings.showPartners}
                      onChange={(event) =>
                        setHomepageModulesSettings((prev) => ({ ...prev, showPartners: event.target.checked }))
                      }
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Show Partners Slider</p>
                      <p className="text-xs text-gray-600">Enable/disable the animated partner logos slider.</p>
                    </div>
                  </label>
                </div>

                <div className="rounded-2xl border border-[#d4e6f5] bg-[#f7fbff] p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Partners</p>
                    <button
                      type="button"
                      onClick={handleAddPartner}
                      className="px-3 py-1.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90"
                    >
                      Add Partner
                    </button>
                  </div>

                  {homepageModulesUploadError && (
                    <p className="text-sm text-red-700">{homepageModulesUploadError}</p>
                  )}

                  {homepageModulesSettings.partners.length === 0 ? (
                    <p className="text-sm text-gray-600">No partners added yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {homepageModulesSettings.partners.map((partner) => (
                        <div key={partner.id} className="rounded-xl border border-[#d9e9f7] bg-white p-3 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={partner.name}
                              onChange={(event) => handlePartnerNameChange(partner.id, event.target.value)}
                              placeholder="Partner name"
                              className="px-3 py-2 rounded-xl border border-[#e8cfc9]"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(event) => void handlePartnerImageChange(partner.id, event)}
                              className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-xl file:border-0 file:bg-accent file:px-3 file:py-1.5 file:font-semibold file:text-white"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            {partner.imageDataUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={partner.imageDataUrl} alt={partner.name} className="h-12 w-auto max-w-[160px] object-contain" />
                            ) : (
                              <p className="text-xs text-gray-500">No logo uploaded yet.</p>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemovePartner(partner.id)}
                              className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingHomepageModulesSettings}
                    className="px-5 py-2.5 rounded-2xl bg-accent text-white font-semibold hover:bg-accent/90 disabled:opacity-60 transition-colors"
                  >
                    {savingHomepageModulesSettings ? 'Saving...' : 'Save Homepage Modules'}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {activeSection === 'recruitment' && (
          <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm space-y-6">
            {loadingJoinUsData ? (
              <p className="text-sm text-gray-600">Loading recruitment settings and applications...</p>
            ) : (
              <>
                <form onSubmit={handleSaveJoinUsSettings} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Join Us Header</label>
                    <input
                      type="text"
                      value={joinUsSettings.headerText}
                      onChange={(event) => setJoinUsSettings((prev) => ({ ...prev, headerText: event.target.value }))}
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subheader</label>
                    <textarea
                      value={joinUsSettings.subheaderText}
                      onChange={(event) => setJoinUsSettings((prev) => ({ ...prev, subheaderText: event.target.value }))}
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Header Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => void handleJoinUsHeaderImageChange(event)}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-accent/90"
                    />
                    {joinUsUploadError && <p className="text-sm text-red-700 mt-2">{joinUsUploadError}</p>}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={joinUsSettings.headerImageDataUrl}
                      alt="Join Us header preview"
                      className="mt-3 w-full max-w-xl rounded-2xl border border-[#e8cfc9]"
                    />
                  </div>

                  <div className="rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">Dynamic Form Fields</p>
                      <button
                        type="button"
                        onClick={handleAddJoinUsField}
                        className="px-3 py-1.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90"
                      >
                        Add Field
                      </button>
                    </div>

                    {joinUsSettings.fields.map((field, index) => (
                      <div key={`join-us-field-${index}`} className="rounded-xl border border-[#ead3cd] bg-white p-3 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(event) => handleJoinUsFieldChange(index, 'label', event.target.value)}
                            placeholder="Field label"
                            className="px-3 py-2 rounded-xl border border-[#e8cfc9]"
                          />
                          <select
                            value={field.type}
                            onChange={(event) => handleJoinUsFieldChange(index, 'type', event.target.value as JoinUsField['type'])}
                            className="px-3 py-2 rounded-xl border border-[#e8cfc9]"
                          >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="textarea">Textarea</option>
                            <option value="select">Dropdown</option>
                            <option value="file">File Upload</option>
                          </select>
                          <input
                            type="text"
                            value={field.id}
                            onChange={(event) => handleJoinUsFieldChange(index, 'id', event.target.value.replace(/\s+/g, '_').toLowerCase())}
                            placeholder="Variable Name (unique field id)"
                            className="px-3 py-2 rounded-xl border border-[#e8cfc9]"
                          />
                        </div>

                        {field.type === 'select' && (
                          <input
                            type="text"
                            value={field.options.join(', ')}
                            onChange={(event) =>
                              handleJoinUsFieldChange(
                                index,
                                'options',
                                event.target.value
                                  .split(',')
                                  .map((entry) => entry.trim()),
                              )
                            }
                            placeholder="Option 1, Option 2"
                            className="w-full px-3 py-2 rounded-xl border border-[#e8cfc9]"
                          />
                        )}

                        <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-700 flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(event) => handleJoinUsFieldChange(index, 'required', event.target.checked)}
                            />
                            Required
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveJoinUsField(index)}
                            className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={savingJoinUsSettings}
                    className="px-5 py-2.5 rounded-2xl bg-accent text-white font-semibold hover:bg-accent/90 disabled:opacity-60"
                  >
                    {savingJoinUsSettings ? 'Saving...' : 'Save Recruitment Form'}
                  </button>
                </form>

                <div className="rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-gray-900">Applications ({recruitmentApplications.length})</p>
                    <button
                      type="button"
                      onClick={handleDownloadRecruitmentCsv}
                      className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"
                    >
                      Download CSV
                    </button>
                  </div>

                  {recruitmentApplications.length === 0 ? (
                    <p className="text-sm text-gray-600 mt-3">No applications yet.</p>
                  ) : (
                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                        {recruitmentApplications.map((entry) => (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => setSelectedRecruitmentId(entry.id)}
                            className={`w-full text-left rounded-xl border px-3 py-2 transition-colors ${
                              selectedRecruitmentId === entry.id
                                ? 'border-accent bg-[#fff4ef]'
                                : 'border-[#ead3cd] bg-white hover:bg-[#fff4ef]'
                            }`}
                          >
                            <p className="text-sm font-semibold text-gray-900">{entry.fullName || 'Unnamed Applicant'}</p>
                            <p className="text-xs text-gray-600 mt-1">{entry.email || 'No email'} | {entry.phone || 'No phone'}</p>
                          </button>
                        ))}
                      </div>

                      <div className="rounded-xl border border-[#ead3cd] bg-white p-3">
                        {!selectedRecruitment ? (
                          <p className="text-sm text-gray-600">Select an applicant to view details.</p>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <p className="text-base font-semibold text-gray-900">{selectedRecruitment.fullName || 'Unnamed Applicant'}</p>
                              <p className="text-sm text-gray-700">Email: {selectedRecruitment.email || 'N/A'}</p>
                              <p className="text-sm text-gray-700">Phone: {selectedRecruitment.phone || 'N/A'}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Applied:{' '}
                                {selectedRecruitment.createdAt
                                  ? new Date(selectedRecruitment.createdAt).toLocaleString()
                                  : 'Unknown'}
                              </p>
                            </div>

                            {(selectedRecruitment.photoUrl || selectedRecruitment.photoDataUrl) && (
                              <div className="space-y-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={selectedRecruitment.photoUrl || selectedRecruitment.photoDataUrl}
                                  alt={`${selectedRecruitment.fullName || 'Applicant'} profile`}
                                  className="w-36 h-36 object-cover rounded-xl border border-[#e8cfc9]"
                                />
                                <a
                                  href={selectedRecruitment.photoUrl || selectedRecruitment.photoDataUrl}
                                  download={`${(selectedRecruitment.fullName || 'applicant').replace(/\s+/g, '_')}_photo.jpg`}
                                  className="inline-flex px-3 py-1.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90"
                                >
                                  Download Photo
                                </a>
                              </div>
                            )}

                            <div className="space-y-2">
                              {joinUsSettings.fields.map((field) => {
                                const value = selectedRecruitment.answers?.[field.id]
                                const fileValue = isJoinUsFileAnswer(value) ? value : null
                                return (
                                  <div key={field.id} className="rounded-lg border border-[#f0d9d4] bg-[#fff9f8] px-3 py-2">
                                    <p className="text-xs font-semibold text-gray-600">{field.label}</p>
                                    {fileValue ? (
                                      fileValue.downloadUrl || fileValue.dataUrl ? (
                                        <a
                                          href={fileValue.downloadUrl || fileValue.dataUrl}
                                          download={fileValue.fileName}
                                          className="text-sm text-accent font-semibold hover:underline"
                                        >
                                          Download {fileValue.fileName}
                                        </a>
                                      ) : (
                                        <p className="text-sm text-gray-800">{fileValue.fileName}</p>
                                      )
                                    ) : (
                                      <p className="text-sm text-gray-800">{String(value || 'Not answered')}</p>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {activeSection === 'profiles' && (
          <>
            {loadingRows ? (
              <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm text-gray-600">Loading profiles...</section>
            ) : rows.length === 0 ? (
              <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm text-gray-600">No profiles found.</section>
            ) : (
              <>
                {lightboxUrl && (
                  <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setLightboxUrl(null)}
                  >
                    <div
                      className="relative max-w-3xl w-full max-h-[90vh] flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={lightboxUrl} alt={lightboxAlt} className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(null)}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 text-gray-900 hover:bg-white flex items-center justify-center font-bold text-xl shadow"
                        aria-label="Close preview"
                      >
                        x
                      </button>
                    </div>
                  </div>
                )}

                <section className="bg-white rounded-3xl border border-[#e8cfc9] shadow-sm p-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setActiveTab(activeTab === 'nonVerified' ? null : 'nonVerified'); setNameSearch(''); setSelectedUid('') }}
                      className={`flex-1 py-3 rounded-2xl font-semibold text-sm transition-colors border ${
                        activeTab === 'nonVerified'
                          ? 'bg-accent text-white border-accent'
                          : 'bg-[#fff4ef] text-accent border-[#f1d9d2] hover:bg-[#ffe8e0]'
                      }`}
                    >
                      Non-Verified ({grouped.nonVerified.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab(activeTab === 'verified' ? null : 'verified'); setNameSearch(''); setSelectedUid('') }}
                      className={`flex-1 py-3 rounded-2xl font-semibold text-sm transition-colors border ${
                        activeTab === 'verified'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-[#edf9f0] text-green-700 border-[#cdebd4] hover:bg-[#d6f5df]'
                      }`}
                    >
                      Verified ({grouped.verified.length})
                    </button>
                  </div>
                </section>

                <div className="flex flex-col lg:flex-row gap-6">
                  <section className="bg-white rounded-3xl border border-[#e8cfc9] shadow-sm w-full lg:w-2/5">
                    <div className="p-5 flex flex-col gap-3">
                      {activeTab === null ? (
                        <p className="text-sm text-gray-500 text-center py-10">Select a tab above to view accounts.</p>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={nameSearch}
                            onChange={(e) => setNameSearch(e.target.value)}
                            placeholder="Search by name..."
                            className="w-full px-4 py-2.5 rounded-2xl border border-[#e8cfc9] text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                          <div className="space-y-2 overflow-auto pr-1" style={{ maxHeight: 'calc(100vh - 420px)', minHeight: '200px' }}>
                            {(activeTab === 'nonVerified' ? grouped.nonVerified : grouped.verified)
                              .filter((a) =>
                                nameSearch.trim() === '' ||
                                (a.fullName ?? '').toLowerCase().includes(nameSearch.toLowerCase())
                              )
                              .map((account) => (
                                <button
                                  key={account.uid}
                                  type="button"
                                  onClick={() => setSelectedUid(account.uid)}
                                  className={`w-full text-left rounded-2xl border px-3 py-2.5 transition-colors ${
                                    selectedProfile?.uid === account.uid
                                      ? 'border-accent bg-[#fff4ef]'
                                      : 'border-[#efd6d1] bg-[#fff9f8] hover:bg-[#fff4ef]'
                                  }`}
                                >
                                  <p className="text-sm font-semibold text-gray-800">{account.fullName || 'Unnamed User'}</p>
                                  <p className="text-xs text-gray-500">{account.email}</p>
                                </button>
                              ))}
                            {(activeTab === 'nonVerified' ? grouped.nonVerified : grouped.verified)
                              .filter((a) => nameSearch.trim() === '' || (a.fullName ?? '').toLowerCase().includes(nameSearch.toLowerCase()))
                              .length === 0 && (
                              <p className="text-sm text-gray-500">
                                {nameSearch.trim() ? 'No accounts match your search.' : activeTab === 'nonVerified' ? 'No non-verified accounts.' : 'No verified accounts yet.'}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </section>

                  <section className="bg-white rounded-3xl border border-[#e8cfc9] shadow-sm w-full lg:w-3/5">
                    <div className="p-5 overflow-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                      {!selectedProfile ? (
                        <p className="text-sm text-gray-500 py-8 text-center">Select an account from the list to review its details.</p>
                      ) : (
                        (() => {
                          const status = selectedProfile.verificationStatus || 'pending'
                          const badgeClass =
                            status === 'verified'
                              ? 'bg-[#edf9f0] border-[#cdebd4] text-green-700'
                              : status === 'cancelled'
                                ? 'bg-[#fff0f0] border-[#f5d1d1] text-red-700'
                                : 'bg-[#fff4ef] border-[#f1d9d2] text-accent'
                          const isBuiltInAdminProfile = selectedProfile.email?.toLowerCase() === SUPER_ADMIN_EMAIL

                          return (
                            <article>
                              <div className="flex flex-wrap justify-between gap-3 items-start">
                                <div>
                                  <h2 className="text-xl font-bold text-gray-900">{selectedProfile.fullName || 'Unnamed User'}</h2>
                                  <p className="text-gray-600 text-sm mt-1">{selectedProfile.email}</p>
                                  <p className="text-gray-600 text-sm">Phone: {selectedProfile.phone || 'Not provided'}</p>
                                  <p className="text-gray-600 text-sm">Education: {selectedProfile.educationLevel || 'Not provided'}</p>
                                  <p className="text-gray-600 text-sm">Institute: {selectedProfile.instituteName || 'Not provided'}</p>
                                  <p className="text-gray-600 text-sm">ID: {selectedProfile.idType === 'passport' ? 'Passport' : selectedProfile.idType === 'nid' ? 'NID' : 'Birth Registration'} | {selectedProfile.idNumber || 'Not provided'}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full border text-sm font-medium ${badgeClass}`}>
                                  {status === 'verified' ? 'Verified' : status === 'cancelled' ? 'Cancelled' : 'Pending'}
                                </span>
                              </div>

                              <div className="mt-4 rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-4">
                                <p className="text-sm font-semibold text-gray-800 mb-2">Registered Competitions</p>
                                {(registrationsByUid[selectedProfile.uid] ?? []).length > 0 ? (
                                  <ul className="space-y-2">
                                    {(registrationsByUid[selectedProfile.uid] ?? []).map((entry, index) => (
                                      <li key={`${entry.competitionId}-${index}`} className="text-sm text-gray-700">
                                        <span className="font-medium">{entry.competitionName || `Competition #${entry.competitionId}`}</span>
                                        {entry.competitionDate ? ` | ${entry.competitionDate}` : ''}
                                        {entry.teamName ? ` | Team: ${entry.teamName}` : ''}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-gray-600">No competition registrations found.</p>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                                <div>
                                  <p className="text-sm font-semibold text-gray-800 mb-2">Profile Photo</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (selectedProfile.profilePhotoDataUrl) {
                                        setLightboxAlt(`${selectedProfile.fullName ?? ''} profile photo`)
                                        setLightboxUrl(selectedProfile.profilePhotoDataUrl)
                                      }
                                    }}
                                    className={`w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden border border-[#edd4ce] bg-[#faf1ef] block ${
                                      selectedProfile.profilePhotoDataUrl
                                        ? 'cursor-zoom-in hover:ring-2 hover:ring-accent/40 transition-all'
                                        : 'cursor-default'
                                    }`}
                                    title={selectedProfile.profilePhotoDataUrl ? 'Click to enlarge' : undefined}
                                  >
                                    {selectedProfile.profilePhotoDataUrl ? (
                                      <Image
                                        src={selectedProfile.profilePhotoDataUrl}
                                        alt={`${selectedProfile.fullName} profile photo`}
                                        width={260}
                                        height={260}
                                        className="w-full h-full object-cover pointer-events-none"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">No image</div>
                                    )}
                                  </button>
                                </div>

                                <div>
                                  <p className="text-sm font-semibold text-gray-800 mb-2">ID Document</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (selectedProfile.idDocumentPhotoDataUrl) {
                                        setLightboxAlt(`${selectedProfile.fullName ?? ''} id document`)
                                        setLightboxUrl(selectedProfile.idDocumentPhotoDataUrl)
                                      }
                                    }}
                                    className={`w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden border border-[#edd4ce] bg-[#faf1ef] block ${
                                      selectedProfile.idDocumentPhotoDataUrl
                                        ? 'cursor-zoom-in hover:ring-2 hover:ring-accent/40 transition-all'
                                        : 'cursor-default'
                                    }`}
                                    title={selectedProfile.idDocumentPhotoDataUrl ? 'Click to enlarge' : undefined}
                                  >
                                    {selectedProfile.idDocumentPhotoDataUrl ? (
                                      <Image
                                        src={selectedProfile.idDocumentPhotoDataUrl}
                                        alt={`${selectedProfile.fullName} id document`}
                                        width={260}
                                        height={260}
                                        className="w-full h-full object-cover pointer-events-none"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">No document</div>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {status === 'cancelled' && selectedProfile.verificationReason && (
                                <p className="text-sm text-red-700 mt-4">Cancellation reason: {selectedProfile.verificationReason}</p>
                              )}

                              {isBuiltInAdminProfile ? (
                                <p className="text-sm text-green-700 mt-5 font-medium">This account is permanently verified.</p>
                              ) : (
                                <>
                                  <div className="flex flex-wrap gap-3 mt-5">
                                    {status === 'pending' && (
                                      <button
                                        type="button"
                                        disabled={activeUid === selectedProfile.uid}
                                        onClick={() => updateStatus(selectedProfile, 'verified')}
                                        className="px-4 py-2.5 rounded-2xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
                                      >
                                        {activeUid === selectedProfile.uid ? 'Updating...' : 'Verify'}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      disabled={activeUid === selectedProfile.uid}
                                      onClick={() => void handleDeleteAccountData(selectedProfile)}
                                      className="px-4 py-2.5 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-60 transition-colors"
                                    >
                                      {activeUid === selectedProfile.uid ? 'Deleting...' : 'Delete Account Data'}
                                    </button>
                                  </div>

                                  {status !== 'verified' && (
                                    <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                                      <input
                                        type="text"
                                        value={cancelReasons[selectedProfile.uid] || ''}
                                        onChange={(event) => setCancelReasons((prev) => ({ ...prev, [selectedProfile.uid]: event.target.value }))}
                                        placeholder="Reason for cancellation"
                                        className="flex-1 px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                                      />
                                    </div>
                                  )}
                                </>
                              )}
                            </article>
                          )
                        })()
                      )}
                    </div>
                  </section>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}
