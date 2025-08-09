import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { generateFromAi } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Mic, Send, History } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  created_at?: number
}

export function Chat() {
  const [chatId, setChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  useEffect(() => {
    const create = async () => {
      const r = await fetch('/api/chat', { method: 'POST' })
      const j = await r.json()
      setChatId(j.chatId)
    }
    create()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || !chatId) return
    const userMsg: ChatMessage = { role: 'user', content: input }
    setMessages((m) => [...m, userMsg])
    setInput('')
    const resp = await generateFromAi({ task: 'general_assistant', data: { query: input }, chatId })
    const text = (resp as any).result || ''
    setMessages((m) => [...m, { role: 'assistant', content: text }])
  }

  // Voice record (do not transcribe locally). Attach to a separate send call
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : undefined
    const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
    chunksRef.current = []
    mr.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime || 'audio/webm' })
      setAudioBlob(blob)
      stream.getTracks().forEach(t => t.stop())
    }
    mr.start()
    mediaRecorderRef.current = mr
    setIsRecording(true)
  }
  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false) }
  const sendAudio = async () => {
    if (!audioBlob || !chatId) return
    setMessages((m) => [...m, { role: 'user', content: '[Voice message]' }])
    const form = new FormData()
    form.append('audio', new File([audioBlob], 'voice.webm', { type: audioBlob.type }))
    form.append('chatId', chatId)
    const r = await fetch('/api/ai/voice-chat', { method: 'POST', body: form })
    const j = await r.json()
    const text = j?.result || ''
    setMessages((m) => [...m, { role: 'assistant', content: text }])
    setAudioBlob(null)
  }

  const onUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget
    const file = inputEl.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    await fetch('/api/kb/upload', { method: 'POST', body: form })
    try { inputEl.value = '' } catch {}
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <Card className={m.role === 'user' ? 'max-w-[75%] bg-blue-600 text-white' : 'max-w-[75%]'}>
              <CardContent className="p-4 prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              </CardContent>
            </Card>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t p-4 bg-white/70 backdrop-blur">
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" className="hidden" onChange={onUploadDoc} />
          <Button variant="outline" onClick={() => fileRef.current?.click()} title="Upload medical document">Upload</Button>
          <Input
            placeholder="Ask anything about your health data, labs, goals…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          {!isRecording ? (
            <Button variant="outline" onClick={startRecording} title="Record voice">
              <Mic className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="destructive" onClick={stopRecording} title="Stop">
              <Mic className="h-4 w-4" />
            </Button>
          )}
          <Button onClick={send} title="Send"><Send className="h-4 w-4" /></Button>
          {audioBlob && (
            <Button onClick={sendAudio} title="Send voice">Send voice</Button>
          )}
        </div>
      </div>
    </div>
  )
}


