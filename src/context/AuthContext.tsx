import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface AuthContextType {
  session: any
  user: any
  loading: boolean
  signOut: () => Promise<void>
  isElectron: boolean
  refreshProfile: () => Promise<void>
  createProfile: (profile: { name: string; email?: string; currency?: string; theme?: string; onboardingDone?: boolean }) => Promise<string>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    if (isElectron) {
      try {
        console.log('[Auth] Fetching local profile...')
        const electron = (window as any).electronAPI
        if (!electron) {
             setLoading(false)
             return
        }
        const profile = await electron.invoke('get-profile')
        if (profile) {
          console.log('[Auth] Profile found:', profile.name)
          const mockUser = {
            id: profile.id,
            email: profile.email,
            user_metadata: { name: profile.name },
            currency: profile.currency,
            theme: profile.theme,
            onboardingDone: profile.onboardingDone
          }
          setUser(mockUser as any)
          setSession({ user: mockUser } as any)
        } else {
          console.log('[Auth] No profile found in DB')
          setUser(null)
          setSession(null)
        }
      } catch (err) {
        console.error('[Auth] Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }

  const createProfile = async (profileData: { name: string; email?: string; currency?: string; theme?: string; onboardingDone?: boolean }) => {
    if (isElectron) {
      try {
        console.log('[Auth] Creating profile...', profileData)
        const electron = (window as any).electronAPI
        if (electron) {
          const id = await electron.invoke('create-profile', profileData)
          await refreshProfile()
          return id
        }
      } catch (err) {
        console.error('[Auth] Error creating profile:', err)
      }
    }
    return ''
  }

  useEffect(() => {
    refreshProfile()
  }, [])

  const signOut = async () => {
    if (isElectron) {
      setUser(null)
      setSession(null)
      return
    }
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, isElectron, refreshProfile, createProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

