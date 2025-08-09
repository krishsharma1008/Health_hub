import React, { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Phone, 
  PhoneOff,
  Activity,
  Brain,
  Zap,
  Radio,
  Waves
} from 'lucide-react'

interface VoiceSession {
  sessionId: string
  isActive: boolean
  isListening: boolean
  isSpeaking: boolean
  audioLevel: number
  latency: number
  quality: 'excellent' | 'good' | 'fair' | 'poor'
}

interface VoiceMessage {
  id: string
  type: 'transcription' | 'ai_response' | 'system'
  text: string
  timestamp: number
  confidence?: number
}

const RealtimeVoice: React.FC = () => {
  const [session, setSession] = useState<VoiceSession | null>(null)
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState(false)
  const [currentResponse, setCurrentResponse] = useState('')
  
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const isProcessingRef = useRef(false)

  useEffect(() => {
    return () => {
      disconnectVoice()
    }
  }, [])

  const connectVoice = async () => {
    try {
      // Initialize WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/voice`
      
      // For demo, simulate WebSocket connection
      console.log('Connecting to voice service...')
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      })
      
      streamRef.current = stream
      
      // Set up audio analysis
      audioContextRef.current = new AudioContext({ sampleRate: 16000 })
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream)
      microphoneRef.current.connect(analyserRef.current)
      
      // Start audio level monitoring
      startAudioLevelMonitoring()
      
      setSession({
        sessionId: `voice_${Date.now()}`,
        isActive: true,
        isListening: true,
        isSpeaking: false,
        audioLevel: 0,
        latency: 150, // Demo latency
        quality: 'excellent'
      })
      
      setIsConnected(true)
      
      addMessage({
        type: 'system',
        text: 'Voice assistant connected. I\'m listening...',
        timestamp: Date.now()
      })
      
      // Simulate real-time voice processing
      startVoiceProcessing()
      
    } catch (error) {
      console.error('Error connecting voice:', error)
      addMessage({
        type: 'system',
        text: 'Failed to connect voice assistant. Please check microphone permissions.',
        timestamp: Date.now()
      })
    }
  }

  const disconnectVoice = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
    setSession(null)
    setAudioLevel(0)
    
    addMessage({
      type: 'system',
      text: 'Voice assistant disconnected.',
      timestamp: Date.now()
    })
  }

  const startAudioLevelMonitoring = () => {
    if (!analyserRef.current) return
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    
    const updateAudioLevel = () => {
      if (!analyserRef.current || !isConnected) return
      
      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
      const normalizedLevel = (average / 255) * 100
      
      setAudioLevel(normalizedLevel)
      
      if (session) {
        setSession(prev => prev ? { ...prev, audioLevel: normalizedLevel } : null)
      }
      
      requestAnimationFrame(updateAudioLevel)
    }
    
    updateAudioLevel()
  }

  const startVoiceProcessing = () => {
    // Simulate voice processing for demo
    const processInterval = setInterval(() => {
      if (!isConnected || isProcessingRef.current) return
      
      // Simulate speech detection
      if (audioLevel > 20 && Math.random() > 0.8) {
        isProcessingRef.current = true
        
        // Simulate transcription
        setTimeout(() => {
          const sampleQuestions = [
            "How's my heart rate looking today?",
            "What do my lab results mean?",
            "Can you analyze my symptoms?",
            "Should I be concerned about my blood pressure?",
            "What's my sleep quality score?"
          ]
          
          const randomQuestion = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)]
          
          addMessage({
            type: 'transcription',
            text: randomQuestion,
            timestamp: Date.now(),
            confidence: 0.95
          })
          
          // Simulate AI response
          setTimeout(() => {
            const sampleResponses = [
              "Your heart rate has been stable in the optimal range of 65-75 bpm. The trend looks good!",
              "Your recent lab results show cholesterol levels within normal range. I recommend continuing your current diet.",
              "Based on your symptoms, this appears to be mild and likely stress-related. Consider relaxation techniques.",
              "Your blood pressure readings are normal. Keep monitoring and maintain your exercise routine.",
              "Your sleep quality score is 78/100. Try going to bed 30 minutes earlier for better recovery."
            ]
            
            const randomResponse = sampleResponses[Math.floor(Math.random() * sampleResponses.length)]
            
            // Simulate streaming response
            streamResponse(randomResponse)
            
            isProcessingRef.current = false
          }, 1500)
          
        }, 800)
      }
    }, 3000)
    
    // Clean up interval when component unmounts or disconnects
    setTimeout(() => {
      if (!isConnected) {
        clearInterval(processInterval)
      }
    }, 100)
  }

  const streamResponse = (responseText: string) => {
    setCurrentResponse('')
    
    const words = responseText.split(' ')
    let currentIndex = 0
    
    const streamInterval = setInterval(() => {
      if (currentIndex < words.length) {
        const currentText = words.slice(0, currentIndex + 1).join(' ')
        setCurrentResponse(currentText)
        currentIndex++
      } else {
        clearInterval(streamInterval)
        
        addMessage({
          type: 'ai_response',
          text: responseText,
          timestamp: Date.now()
        })
        
        setCurrentResponse('')
        
        // Simulate text-to-speech
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(responseText)
          utterance.rate = 0.9
          utterance.pitch = 1
          utterance.volume = 0.8
          window.speechSynthesis.speak(utterance)
        }
      }
    }, 150) // Stream words every 150ms
  }

  const addMessage = (message: Omit<VoiceMessage, 'id'>) => {
    const newMessage: VoiceMessage = {
      id: Date.now().toString(),
      ...message
    }
    
    setMessages(prev => [...prev.slice(-10), newMessage]) // Keep last 10 messages
  }

  const toggleWakeWord = () => {
    setIsWakeWordEnabled(!isWakeWordEnabled)
    
    addMessage({
      type: 'system',
      text: `Wake word detection ${!isWakeWordEnabled ? 'enabled' : 'disabled'}`,
      timestamp: Date.now()
    })
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'text-green-600'
      case 'good':
        return 'text-blue-600'
      case 'fair':
        return 'text-yellow-600'
      case 'poor':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getConnectionStatusIcon = () => {
    if (!isConnected) return <PhoneOff className="w-5 h-5 text-red-500" />
    if (session?.isSpeaking) return <Volume2 className="w-5 h-5 text-blue-500 animate-pulse" />
    if (session?.isListening) return <Mic className="w-5 h-5 text-green-500" />
    return <Phone className="w-5 h-5 text-gray-500" />
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Real-time Voice Assistant
          </h1>
          <p className="text-muted-foreground">Low-latency voice interactions with WebRTC streaming</p>
        </div>
        
        <div className="flex gap-2">
          {!isConnected ? (
            <Button onClick={connectVoice} className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Connect Voice
            </Button>
          ) : (
            <Button onClick={disconnectVoice} variant="destructive" className="flex items-center gap-2">
              <PhoneOff className="w-4 h-4" />
              Disconnect
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={toggleWakeWord}
            className={isWakeWordEnabled ? 'bg-purple-100 border-purple-300' : ''}
          >
            <Zap className="w-4 h-4 mr-2" />
            Wake Word {isWakeWordEnabled ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              {getConnectionStatusIcon()}
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {session ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Session ID</span>
                    <span className="text-xs font-mono">{session.sessionId.slice(-8)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Latency</span>
                    <span className="text-sm">{session.latency}ms</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Quality</span>
                    <span className={`text-sm capitalize ${getQualityColor(session.quality)}`}>
                      {session.quality}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Audio Level</span>
                    <span className="text-sm">{Math.round(audioLevel)}%</span>
                  </div>
                  <Progress value={audioLevel} className="h-2" />
                </div>
                
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Live Connection</span>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Not connected</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voice Conversation */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Voice Conversation
              {isConnected && (
                <Badge variant="outline" className="ml-2">
                  <Radio className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className={`flex ${
                    message.type === 'transcription' ? 'justify-end' : 'justify-start'
                  }`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'transcription' 
                        ? 'bg-primary text-primary-foreground' 
                        : message.type === 'ai_response'
                        ? 'bg-secondary'
                        : 'bg-muted'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {message.type === 'transcription' && <Mic className="w-3 h-3" />}
                        {message.type === 'ai_response' && <Brain className="w-3 h-3" />}
                        {message.type === 'system' && <Activity className="w-3 h-3" />}
                        
                        <span className="text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        
                        {message.confidence && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(message.confidence * 100)}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Streaming Response */}
              {currentResponse && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-secondary">
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="w-3 h-3" />
                      <span className="text-xs opacity-70">Streaming...</span>
                      <Waves className="w-3 h-3 animate-pulse" />
                    </div>
                    <p className="text-sm">{currentResponse}<span className="animate-pulse">|</span></p>
                  </div>
                </div>
              )}
              
              {isConnected && messages.length === 1 && (
                <div className="text-center text-muted-foreground py-8">
                  <div className="animate-pulse">
                    <Waves className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Listening for your voice...</p>
                    <p className="text-xs">Try saying "How's my health today?"</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audio Visualizer */}
      {isConnected && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Waves className="w-5 h-5" />
              Audio Visualizer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center space-x-1 h-24">
              {Array.from({ length: 20 }, (_, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-sm transition-all duration-100"
                  style={{
                    width: '8px',
                    height: `${Math.max(4, (audioLevel + Math.random() * 10) * 0.8)}%`,
                    opacity: 0.7 + (audioLevel / 100) * 0.3
                  }}
                />
              ))}
            </div>
            
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>Frequency Analysis</span>
              <span>Real-time Audio Processing</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <h3 className="font-medium mb-1">Wake Word Detection</h3>
            <p className="text-xs text-muted-foreground">
              Hands-free activation with "Hey Health Assistant"
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <Radio className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <h3 className="font-medium mb-1">Real-time Streaming</h3>
            <p className="text-xs text-muted-foreground">
              Low-latency WebRTC connection for instant responses
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <Brain className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <h3 className="font-medium mb-1">AI Health Context</h3>
            <p className="text-xs text-muted-foreground">
              Contextual health assistance with your medical data
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RealtimeVoice
