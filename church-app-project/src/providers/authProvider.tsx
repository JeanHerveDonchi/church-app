import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { resetLocalSession } from '@/features/auth/session'
import { supabase } from './supabaseClient'

type Role = 'user' | 'admin' | 'super_admin'

type AuthContextType = {
  session: Session | null
  user: User | null
  role: Role | null
  loading: boolean
}

type AuthProfileState = {
  isDeleted: boolean
  role: Role | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const isRole = (value: unknown): value is Role =>
  value === 'user' || value === 'admin' || value === 'super_admin'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  const isMountedRef = useRef(true)
  const activeLoadIdRef = useRef(0)
  const cachedRoleRef = useRef<{ userId: string | null; role: Role | null }>({
    userId: null,
    role: null,
  })

  const fetchAuthProfileState = async (
    userId: string,
  ): Promise<AuthProfileState> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('deleted_at, role:roles!profiles_role_id_fkey(name)')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching auth profile state:', error)
      return {
        isDeleted: false,
        role: null,
      }
    }

    const profile = data as unknown as {
      deleted_at: string | null
      role: {
        name: string | null
      } | null
    } | null
    const roleName = profile?.role?.name ?? null

    if (profile?.deleted_at) {
      return {
        isDeleted: true,
        role: null,
      }
    }

    if (isRole(roleName)) {
      return {
        isDeleted: false,
        role: roleName,
      }
    }

    if (roleName !== null) {
      console.error('Unexpected role value:', roleName)
    }

    return {
      isDeleted: false,
      role: null,
    }
  }

  const syncAuthState = useEffectEvent(async (nextSession: Session | null) => {
    const loadId = ++activeLoadIdRef.current
    const nextUser = nextSession?.user ?? null

    setSession(nextSession)
    setUser(nextUser)

    if (!nextUser) {
      cachedRoleRef.current = { userId: null, role: null }
      setRole(null)
      setLoading(false)
      return
    }

    const cachedRole =
      cachedRoleRef.current.userId === nextUser.id
        ? cachedRoleRef.current
        : null

    if (cachedRole) {
      setRole(cachedRole.role)
      setLoading(false)
      return
    }

    setLoading(true)
    const nextProfileState = await fetchAuthProfileState(nextUser.id)

    if (!isMountedRef.current || loadId !== activeLoadIdRef.current) {
      return
    }

    if (nextProfileState.isDeleted) {
      cachedRoleRef.current = { userId: null, role: null }
      setSession(null)
      setUser(null)
      setRole(null)
      setLoading(false)

      const { error: signOutError } = await resetLocalSession()

      if (signOutError) {
        console.error('Error resetting deleted account session:', signOutError)
      }

      return
    }

    cachedRoleRef.current = { userId: nextUser.id, role: nextProfileState.role }
    setRole(nextProfileState.role)
    setLoading(false)
  })

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting session:', error)
      }

      await syncAuthState(data.session)
    }

    void init()

    return () => {
      isMountedRef.current = false
      activeLoadIdRef.current += 1
    }
  }, [])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'INITIAL_SESSION') {
        return
      }

      isMountedRef.current = true
      void syncAuthState(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, user, role, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
