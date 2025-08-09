import { WebSocketServer } from 'ws'
import OpenAI from 'openai'
import { EventEmitter } from 'events'
import fs from 'fs'

export class RealtimeVoiceService extends EventEmitter {
  constructor() {
    super()
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    this.sessions = new Map()
    this.wss = null
  }

  initialize(server) {
    this.wss = new WebSocketServer({ server })
    
    this.wss.on('connection', (ws, req) => {
      const sessionId = this.generateSessionId()
      console.log(`New voice session: ${sessionId}`)
      
      const session = {
        id: sessionId,
        ws,
        isConnected: true,
        audioBuffer: [],
        context: [],
        lastActivity: Date.now()
      }
      
      this.sessions.set(sessionId, session)
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data)
          await this.handleMessage(sessionId, message)
        } catch (error) {
          console.error('Error handling voice message:', error)
          this.sendError(sessionId, 'Invalid message format')
        }
      })
      
      ws.on('close', () => {
        console.log(`Voice session closed: ${sessionId}`)
        this.sessions.delete(sessionId)
      })
      
      ws.on('error', (error) => {
        console.error(`WebSocket error for session ${sessionId}:`, error)
        this.sessions.delete(sessionId)
      })
      
      // Send initial connection message
      this.sendMessage(sessionId, {
        type: 'session_created',
        sessionId,
        capabilities: ['speech_to_text', 'text_to_speech', 'real_time_conversation']
      })
    })
  }

  async handleMessage(sessionId, message) {
    const session = this.sessions.get(sessionId)
    if (!session) return
    
    session.lastActivity = Date.now()
    
    switch (message.type) {
      case 'audio_chunk':
        await this.handleAudioChunk(sessionId, message.data)
        break
        
      case 'start_conversation':
        await this.startConversation(sessionId, message.context)
        break
        
      case 'end_conversation':
        await this.endConversation(sessionId)
        break
        
      case 'wake_word_detected':
        await this.handleWakeWord(sessionId)
        break
        
      default:
        this.sendError(sessionId, `Unknown message type: ${message.type}`)
    }
  }

  async handleAudioChunk(sessionId, audioData) {
    const session = this.sessions.get(sessionId)
    if (!session) return
    
    try {
      // Convert base64 audio to buffer
      const audioBuffer = Buffer.from(audioData, 'base64')
      
      // For real-time processing, we'd use streaming transcription
      // For now, we'll accumulate chunks and process when complete
      session.audioBuffer.push(audioBuffer)
      
      // If we have enough audio (e.g., 3 seconds), process it
      const totalSize = session.audioBuffer.reduce((sum, buf) => sum + buf.length, 0)
      if (totalSize > 48000) { // Approximate 3 seconds at 16kHz
        await this.processAudioBuffer(sessionId)
      }
      
    } catch (error) {
      console.error('Error processing audio chunk:', error)
      this.sendError(sessionId, 'Audio processing failed')
    }
  }

  async processAudioBuffer(sessionId) {
    const session = this.sessions.get(sessionId)
    if (!session || session.audioBuffer.length === 0) return
    
    try {
      // Combine audio chunks
      const combinedBuffer = Buffer.concat(session.audioBuffer)
      session.audioBuffer = []
      
      // Create a temporary file for Whisper
      const tempFile = `/tmp/audio_${sessionId}_${Date.now()}.wav`
      fs.writeFileSync(tempFile, combinedBuffer)
      
      // Transcribe with Whisper
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: 'whisper-1',
        response_format: 'json',
        temperature: 0.2
      })
      
      // Clean up temp file
      fs.unlinkSync(tempFile)
      
      if (transcription.text && transcription.text.trim()) {
        await this.processTranscribedText(sessionId, transcription.text)
      }
      
    } catch (error) {
      console.error('Error processing audio buffer:', error)
      this.sendError(sessionId, 'Transcription failed')
    }
  }

  async processTranscribedText(sessionId, text) {
    const session = this.sessions.get(sessionId)
    if (!session) return
    
    try {
      // Send transcription to client
      this.sendMessage(sessionId, {
        type: 'transcription',
        text
      })
      
      // Add to conversation context
      session.context.push({ role: 'user', content: text })
      
      // Generate AI response using GPT-4o with health context
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an AI health assistant providing real-time voice support. 
            Keep responses concise and conversational for voice interaction. 
            Focus on immediate help and actionable advice.
            If urgent medical attention is needed, clearly state this.`
          },
          ...session.context.slice(-10) // Keep last 10 exchanges
        ],
        max_tokens: 150,
        temperature: 0.7
      })
      
      const aiResponse = response.choices[0].message.content
      session.context.push({ role: 'assistant', content: aiResponse })
      
      // Send text response
      this.sendMessage(sessionId, {
        type: 'ai_response',
        text: aiResponse
      })
      
      // Generate speech
      await this.generateSpeech(sessionId, aiResponse)
      
    } catch (error) {
      console.error('Error processing transcribed text:', error)
      this.sendError(sessionId, 'AI processing failed')
    }
  }

  async generateSpeech(sessionId, text) {
    try {
      const speechResponse = await this.openai.audio.speech.create({
        model: 'tts-1-hd',
        voice: 'nova',
        input: text,
        response_format: 'mp3'
      })
      
      const audioBuffer = Buffer.from(await speechResponse.arrayBuffer())
      const audioBase64 = audioBuffer.toString('base64')
      
      this.sendMessage(sessionId, {
        type: 'ai_speech',
        audio: audioBase64,
        format: 'mp3'
      })
      
    } catch (error) {
      console.error('Error generating speech:', error)
      this.sendError(sessionId, 'Speech generation failed')
    }
  }

  async startConversation(sessionId, context = {}) {
    const session = this.sessions.get(sessionId)
    if (!session) return
    
    // Initialize conversation with health context
    session.context = [
      {
        role: 'system',
        content: `Starting voice health consultation. User context: ${JSON.stringify(context)}`
      }
    ]
    
    this.sendMessage(sessionId, {
      type: 'conversation_started',
      message: 'Voice health assistant is ready. How can I help you today?'
    })
  }

  async endConversation(sessionId) {
    const session = this.sessions.get(sessionId)
    if (!session) return
    
    // Save conversation summary
    if (session.context.length > 2) {
      try {
        const summary = await this.generateConversationSummary(session.context)
        this.emit('conversation_ended', { sessionId, summary, context: session.context })
      } catch (error) {
        console.error('Error generating conversation summary:', error)
      }
    }
    
    this.sendMessage(sessionId, {
      type: 'conversation_ended',
      message: 'Thank you for using the voice health assistant.'
    })
  }

  async generateConversationSummary(context) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Summarize this health consultation conversation in 2-3 sentences, highlighting key concerns and recommendations.'
          },
          {
            role: 'user',
            content: `Conversation: ${JSON.stringify(context)}`
          }
        ],
        max_tokens: 100
      })
      
      return response.choices[0].message.content
    } catch (error) {
      console.error('Error generating summary:', error)
      return 'Voice consultation completed'
    }
  }

  async handleWakeWord(sessionId) {
    const session = this.sessions.get(sessionId)
    if (!session) return
    
    this.sendMessage(sessionId, {
      type: 'wake_word_activated',
      message: 'I\'m listening...'
    })
    
    // Could trigger specific actions or change listening mode
  }

  sendMessage(sessionId, message) {
    const session = this.sessions.get(sessionId)
    if (session && session.ws.readyState === 1) { // WebSocket.OPEN
      session.ws.send(JSON.stringify(message))
    }
  }

  sendError(sessionId, error) {
    this.sendMessage(sessionId, {
      type: 'error',
      error
    })
  }

  generateSessionId() {
    return `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Clean up inactive sessions
  cleanupSessions() {
    const now = Date.now()
    const timeout = 30 * 60 * 1000 // 30 minutes
    
    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivity > timeout) {
        console.log(`Cleaning up inactive voice session: ${sessionId}`)
        session.ws.close()
        this.sessions.delete(sessionId)
      }
    }
  }

  getActiveSessionCount() {
    return this.sessions.size
  }
}

export default RealtimeVoiceService
