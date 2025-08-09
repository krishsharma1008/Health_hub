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

const app = express()
const port = process.env.PORT || 3001

app.use(express.json({ limit: '1mb' }))
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: false,
}))

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
// Chat history DB (SQLite)
const db = new Database(path.join(process.cwd(), 'chat.db'))
db.exec(`CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT
);
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(chat_id) REFERENCES chats(id)
);`)

// Knowledge base documents
db.exec(`CREATE TABLE IF NOT EXISTS kb_docs (
  id TEXT PRIMARY KEY,
  title TEXT,
  text TEXT,
  created_at INTEGER NOT NULL
);`)

// Long-term memory
db.exec(`CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(profile_id) REFERENCES profiles(id)
);`)
// Map chats to profiles
db.exec(`CREATE TABLE IF NOT EXISTS chat_meta (
  chat_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  FOREIGN KEY(chat_id) REFERENCES chats(id),
  FOREIGN KEY(profile_id) REFERENCES profiles(id)
);`)

// Chat summaries (for sidebar previews)
db.exec(`CREATE TABLE IF NOT EXISTS chat_summaries (
  chat_id TEXT PRIMARY KEY,
  summary TEXT,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(chat_id) REFERENCES chats(id)
);`)

// Symptoms extracted from chats
db.exec(`CREATE TABLE IF NOT EXISTS symptoms (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  name TEXT NOT NULL,
  severity INTEGER,
  duration TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(chat_id) REFERENCES chats(id)
);`)

// Ensure default profile
db.prepare('INSERT OR IGNORE INTO profiles (id, name) VALUES (?, ?)').run('default', 'Default User')

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

function safeReadJson(filePath, fallback) {
  try {
    const full = path.join(process.cwd(), filePath)
    if (fs.existsSync(full)) {
      const raw = fs.readFileSync(full, 'utf8')
      return JSON.parse(raw)
    }
  } catch (e) {
    console.warn('Failed to read json', filePath, e)
  }
  return fallback
}

function selectKbContext(query, limit = 2) {
  const q = (query || '').toLowerCase().slice(0, 200)
  if (!q) return []
  try {
    const rows = db.prepare('SELECT id, title, text FROM kb_docs ORDER BY created_at DESC').all()
    const scored = rows.map(r => ({
      ...r,
      score: (r.text || '').toLowerCase().includes(q) ? 2 : 0
    })).filter(r => r.score > 0).slice(0, limit)
    return scored.map(r => `Doc: ${r.title || r.id}\n${(r.text || '').slice(0, 3000)}`)
  } catch {
    return []
  }
}

function buildGlobalContext(userText, profileId = 'default') {
  const labs = safeReadJson('server/data/labs.json', [])
  const records = safeReadJson('server/data/records.json', [])
  const plans = safeReadJson('server/data/health_plans.json', [])
  const kb = selectKbContext(userText, 3)
  const memRows = db.prepare('SELECT key, value FROM memories WHERE profile_id = ? ORDER BY created_at DESC LIMIT 5').all(profileId)
  const parts = []
  if (labs?.length) parts.push(`Labs JSON: ${JSON.stringify(labs).slice(0, 6000)}`)
  if (records?.length) parts.push(`Health Records JSON: ${JSON.stringify(records).slice(0, 6000)}`)
  if (plans?.length) parts.push(`Health Plans JSON: ${JSON.stringify(plans).slice(0, 6000)}`)
  if (kb.length) parts.push(`Knowledge Base:\n${kb.join('\n\n')}`)
  if (memRows?.length) parts.push(`Memories:\n${memRows.map(m => `${m.key}: ${m.value}`).join('\n')}`)
  return parts.length ? parts.join('\n\n') : ''
}
function getProfileIdForChat(chatId) {
  try {
    const row = db.prepare('SELECT profile_id FROM chat_meta WHERE chat_id = ?').get(chatId)
    return row?.profile_id || 'default'
  } catch {
    return 'default'
  }
}
async function extractAndStoreMemories(profileId, userText, assistantText) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'Extract at most 3 durable user facts/preferences from the conversation. Return JSON as {"memories":[{"key":"...","value":"..."}]}. Include only clinically useful facts (diet, allergies, conditions, goals, devices, schedules). Avoid transient details.' },
        { role: 'user', content: `User said: ${userText || ''}\nAssistant replied: ${assistantText || ''}` }
      ]
    })
    const raw = completion.choices?.[0]?.message?.content || ''
    let parsed = null
    try { parsed = JSON.parse(raw) } catch {}
    const items = parsed?.memories || []
    const insert = db.prepare('INSERT INTO memories (id, profile_id, key, value, created_at) VALUES (?, ?, ?, ?, ?)')
    const now = Date.now()
    for (const m of items) {
      if (m?.key && m?.value) {
        insert.run(uuidv4(), profileId, String(m.key).slice(0,128), String(m.value).slice(0,1024), now)
      }
    }
  } catch (e) {
    console.warn('memory extraction failed', e)
  }
}

async function updateChatSummary(chatId) {
  try {
    const rows = db.prepare('SELECT role, content FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT 10').all(chatId)
    const flattened = rows.reverse().map(r => `${r.role === 'user' ? 'User' : 'Assistant'}: ${r.content}`).join('\n')
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'Summarize the conversation in <= 20 words, focusing on the topic and key intent. Return plain text only.' },
        { role: 'user', content: flattened }
      ]
    })
    const summary = (completion.choices?.[0]?.message?.content || '').slice(0, 200)
    db.prepare('INSERT INTO chat_summaries (chat_id, summary, updated_at) VALUES (?, ?, ?) ON CONFLICT(chat_id) DO UPDATE SET summary=excluded.summary, updated_at=excluded.updated_at')
      .run(chatId, summary, Date.now())
  } catch (e) {
    // ignore
  }
}

async function extractSymptomsAndStore(chatId, userText, assistantText) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'From the exchange below, extract a small list (max 5) of symptoms if any. Return JSON as {"symptoms":[{"name":"...","severity":(1-10)|null,"duration":"..."}]} . If none, return {"symptoms":[]}. No other text.' },
        { role: 'user', content: `User: ${userText || ''}\nAssistant: ${assistantText || ''}` }
      ]
    })
    const raw = completion.choices?.[0]?.message?.content || ''
    let parsed = null
    try { parsed = JSON.parse(raw) } catch {}
    const items = parsed?.symptoms || []
    const insert = db.prepare('INSERT INTO symptoms (id, chat_id, name, severity, duration, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    const now = Date.now()
    for (const s of items) {
      if (s?.name) {
        insert.run(uuidv4(), chatId, String(s.name).slice(0,128), Number.isFinite(s.severity) ? Number(s.severity) : null, s?.duration ? String(s.duration).slice(0,128) : null, now)
      }
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Build a task-specific prompt from structured data
 */
function buildPrompt(task, data) {
  switch (task) {
    case 'symptom_analysis': {
      const { symptoms = [], severity = 5, duration = 'unknown', details = '' } = data || {}
      return [
        'You are a careful, evidence-focused clinical assistant. Provide clear, actionable guidance in plain English.',
        `Symptoms: ${symptoms.join(', ') || 'none provided'}`,
        `Overall severity (1-10): ${severity}`,
        `Duration: ${duration}`,
        details ? `Additional details: ${details}` : '',
        '',
        'Return:',
        '- Likely differentials (3-5) with brief rationale',
        '- Risk assessment and red flags',
        '- Home care guidance',
        '- When to seek urgent care vs routine follow-up',
      ].filter(Boolean).join('\n')
    }
    case 'lab_interpretation': {
      const { labResults = [] } = data || {}
      return [
        'You are an experienced internist interpreting routine lab panels for a patient.',
        'Interpret the following results, summarizing what is normal vs concerning and recommended next steps.',
        'Results:',
        JSON.stringify(labResults, null, 2),
        '',
        'Return concise paragraphs with bullet points for actions. Avoid medical jargon unless necessary.',
      ].join('\n')
    }
    case 'visit_prep_summary': {
      const { visitPrepData = {} } = data || {}
      return [
        'You are preparing a patient for a specialist visit. Create a succinct, patient-friendly one-page summary.',
        'Context JSON:',
        JSON.stringify(visitPrepData, null, 2),
        '',
        'Return sections:',
        '- Key talking points (bulleted)',
        '- Questions to ask (prioritized)',
        '- Items to bring/track',
        '- Follow-up checklist',
      ].join('\n')
    }
    case 'dashboard_summary': {
      const { recentSymptoms = [], flags = {}, upcoming = {} } = data || {}
      return [
        'Given recent health signals, produce a short dashboard summary for a health app.',
        `Recent symptoms: ${JSON.stringify(recentSymptoms)}`,
        `Flags: ${JSON.stringify(flags)}`,
        `Upcoming: ${JSON.stringify(upcoming)}`,
        '',
        'Return a compact summary (<= 120 words) plus 3 quick actions as bullets.',
      ].join('\n')
    }
    case 'nutrition_plan': {
      const { profile = {}, preferences = {}, goals = {} } = data || {}
      return [
        'You are a registered dietitian generating a hyper-personalized nutrition plan. Use evidence-based guidance and be practical.',
        'User Profile JSON:',
        JSON.stringify(profile, null, 2),
        'Preferences JSON:',
        JSON.stringify(preferences, null, 2),
        'Goals JSON:',
        JSON.stringify(goals, null, 2),
        '',
        'Return these sections:',
        '- Daily targets: calories and macros (protein, carbs, fat) with brief reasoning',
        '- 7-day meal plan (breakfast, lunch, dinner, 1-2 snacks) honoring constraints',
        '- Grocery list grouped by category (produce, proteins, pantry, dairy/alt, frozen)',
        '- Prep & batching tips for the week',
        '- Substitutions for allergies/preferences',
        '- Budget/time-saving suggestions',
      ].join('\n')
    }
    case 'general_assistant': {
      const { query = '', context = {} } = data || {}
      return [
        'You are a concise, friendly health copilot. Answer clearly. If the user asks to act, suggest concrete next steps.',
        `Context: ${JSON.stringify(context)}`,
        '',
        `User: ${typeof query === 'string' ? query : JSON.stringify(query)}`,
      ].join('\n')
    }
    default: {
      return typeof data === 'string' ? data : JSON.stringify(data)
    }
  }
}

app.post('/api/ai/generate', async (req, res) => {
  const { task, data, chatId } = req.body || {}
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY. Add it to your .env.' })
  }
  if (!task) {
    return res.status(400).json({ error: 'Missing task' })
  }

  try {
    const prompt = buildPrompt(task, data)
    const id = chatId || uuidv4()
    const profileId = getProfileIdForChat(id)
    const context = buildGlobalContext(typeof data === 'object' && data?.query ? data.query : '', profileId)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: 'You are a helpful, safe, and accurate medical information assistant. You do not provide diagnoses, only information and guidance.' },
        context ? { role: 'system', content: `Context for this user: ${context}` } : undefined,
        { role: 'user', content: prompt },
      ].filter(Boolean),
    })

    const message = completion.choices?.[0]?.message?.content || 'No response'
    // Persist to chat history
    const now = Date.now()
    db.prepare('INSERT OR IGNORE INTO chats (id, created_at) VALUES (?, ?)').run(id, now)
    db.prepare('INSERT OR IGNORE INTO chat_meta (chat_id, profile_id) VALUES (?, ?)').run(id, profileId)
    const insertMsg = db.prepare('INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)')
    insertMsg.run(uuidv4(), id, 'user', prompt, now)
    insertMsg.run(uuidv4(), id, 'assistant', message, Date.now())
    extractAndStoreMemories(profileId, (typeof data === 'object' && data?.query) ? String(data.query) : String(data), message)
    updateChatSummary(id)
    extractSymptomsAndStore(id, (typeof data === 'object' && data?.query) ? String(data.query) : String(data), message)
    res.json({ ok: true, task, result: message, chatId: id, profileId })
  } catch (error) {
    console.error('AI error:', error)
    res.status(500).json({ error: 'AI generation failed' })
  }
})

// Chat history endpoints
app.post('/api/chat', (req, res) => {
  const id = uuidv4()
  const { profileId } = req.body || {}
  const pid = profileId || 'default'
  db.prepare('INSERT INTO chats (id, created_at) VALUES (?, ?)').run(id, Date.now())
  db.prepare('INSERT OR IGNORE INTO chat_meta (chat_id, profile_id) VALUES (?, ?)').run(id, pid)
  res.json({ ok: true, chatId: id, profileId: pid })
})

app.get('/api/chat/:id', (req, res) => {
  const id = req.params.id
  const rows = db.prepare('SELECT role, content, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC').all(id)
  res.json({ ok: true, messages: rows })
})

app.get('/api/chats', (_req, res) => {
  const chats = db.prepare('SELECT id, created_at FROM chats ORDER BY created_at DESC LIMIT 100').all()
  const out = chats.map(c => {
    const last = db.prepare('SELECT MAX(created_at) as t FROM messages WHERE chat_id = ?').get(c.id)?.t || c.created_at
    const count = db.prepare('SELECT COUNT(*) as n FROM messages WHERE chat_id = ?').get(c.id)?.n || 0
    const summary = db.prepare('SELECT summary FROM chat_summaries WHERE chat_id = ?').get(c.id)?.summary || ''
    return { id: c.id, created_at: c.created_at, last_message_at: last, message_count: count, summary }
  })
  res.json({ ok: true, chats: out })
})

app.post('/api/chats/clear', (_req, res) => {
  db.exec('DELETE FROM messages; DELETE FROM chat_meta; DELETE FROM chats;')
  res.json({ ok: true })
})
app.post('/api/chat/:id/delete', (req, res) => {
  const id = req.params.id
  const del = db.transaction((chatId) => {
    db.prepare('DELETE FROM messages WHERE chat_id = ?').run(chatId)
    db.prepare('DELETE FROM chat_meta WHERE chat_id = ?').run(chatId)
    db.prepare('DELETE FROM chat_summaries WHERE chat_id = ?').run(chatId)
    db.prepare('DELETE FROM symptoms WHERE chat_id = ?').run(chatId)
    db.prepare('DELETE FROM chats WHERE id = ?').run(chatId)
  })
  del(id)
  res.json({ ok: true })
})
// Profiles
app.post('/api/profile', (req, res) => {
  const name = (req.body?.name || '').toString().slice(0, 64) || 'User'
  const id = uuidv4()
  db.prepare('INSERT INTO profiles (id, name) VALUES (?, ?)').run(id, name)
  res.json({ ok: true, profileId: id, name })
})
app.get('/api/profiles', (_req, res) => {
  const rows = db.prepare('SELECT id, name FROM profiles ORDER BY name ASC').all()
  res.json({ ok: true, profiles: rows })
})
// Transcript export
app.get('/api/transcript/:id', (req, res) => {
  const id = req.params.id
  const rows = db.prepare('SELECT role, content, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC').all(id)
  const md = rows.map(r => `### ${r.role === 'user' ? 'You' : 'Assistant'}\n\n${r.content}\n`).join('\n')
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
  res.send(md)
})

// Memory APIs
app.post('/api/memory', (req, res) => {
  const { key, value } = req.body || {}
  if (!key || !value) return res.status(400).json({ error: 'key and value required' })
  db.prepare('INSERT INTO memories (id, profile_id, key, value, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), 'default', key, value, Date.now())
  res.json({ ok: true })
})
app.get('/api/memory', (_req, res) => {
  const rows = db.prepare('SELECT key, value, created_at FROM memories WHERE profile_id = ? ORDER BY created_at DESC LIMIT 100').all('default')
  res.json({ ok: true, memories: rows })
})

// Audio upload + transcription to text
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => {
    const original = file.originalname || 'audio.webm'
    let ext = path.extname(original)
    if (!ext) {
      const mt = (file.mimetype || '').toLowerCase()
      if (mt.includes('webm')) ext = '.webm'
      else if (mt.includes('mp3') || mt.includes('mpeg')) ext = '.mp3'
      else if (mt.includes('wav')) ext = '.wav'
      else if (mt.includes('m4a') || mt.includes('mp4')) ext = '.m4a'
      else ext = '.webm'
    }
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    cb(null, unique)
  }
})
const upload = multer({ storage })
app.post('/api/ai/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY' })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No audio uploaded' })
    }
    const filepath = req.file.path
    // Transcribe: prefer whisper-1; pass filename to preserve ext
    const transcript = await openai.audio.transcriptions.create({ file: fs.createReadStream(filepath), model: 'whisper-1' })
    fs.unlink(filepath, () => {})
    res.json({ ok: true, text: transcript.text || transcript?.data?.text || '' })
  } catch (err) {
    console.error('Transcription error:', err)
    res.status(500).json({ error: 'Transcription failed' })
  }
})

// Voice chat: accept audio, transcode to mp3, send to model with audio input (fallback to transcribe)
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}
app.post('/api/ai/voice-chat', upload.single('audio'), async (req, res) => {
  const { chatId } = req.body || {}
  if (!req.file) return res.status(400).json({ error: 'No audio uploaded' })
  const inputPath = req.file.path
  const mp3Path = `${inputPath}.mp3`
  try {
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath).toFormat('mp3').on('error', reject).on('end', resolve).save(mp3Path)
    })
    const base64 = fs.readFileSync(mp3Path).toString('base64')
    let assistantText = ''
    try {
      // Try responses API with audio input
      const resp = await openai.responses.create({
        model: 'gpt-4o-mini',
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: 'Please understand this audio and answer succinctly with structured bullets where relevant.' },
              { type: 'input_audio', audio: { data: base64, format: 'mp3' } }
            ]
          }
        ]
      })
      // The SDK returns output as content array
      assistantText = resp.output_text || resp?.data?.[0]?.content?.[0]?.text || ''
    } catch (e) {
      // Fallback: transcribe then chat
      const transcript = await openai.audio.transcriptions.create({ file: fs.createReadStream(mp3Path), model: 'whisper-1' })
      const prompt = transcript.text || 'Transcription failed'
      const ctx = buildGlobalContext(prompt)
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          { role: 'system', content: 'You are a helpful, safe, and accurate medical information assistant.' },
          ctx ? { role: 'system', content: `Context for this user: ${ctx}` } : undefined,
          { role: 'user', content: prompt },
        ].filter(Boolean)
      })
      assistantText = completion.choices?.[0]?.message?.content || ''
    }

    const id = chatId || uuidv4()
    const now = Date.now()
    db.prepare('INSERT OR IGNORE INTO chats (id, created_at) VALUES (?, ?)').run(id, now)
    const insertMsg = db.prepare('INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)')
    insertMsg.run(uuidv4(), id, 'user', '[Audio message]', now)
    insertMsg.run(uuidv4(), id, 'assistant', assistantText, Date.now())
    updateChatSummary(id)
    extractSymptomsAndStore(id, '[Audio message]', assistantText)

    res.json({ ok: true, chatId: id, result: assistantText })
  } catch (err) {
    console.error('voice-chat error', err)
    res.status(500).json({ error: 'Voice chat failed' })
  } finally {
    try { fs.unlinkSync(inputPath) } catch {}
    try { fs.unlinkSync(mp3Path) } catch {}
  }
})

// Upload medical docs (any format). If text-like, store content; otherwise store name only.
app.post('/api/kb/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' })
    const full = req.file.path
    const now = Date.now()
    const id = uuidv4()
    let text = ''
    const mt = (req.file.mimetype || '').toLowerCase()
    if (mt.includes('text') || mt.includes('json')) {
      try { text = fs.readFileSync(full, 'utf8') } catch {}
    }
    db.prepare('INSERT INTO kb_docs (id, title, text, created_at) VALUES (?, ?, ?, ?)')
      .run(id, req.file.originalname, text, now)
    res.json({ ok: true, id })
  } catch (e) {
    console.error('kb upload error', e)
    res.status(500).json({ error: 'Upload failed' })
  }
})

app.listen(port, () => {
  console.log(`AI backend listening on http://localhost:${port}`)
})


