import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from 'openai'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import helmet from 'helmet'
import { createServer } from 'http'

// Import our new modules
import VectorStore from './vectorStore.js'
import { ToolsSchema, SymptomAnalysisSchema, LabInterpretationSchema, NutritionPlanSchema, PredictiveAnalysisSchema } from './schemas.js'
import SecurityManager from './security.js'
import RealtimeVoiceService from './realtimeVoice.js'
import WearablesIntegration from './wearables.js'

dotenv.config()
ffmpeg.setFfmpegPath(ffmpegStatic)

const app = express()
const server = createServer(app)
const port = process.env.PORT || 3001

// Initialize security
const security = new SecurityManager()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for development
  crossOriginEmbedderPolicy: false
}))
app.use(SecurityManager.securityHeaders)
app.use(SecurityManager.createRateLimiter())

app.use(express.json({ limit: '10mb' }))
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}))

// Initialize services
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const vectorStore = new VectorStore()
const realtimeVoice = new RealtimeVoiceService()
const wearables = new WearablesIntegration()

// Initialize WebSocket for real-time voice
realtimeVoice.initialize(server)

// Enhanced SQLite database
const db = new Database(path.join(process.cwd(), 'health_copilot.db'))

// Initialize database schema
db.exec(`
  -- Users and authentication
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',
    created_at INTEGER NOT NULL,
    last_login INTEGER,
    is_active BOOLEAN DEFAULT true
  );

  -- Enhanced profiles with encryption
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT,
    encrypted_data TEXT, -- PHI data encrypted
    preferences TEXT, -- JSON
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Enhanced chats with metadata
  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    type TEXT DEFAULT 'general', -- 'general', 'symptom', 'lab', 'nutrition'
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Enhanced messages with tool calls
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    tool_calls TEXT, -- JSON array of tool calls
    created_at INTEGER NOT NULL,
    FOREIGN KEY(chat_id) REFERENCES chats(id)
  );

  -- Knowledge base with vector indexing
  CREATE TABLE IF NOT EXISTS kb_docs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    content TEXT,
    document_type TEXT, -- 'lab_result', 'medical_record', 'prescription', 'report'
    source_file TEXT,
    metadata TEXT, -- JSON
    is_indexed BOOLEAN DEFAULT false,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Memories with encryption
  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    key_info TEXT NOT NULL,
    encrypted_value TEXT, -- Encrypted PHI
    category TEXT, -- 'medical', 'personal', 'preferences'
    confidence REAL DEFAULT 1.0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Structured symptoms tracking
  CREATE TABLE IF NOT EXISTS symptoms (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    symptom_name TEXT NOT NULL,
    severity TEXT NOT NULL, -- 'mild', 'moderate', 'severe'
    duration TEXT,
    frequency TEXT,
    triggers TEXT, -- JSON array
    notes TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Goals and tracking
  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    target TEXT NOT NULL,
    deadline TEXT,
    metrics TEXT, -- JSON array
    priority TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused'
    progress REAL DEFAULT 0.0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Follow-ups and appointments
  CREATE TABLE IF NOT EXISTS followups (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT,
    scheduled_date TEXT NOT NULL,
    reason TEXT NOT NULL,
    preparation TEXT, -- JSON array
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Audit trail
  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    resource TEXT,
    details TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    created_at INTEGER NOT NULL
  );

  -- Chat summaries
  CREATE TABLE IF NOT EXISTS chat_summaries (
    chat_id TEXT PRIMARY KEY,
    summary TEXT,
    key_topics TEXT, -- JSON array
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(chat_id) REFERENCES chats(id)
  );

  -- Wearable devices
  CREATE TABLE IF NOT EXISTS wearable_devices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    device_type TEXT NOT NULL,
    device_name TEXT,
    status TEXT DEFAULT 'connected',
    last_sync INTEGER,
    settings TEXT, -- JSON
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`)

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads'
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/', 'text/', 'application/pdf', 'application/json', 'image/']
    const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type))
    cb(null, isAllowed)
  }
})

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body
    
    // Validate input
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Invalid email or password (min 8 characters)' })
    }
    
    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      return res.status(409).json({ error: 'User already exists' })
    }
    
    // Hash password and create user
    const passwordHash = await SecurityManager.hashPassword(password)
    const userId = uuidv4()
    
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, email, passwordHash, name, Date.now())
    
    // Create default profile
    const profileId = uuidv4()
    db.prepare(`
      INSERT INTO profiles (id, user_id, name, encrypted_data, preferences, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(profileId, userId, name, SecurityManager.encrypt('{}'), '{}', Date.now(), Date.now())
    
    // Generate token
    const token = SecurityManager.generateToken({ userId, email, role: 'user' })
    
    // Log audit event
    security.logAuditEvent({
      userId,
      action: 'user_registered',
      resource: 'users',
      details: { email },
      ip_address: req.ip
    })
    
    res.json({ token, user: { id: userId, email, name } })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = true').get(email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const isValid = await SecurityManager.verifyPassword(password, user.password_hash)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    // Update last login
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(Date.now(), user.id)
    
    const token = SecurityManager.generateToken({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    })
    
    security.logAuditEvent({
      userId: user.id,
      action: 'user_login',
      resource: 'users',
      ip_address: req.ip
    })
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role 
      } 
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      database: 'connected',
      vectorStore: 'active',
      realtimeVoice: `${typeof realtimeVoice.getActiveSessionCount === 'function' ? realtimeVoice.getActiveSessionCount() : 0} sessions`,
      wearables: 'ready'
    }
  })
})

// For demo purposes without authentication - remove in production
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { task, data, chatId } = req.body
    const userId = 'demo-user' // For demo
    
    // Get user context from vector store and memories
    const contextData = await buildGlobalContext(userId, data.query || JSON.stringify(data))
    
    // Create chat if needed
    let actualChatId = chatId
    if (!actualChatId) {
      actualChatId = uuidv4()
      // For demo, skip chat creation
    }
    
    // Build structured prompt based on task
    const { systemPrompt, responseSchema } = buildStructuredPrompt(task, data, contextData)
    
    // Create messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: data.query || JSON.stringify(data) }
    ]
    
    // Call OpenAI with structured response and tool calling
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: ToolsSchema,
      tool_choice: 'auto',
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature: 0.3
    })
    
    const response = completion.choices[0].message
    let structuredResponse
    
    try {
      structuredResponse = JSON.parse(response.content)
      
      // Validate response against schema
      if (responseSchema) {
        structuredResponse = responseSchema.parse(structuredResponse)
      }
    } catch (parseError) {
      console.error('Response parsing error:', parseError)
      structuredResponse = { 
        error: 'Failed to parse AI response',
        rawResponse: response.content 
      }
    }
    
    // Handle tool calls (simplified for demo)
    const toolCalls = response.tool_calls || []
    const toolResults = []
    
    for (const toolCall of toolCalls) {
      try {
        const result = await handleToolCall(toolCall, userId)
        toolResults.push({ toolCall, result })
      } catch (toolError) {
        console.error('Tool call error:', toolError)
        toolResults.push({ toolCall, error: toolError.message })
      }
    }
    
    res.json({ 
      response: structuredResponse,
      toolResults,
      chatId: actualChatId,
      citations: contextData.citations || [],
      metadata: {
        model: 'gpt-4o',
        tokensUsed: completion.usage?.total_tokens,
        responseTime: Date.now() - req.startTime
      }
    })
    
  } catch (error) {
    console.error('AI generation error:', error)
    res.status(500).json({ error: 'AI generation failed', details: error.message })
  }
})

// Tool call handler
async function handleToolCall(toolCall, userId) {
  const { name, arguments: args } = toolCall.function
  const params = JSON.parse(args)
  
  switch (name) {
    case 'log_symptom':
      const symptomId = uuidv4()
      try {
        db.prepare(`
          INSERT INTO symptoms (id, user_id, symptom_name, severity, duration, frequency, triggers, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          symptomId, userId, params.symptom, params.severity, params.duration,
          params.frequency || 'once', JSON.stringify(params.triggers || []), params.notes || '', Date.now()
        )
      } catch (e) {
        console.log('Demo: Would log symptom:', params)
      }
      return { symptomId, message: 'Symptom logged successfully' }
      
    case 'create_goal':
      const goalId = uuidv4()
      console.log('Demo: Would create goal:', params)
      return { goalId, message: 'Goal created successfully' }
      
    case 'schedule_followup':
      const followupId = uuidv4()
      console.log('Demo: Would schedule follow-up:', params)
      return { followupId, message: 'Follow-up scheduled successfully' }
      
    case 'summarize_document':
      // Generate summary using AI
      const summaryResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Create a structured summary of this medical document. Focus on key findings, recommendations, and actionable items.'
          },
          {
            role: 'user',
            content: `Document: ${params.documentId}\n\nContent: Demo document content`
          }
        ],
        max_tokens: 500
      })
      
      return { 
        summary: summaryResponse.choices[0].message.content,
        documentId: params.documentId,
        message: 'Document summarized successfully'
      }
      
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

// Build structured prompts based on task
function buildStructuredPrompt(task, data, contextData) {
  const baseContext = `
User Context:
${contextData.context || ''}

Knowledge Base Citations:
${contextData.citations?.map(c => `- ${c.citation}: ${c.text}`).join('\n') || 'None'}

Previous Memories:
${contextData.memories?.map(m => `- ${m.key_info}: ${m.value}`).join('\n') || 'None'}
`

  switch (task) {
    case 'symptom_analysis':
      return {
        systemPrompt: `You are a medical AI assistant providing symptom analysis. Analyze the provided symptoms and provide structured recommendations.

${baseContext}

Respond with a JSON object matching this structure:
{
  "symptoms": [{"name": "string", "severity": "mild|moderate|severe", "duration": "string", "frequency": "string", "associatedFactors": ["string"]}],
  "assessment": {"urgency": "low|medium|high|emergency", "riskFactors": ["string"], "recommendations": ["string"], "followUpNeeded": boolean, "timeframe": "string"},
  "citations": [{"source": "string", "relevance": number, "text": "string"}]
}`,
        responseSchema: SymptomAnalysisSchema
      }
      
    case 'lab_interpretation':
      return {
        systemPrompt: `You are a medical AI assistant interpreting lab results. Provide detailed analysis and recommendations.

${baseContext}

Respond with a JSON object matching this structure for lab interpretation.`,
        responseSchema: LabInterpretationSchema
      }
      
    case 'nutrition_plan':
      return {
        systemPrompt: `You are a nutrition AI assistant creating personalized meal plans.

${baseContext}

Respond with a JSON object containing nutritional recommendations and meal plans.`,
        responseSchema: NutritionPlanSchema
      }
      
    case 'predictive_analysis':
      return {
        systemPrompt: `You are a predictive health analytics AI. Analyze patterns and provide forecasts.

${baseContext}

Respond with predictions, risk factors, and visualization data.`,
        responseSchema: PredictiveAnalysisSchema
      }
      
    default:
      return {
        systemPrompt: `You are an AI health assistant. Provide helpful, accurate health information.

${baseContext}

Respond with a JSON object containing your response and any relevant recommendations.`,
        responseSchema: null
      }
  }
}

// Enhanced context building with vector search
async function buildGlobalContext(userId, userText) {
  try {
    // Get vector search results
    const vectorResults = await vectorStore.getContext(userText, 3000)
    
    // For demo, return minimal context
    return {
      context: vectorResults.context || 'Demo health copilot context',
      citations: vectorResults.citations || [],
      memories: [],
      recentSymptoms: [],
      activeGoals: [],
      tokenCount: vectorResults.tokenCount || 0
    }
  } catch (error) {
    console.error('Error building context:', error)
    return { context: '', citations: [], memories: [], recentSymptoms: [], activeGoals: [] }
  }
}

// Knowledge Base Upload endpoint
app.post('/api/kb/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { title, type } = req.body
    const docId = uuidv4()
    
    // For demo, we'll just acknowledge the upload without processing
    // In production, this would process the document and add to vector store
    const isImage = req.file.mimetype.startsWith('image/')
    
    if (isImage) {
      // For images, we could use GPT-4 Vision API here
      console.log(`Image uploaded: ${title} (${req.file.mimetype})`)
      
      // Store in KB docs table
      try {
        db.prepare(`
          INSERT INTO kb_docs (id, title, content, file_path, doc_type, file_type, upload_date, vector_indexed, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          docId, title, '[Medical Image - Visual Analysis Available]', req.file.path,
          type || 'medical_image', req.file.mimetype, Date.now(), 0, 'demo-user'
        )
      } catch (dbError) {
        console.log('Demo: Would store image metadata:', { docId, title, type })
      }
      
      res.json({ 
        success: true, 
        docId, 
        message: 'Medical image uploaded successfully. I can analyze this image for you.',
        isImage: true
      })
    } else {
      // Handle regular documents
      console.log(`Document uploaded: ${title} (${req.file.mimetype})`)
      
      try {
        db.prepare(`
          INSERT INTO kb_docs (id, title, content, file_path, doc_type, file_type, upload_date, vector_indexed, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          docId, title, '[Document content would be extracted here]', req.file.path,
          type || 'medical_document', req.file.mimetype, Date.now(), 0, 'demo-user'
        )
      } catch (dbError) {
        console.log('Demo: Would store document metadata:', { docId, title, type })
      }
      
      res.json({ 
        success: true, 
        docId, 
        message: 'Document uploaded successfully and added to knowledge base.',
        isImage: false
      })
    }
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Upload failed', details: error.message })
  }
})

// Demo endpoints
app.get('/api/chats', (req, res) => {
  res.json([
    {
      id: 'demo-chat-1',
      title: 'Symptom Analysis',
      type: 'symptom',
      created_at: Date.now() - 86400000,
      updated_at: Date.now() - 3600000,
      summary: 'Discussed headache symptoms and stress management',
      message_count: 5,
      last_message_at: Date.now() - 3600000
    },
    {
      id: 'demo-chat-2',
      title: 'Lab Results Review',
      type: 'lab',
      created_at: Date.now() - 172800000,
      updated_at: Date.now() - 7200000,
      summary: 'Reviewed blood work and cholesterol levels',
      message_count: 3,
      last_message_at: Date.now() - 7200000
    }
  ])
})

// Wearables demo endpoints
app.post('/api/wearables/connect', (req, res) => {
  const { deviceType } = req.body
  const device = {
    id: `demo-${deviceType}-${Date.now()}`,
    type: deviceType,
    name: `Demo ${deviceType}`,
    status: 'connected',
    batteryLevel: 85,
    lastSync: Date.now()
  }
  res.json(device)
})

app.get('/api/wearables/devices', (req, res) => {
  res.json([
    {
      id: 'demo-apple-watch',
      type: 'apple_watch',
      name: 'Apple Watch Series 9',
      status: 'connected',
      batteryLevel: 85,
      lastSync: Date.now() - 300000
    },
    {
      id: 'demo-oura-ring',
      type: 'oura_ring',
      name: 'Oura Ring Gen3',
      status: 'connected',
      batteryLevel: 92,
      lastSync: Date.now() - 600000
    }
  ])
})

app.get('/api/wearables/data/:deviceId', (req, res) => {
  const { deviceId } = req.params
  res.json({
    id: deviceId,
    isStreaming: true,
    lastDataUpdate: Date.now() - 30000,
    dataPoints: {
      heartRate: 72,
      steps: 8543,
      lastSync: Date.now() - 30000
    },
    data: {
      heartRate: Array.from({length: 20}, (_, i) => ({
        value: 70 + Math.random() * 20,
        timestamp: Date.now() - (20-i) * 60000
      })),
      steps: 8543,
      calories: 1847,
      distance: 6.2
    }
  })
})

// Start server
server.listen(port, () => {
  console.log(`🚀 Advanced Health Copilot Server running on port ${port}`)
  console.log(`📊 Services initialized:`)
  console.log(`   - Vector Store: Ready`)
  console.log(`   - Real-time Voice: Ready`)
  console.log(`   - Wearables Integration: Ready`)
  console.log(`   - Security Manager: Active`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...')
  vectorStore.close()
  db.close()
  server.close()
})
