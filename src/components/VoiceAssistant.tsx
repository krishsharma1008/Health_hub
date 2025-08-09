import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Mic, Square, Volume2, VolumeX, Sparkles, X } from 'lucide-react'
import { generateFromAi } from '@/lib/api'

export function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const chunksRef = useRef<BlobPart[]>([])

  useEffect(() => {
    synthRef.current = window.speechSynthesis || null
    try {
      if (localStorage.getItem('voiceAssistantDismissed') === '1') {
        setDismissed(true)
      }
    } catch {}
  }, [])

  const speak = (text: string) => {
    if (!ttsEnabled || !synthRef.current) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 1
    utter.pitch = 1
    synthRef.current.cancel()
    synthRef.current.speak(utter)
  }

  const startRecording = async () => {
    try {
      setTranscript('')
      setResponse('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '')
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      chunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }
      mr.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: mime || 'audio/webm' })
          // Normalize extension for server-side MIME detection
          const ext = blob.type.includes('webm') ? 'webm' : blob.type.includes('mp3') ? 'mp3' : 'wav'
          const file = new File([blob], `voice.${ext}`, { type: blob.type })
          const form = new FormData()
          form.append('audio', file)
      const base = (import.meta as any).env?.VITE_API_BASE_URL
      const res = await fetch(base ? `${base}/api/ai/transcribe` : '/api/ai/transcribe', { method: 'POST', body: form })
          const json = await res.json()
          if (json?.text) setTranscript(json.text)
        } catch (err) {
          console.error(err)
        } finally {
          mediaStreamRef.current?.getTracks().forEach(t => t.stop())
          mediaStreamRef.current = null
        }
      }
      mr.start()
      mediaRecorderRef.current = mr
      setIsRecording(true)
    } catch (e) {
      console.error(e)
    }
  }

  const stopRecording = async () => {
    try {
      mediaRecorderRef.current?.stop()
    } finally {
      setIsRecording(false)
    }
  }

  const askAi = async () => {
    if (!transcript) return
    const result = await generateFromAi({ task: 'general_assistant', data: { query: transcript } })
    
    // Extract the actual response text from the structured JSON response
    let text = ''
    if (result && typeof result === 'object') {
      // Handle new structured response format
      if ((result as any).response?.response) {
        text = (result as any).response.response
      } else if ((result as any).response && typeof (result as any).response === 'string') {
        text = (result as any).response
      } else if ((result as any).result) {
        text = (result as any).result
      } else {
        // Fallback to stringifying the response if it's an object
        text = JSON.stringify((result as any).response || result, null, 2)
      }
    } else if (typeof result === 'string') {
      text = result
    }
    
    setResponse(text)
    speak(text)
  }

  const dismiss = () => {
    setDismissed(true)
    try { localStorage.setItem('voiceAssistantDismissed', '1') } catch {}
  }

  return (
    dismissed ? null : (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100%-1.5rem)]">
      <Card className="shadow-xl border-blue-100">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm">Voice Copilot</div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={() => setTtsEnabled(!ttsEnabled)}>
                {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={dismiss} aria-label="Dismiss voice copilot" title="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-gray-500">Record voice → transcribe → ask AI. MP3 stays local until upload.</div>
            <div className="flex gap-2">
              {!isRecording ? (
                <Button className="flex-1" onClick={startRecording}>
                  <Mic className="mr-2 h-4 w-4" /> Record
                </Button>
              ) : (
                <Button variant="destructive" className="flex-1" onClick={stopRecording}>
                  <Square className="mr-2 h-4 w-4" /> Stop
                </Button>
              )}
              <Button variant="outline" onClick={askAi} disabled={!transcript}>
                <Sparkles className="mr-2 h-4 w-4" /> Ask
              </Button>
            </div>
          </div>

          {transcript && (
            <div className="p-2 rounded bg-gray-50 text-xs">
              <div className="font-medium mb-1">You</div>
              <div className="whitespace-pre-wrap">{transcript}</div>
            </div>
          )}
          {response && (
            <div className="p-2 rounded bg-blue-50 text-xs">
              <div className="font-medium mb-1">Assistant</div>
              <div className="whitespace-pre-wrap">
                {response.split(/\n\n+/).map((para, idx) => (
                  <p key={idx} className="mb-2">
                    {para.split(/\n-\s+/).map((part, jdx) => (
                      jdx === 0 ? (
                        <span key={jdx}>{part}</span>
                      ) : (
                        <div key={jdx} className="flex items-start gap-2"><span>•</span><span>{part}</span></div>
                      )
                    ))}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    )
  )
}


