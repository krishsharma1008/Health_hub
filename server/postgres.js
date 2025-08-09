import { Pool } from 'pg'

class PostgresClient {
  constructor(connectionString, ssl = false) {
    this.pool = new Pool({ connectionString, ssl })
  }

  async query(text, params = []) {
    const client = await this.pool.connect()
    try {
      const res = await client.query(text, params)
      return res
    } finally {
      client.release()
    }
  }

  async initSchema() {
    // Minimal tables for auth, profiles, and persistent memories
    await this.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'user',
        created_at BIGINT NOT NULL,
        last_login BIGINT,
        is_active BOOLEAN DEFAULT TRUE
      );
    `)

    await this.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT,
        encrypted_data TEXT,
        preferences TEXT,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `)

    await this.query(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        key_info TEXT NOT NULL,
        encrypted_value TEXT,
        category TEXT,
        confidence REAL DEFAULT 1.0,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `)
  }

  async close() {
    await this.pool.end()
  }
}

export default PostgresClient


