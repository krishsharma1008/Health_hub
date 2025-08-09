import { useEffect, useState } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Trash2 } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

type ChatRow = { id: string; created_at: number; last_message_at?: number; message_count?: number; summary?: string }
export function ChatHistorySidebar() {
  const [chats, setChats] = useState<ChatRow[]>([])
  const location = useLocation()
  useEffect(() => {
    const load = async () => {
    const base = (import.meta as any).env?.VITE_API_BASE_URL
    const r = await fetch(base ? `${base}/api/chats` : '/api/chats')
      const j = await r.json()
      setChats(j?.chats || [])
    }
    load()
  }, [location.pathname])
  const clearAll = async () => {
    const base = (import.meta as any).env?.VITE_API_BASE_URL
    await fetch(base ? `${base}/api/chats/clear` : '/api/chats/clear', { method: 'POST' })
    setChats([])
  }
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-gray-500">Chat History</div>
        <Button size="icon" variant="ghost" onClick={clearAll} title="Clear all">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {chats.map(c => (
          <Link key={c.id} to={`/?chat=${c.id}`} className="block">
            <Card className="p-3 text-sm hover:shadow transition">
              <div className="flex items-center justify-between">
                <div className="font-medium truncate max-w-[12rem]">{c.summary && c.summary.length > 0 ? c.summary : 'New conversation'}</div>
                <div className="text-[10px] text-gray-500">{new Date(c.last_message_at || c.created_at).toLocaleTimeString()}</div>
              </div>
              <div className="mt-1 text-[11px] text-gray-500 flex items-center justify-between">
                <span>Messages: {c.message_count || 0}</span>
                <span className="truncate max-w-[8rem]">{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}


