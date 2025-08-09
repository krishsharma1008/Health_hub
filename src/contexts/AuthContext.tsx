import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type User = {
  id: string
  email: string
  name?: string
  role?: string
}

type AuthContextValue = {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_TOKEN_KEY = 'auth-token'
const STORAGE_USER_KEY = 'auth-user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_TOKEN_KEY))
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(STORAGE_USER_KEY)
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) localStorage.setItem(STORAGE_TOKEN_KEY, token)
    else localStorage.removeItem(STORAGE_TOKEN_KEY)
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_USER_KEY)
  }, [user])

  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || ''

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Login failed')
      setToken(data.token)
      setUser(data.user)
      return true
    } catch (e: any) {
      setError(e.message || 'Login failed')
      return false
    } finally {
      setLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Registration failed')
      setToken(data.token)
      setUser(data.user)
      return true
    } catch (e: any) {
      setError(e.message || 'Registration failed')
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const value = useMemo<AuthContextValue>(() => ({ user, token, loading, error, login, register, logout }), [user, token, loading, error])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


