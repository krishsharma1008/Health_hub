import Database from 'better-sqlite3'
import path from 'path'
import OpenAI from 'openai'

class VectorStore {
  constructor() {
    this.db = new Database(path.join(process.cwd(), 'vector.db'))
    this.openai = new OpenAI({ apiKey: (process.env.OPENAI_API_KEY || '').trim() })
    this.initTables()
  }

  initTables() {
    // Plain tables (no sqlite-vss dependency). We will do cosine similarity in JS.
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id TEXT PRIMARY KEY,
        content_embedding TEXT NOT NULL -- JSON array of numbers
      );
      
      CREATE TABLE IF NOT EXISTS document_chunks (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        document_title TEXT,
        chunk_text TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        document_type TEXT NOT NULL,
        source_file TEXT,
        metadata TEXT,
        created_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS citations (
        id TEXT PRIMARY KEY,
        chunk_id TEXT NOT NULL,
        citation_text TEXT NOT NULL,
        relevance_score REAL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(chunk_id) REFERENCES document_chunks(id)
      );
    `)
  }

  async chunkText(text, maxChunkSize = 1000, overlap = 200) {
    const chunks = []
    const words = text.split(/\s+/)
    
    for (let i = 0; i < words.length; i += maxChunkSize - overlap) {
      const chunk = words.slice(i, i + maxChunkSize).join(' ')
      if (chunk.trim()) {
        chunks.push({
          text: chunk.trim(),
          index: Math.floor(i / (maxChunkSize - overlap))
        })
      }
    }
    
    return chunks
  }

  async generateEmbedding(text) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        // No API key available; return a deterministic fake vector to avoid failures in demo
        const pseudo = new Array(256).fill(0).map((_, i) => {
          const c = text.charCodeAt(i % text.length) || 0
          return ((Math.sin(c + i) + 1) / 2) // 0..1
        })
        return pseudo
      }
      try {
        const response = await this.openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: text.slice(0, 8192)
        })
        return response.data[0].embedding
      } catch (apiError) {
        // On auth/quota errors, fall back to pseudo vector so app keeps working
        const pseudo = new Array(256).fill(0).map((_, i) => {
          const c = text.charCodeAt(i % text.length) || 0
          return ((Math.sin(c + i) + 1) / 2)
        })
        return pseudo
      }
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw error
    }
  }

  async addDocument(document) {
    const { id, title, content, type, sourceFile = null } = document
    
    try {
      // Chunk the document
      const chunks = await this.chunkText(content)
      
      // Process each chunk
      for (const chunk of chunks) {
        const chunkId = `${id}_chunk_${chunk.index}`
        
        // Generate embedding
        const embedding = await this.generateEmbedding(chunk.text)
        
        // Store chunk
        this.db.prepare(`
          INSERT OR REPLACE INTO document_chunks 
          (id, document_id, document_title, chunk_text, chunk_index, document_type, source_file, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(chunkId, id, title, chunk.text, chunk.index, type, sourceFile, Date.now())
        
        // Store embedding
        this.db.prepare(`
          INSERT OR REPLACE INTO embeddings (id, content_embedding)
          VALUES (?, ?)
        `).run(chunkId, JSON.stringify(embedding))
      }
      
      return { success: true, chunksCreated: chunks.length }
    } catch (error) {
      console.error('Error adding document:', error)
      throw error
    }
  }

  async search(query, limit = 5, threshold = 0.7) {
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query)
      
      // Fetch all chunks with embeddings and compute cosine similarity in JS
      const rows = this.db.prepare(`
        SELECT 
          dc.id,
          dc.document_id,
          dc.document_title,
          dc.chunk_text,
          dc.chunk_index,
          dc.document_type,
          dc.source_file,
          e.content_embedding as embedding
        FROM document_chunks dc
        JOIN embeddings e ON e.id = dc.id
      `).all()

      const scored = []
      for (const row of rows) {
        try {
          const emb = JSON.parse(row.embedding)
          const score = this.cosineSimilarity(queryEmbedding, emb)
          scored.push({
            id: row.id,
            document_id: row.document_id,
            document_title: row.document_title,
            chunk_text: row.chunk_text,
            chunk_index: row.chunk_index,
            document_type: row.document_type,
            source_file: row.source_file,
            relevanceScore: score,
          })
        } catch {}
      }

      const results = scored
        .filter(r => r.relevanceScore >= threshold)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit)
        .map(r => ({ ...r, citation: this.generateCitation(r) }))

      return results
    } catch (error) {
      console.error('Error searching vectors:', error)
      // Fail soft: no context, empty results
      return []
    }
  }

  cosineSimilarity(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0
    let dot = 0, na = 0, nb = 0
    for (let i = 0; i < a.length; i++) {
      const x = a[i]
      const y = b[i]
      dot += x * y
      na += x * x
      nb += y * y
    }
    if (na === 0 || nb === 0) return 0
    return dot / (Math.sqrt(na) * Math.sqrt(nb))
  }

  generateCitation(chunk) {
    const { document_title, document_type, source_file, chunk_index } = chunk
    
    if (source_file) {
      return `${document_title} (${source_file}, section ${chunk_index + 1})`
    }
    
    return `${document_title} (${document_type}, section ${chunk_index + 1})`
  }

  async getContext(query, maxTokens = 4000) {
    const results = await this.search(query, 10)
    
    let context = ''
    let citations = []
    let tokenCount = 0
    
    for (const result of results) {
      const chunkText = result.chunk_text
      const estimatedTokens = Math.ceil(chunkText.length / 4) // Rough token estimation
      
      if (tokenCount + estimatedTokens > maxTokens) {
        break
      }
      
      context += `\n\n[Source: ${result.citation}]\n${chunkText}`
      citations.push({
        id: result.id,
        title: result.document_title,
        citation: result.citation,
        relevanceScore: result.relevanceScore,
        type: result.document_type
      })
      
      tokenCount += estimatedTokens
    }
    
    return { context, citations, tokenCount }
  }

  close() {
    this.db.close()
  }
}

export default VectorStore
