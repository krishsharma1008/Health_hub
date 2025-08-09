import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthPage() {
  const { login, register, loading, error } = useAuth()
  const [mode, setMode] = useState<'login'|'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const submit = async () => {
    setMessage('')
    const ok = mode === 'login' ? await login(email, password) : await register(name, email, password)
    setMessage(ok ? 'Success!' : 'Failed. Check details and try again.')
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === 'login' ? 'Sign In' : 'Create Account'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'register' && (
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {message && <div className="text-green-600 text-sm">{message}</div>}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={submit} disabled={loading}>
              {mode === 'login' ? 'Sign In' : 'Register'}
            </Button>
            <Button variant="outline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Create account' : 'Have an account? Sign in'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


